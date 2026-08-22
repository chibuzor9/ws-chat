import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const groupRole = pgEnum("group_role", ["admin", "member"]);
export const messageKind = pgEnum("message_kind", ["dm", "gc"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: groupRole("role").default("member").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.userId] }),
    index("group_members_user_id_idx").on(table.userId),
    uniqueIndex("one_admin_per_group")
      .on(table.groupId)
      .where(sql`${table.role} = 'admin'`),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: messageKind("kind").notNull(),
    senderId: uuid("sender_id").notNull().references(() => users.id),
    receiverUserId: uuid("receiver_user_id").references(() => users.id),
    receiverGroupId: uuid("receiver_group_id").references(() => groups.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "receiver_matches_kind",
      sql`(
        (${table.kind} = 'dm' AND ${table.receiverUserId} IS NOT NULL AND ${table.receiverGroupId} IS NULL)
        OR (${table.kind} = 'gc' AND ${table.receiverGroupId} IS NOT NULL AND ${table.receiverUserId} IS NULL)
      )`,
    ),
    check("message_content_not_empty", sql`length(trim(${table.content})) > 0`),
    index("messages_dm_idx")
      .on(table.senderId, table.receiverUserId, table.createdAt.desc(), table.id.desc())
      .where(sql`${table.kind} = 'dm'`),
    index("messages_dm_reverse_idx")
      .on(table.receiverUserId, table.senderId, table.createdAt.desc(), table.id.desc())
      .where(sql`${table.kind} = 'dm'`),
    index("messages_group_idx")
      .on(table.receiverGroupId, table.createdAt.desc(), table.id.desc())
      .where(sql`${table.kind} = 'gc'`),
  ],
);
