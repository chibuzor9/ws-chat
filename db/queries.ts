import { db } from "../db/index.ts";
import {users, messages, groups, groupMembers} from "../db/schema.ts";
import { eq } from "drizzle-orm";

const messageKind = {
    DM: "dm",
    GC: "gc"
} as const;

const getUserByUsername = async (username: string) => {
    const [user] = await db
        .select({
            id: users.id,
            username: users.username
        })
        .from(users)
        .where(eq(users.username, username));

    return user ?? null;
}

const appendUsername = async (username: string) => {
    const [user] = await db
        .insert(users)
        .values({ username })
        .returning({ id: users.id, username: users.username });

    return user ?? null;
}

const handleClientDisconnection = async (username: string) => {
    const user = await db
        .update(users)
        .set({ lastSeenAt: new Date() })
        .where(eq(users.username, username));
}

const insertDirectMessage = async ({ senderId, receiverUserId, content }: { senderId: string; receiverUserId: string; content: string }) => {
    const [row] = await db
        .insert(messages)
        .values({
            kind: messageKind.DM,
            senderId,
            receiverUserId,
            content
        })
        .returning({ id: messages.id, createdAt: messages.createdAt });

    return row;
}

const insertGroupMessage = async ({ senderId, receiverGroupId, content }: { senderId: string; receiverGroupId: string; content: string }) => {
    const [row] = await db
        .insert(messages)
        .values({
            kind: messageKind.GC,
            senderId,
            receiverGroupId,
            content,
            createdAt: new Date()
        })
        .returning({ id: messages.id, createdAt: messages.createdAt });

    return row;
}

const getGroupLabels = async () => {
    const rows = await db
        .select({
            id: groups.id,
            label: groups.label
        })
        .from(groups);

    return rows;
}

const getUserLabels = async () => {
    const rows = await db
        .select({
            id: users.id,
            username: users.username
        })
        .from(users);

    return rows;
}

const getGroupMembers = async (groupId: string) => {
    const rows = await db
        .select({
            userId: groupMembers.userId
        })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

    return rows;
}

export default {
    getUserByUsername,
    appendUsername,
    handleClientDisconnection,
    insertDirectMessage,
    insertGroupMessage,
    getGroupLabels,
    getUserLabels,
    getGroupMembers
}
