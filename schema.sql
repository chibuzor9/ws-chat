-- ws-chat schema (PostgreSQL)
-- Draft

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
-- username is UNIQUE because the server already assumes it is: usernameTOID
-- is a 1:1 map and INIT rejects duplicates. That rule currently lives only in
-- JavaScript, so the DB should enforce it too.

CREATE TABLE users (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username    text        NOT NULL UNIQUE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz,
    deleted_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
-- created_by is SET NULL rather than CASCADE: deleting the person who made a
-- group should not delete the group and everyone else's history with it.

CREATE TABLE groups (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label       text        NOT NULL,
    created_by  uuid        REFERENCES users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- group_members  (junction table: users <-> groups, many-to-many)
-- ---------------------------------------------------------------------------
-- This replaces the `members` array on groups. One row per membership, both
-- sides real foreign keys, so the DB can guarantee every member is a real user
-- and every membership points at a real group.
--
-- `role` lives here, not on groups: a role is held by one person in one group.
-- On groups it could only describe the group as a whole.

CREATE TYPE group_role AS ENUM ('admin', 'member');

CREATE TABLE group_members (
    group_id   uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id    uuid        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    role       group_role  NOT NULL DEFAULT 'member',
    joined_at  timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (group_id, user_id)   -- also blocks joining the same group twice
);

-- The composite PK indexes group -> users (fan-out: who receives this message).
-- This one covers the reverse, user -> groups (on connect: what do I subscribe to).
CREATE INDEX group_members_user_id_idx ON group_members (user_id);


-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
-- Two nullable receiver columns instead of one polymorphic receiver_id, so both
-- can be real foreign keys. A single column pointing at "users OR groups" can
-- carry no FK constraint at all, which means nothing stops a message addressed
-- to an id that does not exist.
--
-- The CHECK keeps `kind` honest: it cannot claim 'dm' while a group is filled in.

CREATE TYPE message_kind AS ENUM ('dm', 'gc');

CREATE TABLE messages (
    id                 uuid    PRIMARY KEY,
    kind               message_kind NOT NULL,
    sender_id          uuid         NOT NULL REFERENCES users(id),
    receiver_user_id   uuid         REFERENCES users(id)  ON DELETE CASCADE,
    receiver_group_id  uuid         REFERENCES groups(id) ON DELETE CASCADE,
    content            text         NOT NULL,
    created_at         timestamptz  NOT NULL DEFAULT now(),

    CONSTRAINT receiver_matches_kind CHECK (
           (kind = 'dm' AND receiver_user_id  IS NOT NULL AND receiver_group_id IS NULL)
        OR (kind = 'gc' AND receiver_group_id IS NOT NULL AND receiver_user_id  IS NULL)
    ),

    CONSTRAINT message_content_not_empty CHECK (length(trim(content)) > 0)
);

-- created_at was missing from the original sketch. Postgress doesn't exactly
-- promise row-order for efficient lookups etc.

-- History reads. (created_at DESC, id DESC) matches "newest first" and gives a
-- stable tiebreaker for keyset pagination ("older than this timestamp/id"),
-- which does not drift when new messages arrive mid-scroll the way OFFSET does.
CREATE INDEX messages_dm_idx
    ON messages (sender_id, receiver_user_id, created_at DESC, id DESC)
    WHERE kind = 'dm';

-- A DM thread is both directions, so the reverse lookup needs its own index.
CREATE INDEX messages_dm_reverse_idx
    ON messages (receiver_user_id, sender_id, created_at DESC, id DESC)
    WHERE kind = 'dm';

CREATE INDEX messages_group_idx
    ON messages (receiver_group_id, created_at DESC, id DESC)
    WHERE kind = 'gc';


-- ---------------------------------------------------------------------------
-- NOTES / open decisions
-- ---------------------------------------------------------------------------
-- 1. no auth / session field on users
--
--    If reconnect-without-losing-your-session gets built, a client needs to
--    prove it is the same user rather than just claiming the username. That
--    means a token issued at INIT and stored client-side, which needs a column
--    here (or its own sessions table). Fine to skip on a trusted LAN - just a
--    decision, not an oversight.
--
-- 2. no read/delivery state
--
--    Nothing here tracks what a user has read, so unread badges in the sidebar
--    are not expressible yet. Probably a last_read_at per (user, conversation).
--
-- 3. retention
--
--    Deliberately no cleanup job. Messages are read on demand with a LIMIT, so
--    memory does not grow with history and there is nothing to relieve by
--    deleting. Add retention later if it is a product decision, not a memory one.
