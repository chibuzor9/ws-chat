# ws-chat

**Chat that never leaves your network.**

ws-chat is a self-hosted, on-prem chat server for the places a cloud service does not
belong — a house running it off the spare laptop that never sleeps, or a small firm that
would rather its messages never touched anyone else's hardware. Point it at a Postgres
database, open a port on the LAN, and that is the entire deployment.

I built it to learn WebSockets properly: not just the API, but the protocol underneath it
— what belongs on the wire, who is allowed to say it, and what breaks when a socket dies
mid-sentence. Both halves are hand-rolled, server and client, with no framework in
between.

It is still growing toward the real thing. If you find it as interesting as I do, leave a
star.

## Requirements

- **PostgreSQL** — any recent version.
- **Node.js 24.x** (developed on v24.19). The server imports `db/*.ts` directly from
  `server/*.js` with **no build step**, so it needs a Node version where TypeScript type
  stripping is on by default — 22.18+ or 23.6+. On older versions the server crashes on
  the very first import; run it with `--experimental-strip-types` or upgrade.

## Setup

Create a database, then a `.env` in the repository root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/ws_chat
PORT=8080
```

`PORT` is optional and defaults to `8080`. `.env` is gitignored.

```bash
npm install
npm run drizzle     # drizzle-kit generate && drizzle-kit migrate
npm run server      # ws://127.0.0.1:8080
```

Then the frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend connects to `ws://127.0.0.1:8080` by default. To point it elsewhere, add
`frontend/.env`:

```
VITE_WS_PORT=8080
```

There is no login. The first screen asks for a username, and that username *is* your
identity — see [Status](#status).

### A second user

Chat needs two people. Either open a second browser profile, or use the CLI client(don't for now):

```bash
npm run client
```

It is incomplete — it connects and initializes, but does not yet read stdin or print
incoming messages.

## Layout

| Path | What lives there |
| --- | --- |
| `shared/` | `Message` class and the `TYPES` enum. Imported by **both** halves. |
| `server/index.js` | Connection lifecycle: init timeout, close handling, error logging. |
| `server/messageHandler.js` | One switch over `Message.TYPES`. All server-side protocol. |
| `server/clients.js` | `clients` (userId → client) and `usernameTOID`. In-memory; the live truth for who is connected. |
| `db/schema.ts` | Drizzle schema. The source migrations are generated from. |
| `db/queries.ts` | Every query in the project. |
| `drizzle/` | Generated migrations. Do not hand-edit. |
| `frontend/src/App.jsx` | Owns the socket, reconnect/backoff, and all shared state. |
| `frontend/src/components/messageHandler.js` | Mirrors the server switch; returns plain objects for `App` to fold into state. |
| `client/` | CLI client, used as a second user for testing routing. Incomplete. |

## The `shared/` contract

This is the thing you will not guess from any single file: `shared/` is imported by the
server *and* the frontend, unbuilt, from both sides. Adding a message type means three
edits — the enum in `shared/messageTypes.js`, a `case` in the server switch, and the
matching `case` in the frontend switch. Miss the frontend and the server sends something
real that the client silently drops.

Every message on the wire is `{ type, content }`.

| Type | Direction | `content` |
| --- | --- | --- |
| `init` | client → server | `{ username }` |
| `init_ack` | server → client | `{ clientId, users[], groups[] }` |
| `chat` | both | out: `{ kind, receiver, message }` · in: `{ messageId, messageKind, senderId, receiverId, content, createdAt }` |
| `fetch_messages` | both | out: `{ conversationId, kind }` · in: `{ conversationId, messages, isMember, status?, lastSeenAt? }` |
| `create_group` | both | out: `{ groupLabel }` · in: `{ groupId, groupLabel }` |
| `membership` | client → server | `{ groupId, action: "join" \| "leave" }` |
| `ping` / `pong` | client → server / server → client | — |
| `error` | server → client | a string |

`kind` is `"dm"` or `"gc"` throughout, and it decides which branch runs on both sides.

Two behaviours worth knowing before you read the switch:

- **`membership` is answered with history, not an ack.** After a join or leave the server
  calls its own handler with a `fetch_messages`, so the reply to "I joined" is the group's
  message list. A bare ack would race: `ws` does not serialize handlers, so a
  client-issued follow-up fetch can be read before the membership write commits. Awaiting
  the handler moves the ordering guarantee from network timing to the call stack. The one
  exception is leaving as the sole member, which deletes the group and replies with
  `{ action: "leave", groupId, groupDeleted: true }`.
- **The server stamps sender and timestamp.** `chat` ignores any `sender` the client sends
  and uses the socket's own `client.id`; `created_at` is a database default.

## Data model

Four tables: `users`, `groups`, `group_members`, `messages`.

There is no `conversations` table. A message carries two nullable receiver columns —
`receiver_user_id` and `receiver_group_id` — disciplined by a check constraint rather
than by the type system:

```sql
(kind = 'dm' AND receiver_user_id IS NOT NULL AND receiver_group_id IS NULL)
OR (kind = 'gc' AND receiver_group_id IS NOT NULL AND receiver_user_id IS NULL)
```

The cost of that choice is visible everywhere: the sidebar merges two queries client-side
instead of doing one join, and every read path forks on `kind`.

`group_members` carries a partial unique index, `one_admin_per_group`, so a group has at
most one admin. Transferring admin therefore has to demote before it promotes, inside one
transaction — two admins for even an instant violates the constraint.

Groups are **globally visible but opt-in**: every user can see every group, and only
members can read or post in one. With no invite system, a scoped group list would mean no
user could ever find a group to join.

## Status

Working:

- Direct messages between two users, live, with history persisted across reconnects.
- Group creation, join/leave, and group messages visible only to members.
- Reconnect with exponential backoff (capped at 30s) and a retry modal after 10 attempts.
- Presence for DMs: online, or a last-seen timestamp.

Not built yet:

- **No authentication.** A username is *claimed*, not owned. `init` trusts whatever it is
  handed and only checks whether the name is taken right now — anyone can type a fresh
  name and start over. Do not deploy this as-is.
- **Errors are invisible.** The server sends `error` messages for every rejection; the
  frontend handler logs them to the console and stops there.
- **No read state**, no unread counts, no notifications.
- **Group presence** is hardcoded `inactive` on both sides.
- The CLI client cannot send or display messages.

## License

MIT — see [LICENSE](LICENSE).
