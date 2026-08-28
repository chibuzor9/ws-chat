import { db } from "../db/index.ts";
import {users, messages, groups, groupMembers, groupRole, messageKind} from "../db/schema.ts";
import { eq, ne, and, or, asc } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

type AddGroupMemberInput = {
    groupId: string;
    userId: string;
    role: typeof groupRole.enumValues[number];
    executor?: Executor;
}


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

const insertDirectMessage = async ({ senderId, receiverUserId, content }: { senderId: string; receiverUserId: string; content: string }) => {
    const [row] = await db
        .insert(messages)
        .values({
            kind: messageKind.enumValues[0],
            senderId,
            receiverUserId,
            content
        })
        .returning({ 
            id: messages.id, 
            createdAt: messages.createdAt,
            kind: messages.kind,
            senderId: messages.senderId,
            receiverUserId: messages.receiverUserId,
            content: messages.content
         });

    return row;
}

const insertGroupMessage = async ({ senderId, receiverGroupId, content }: { senderId: string; receiverGroupId: string; content: string }) => {
    const [row] = await db
        .insert(messages)
        .values({
            kind: messageKind.enumValues[1],
            senderId,
            receiverGroupId,
            content
        })
        .returning({ id: messages.id, receiverGroupId: messages.receiverGroupId, content: messages.content, createdAt: messages.createdAt });

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

const getUserLabels = async (excludeUsername: string) => {
    const rows = await db
        .select({
            id: users.id,
            username: users.username
        })
        .from(users)
        .where(ne(users.username, excludeUsername));

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

const getDirectMessages = async (userAId: string, userBId: string) => {
    return await db
        .select()
        .from(messages)
        .where(
            and(
                eq(messages.kind, messageKind.enumValues[0]),
                or(
                    and(
                        eq(messages.senderId, userAId),
                        eq(messages.receiverUserId, userBId)
                    ),
                    and(
                        eq(messages.senderId, userBId),
                        eq(messages.receiverUserId, userAId)
                    )
                )
            )
        )
        .orderBy(asc(messages.createdAt));
};

const getGroupMessages = async (groupId: string) => {
    return await db
        .select()
        .from(messages)
        .where(
            and(
                eq(messages.kind, messageKind.enumValues[1]),
                eq(messages.receiverGroupId, groupId)
            )
        )
        .orderBy(asc(messages.createdAt));
};

const updateLastSeen = async (userId: string) => {
    await db
        .update(users)
        .set({ lastSeenAt: new Date() })
        .where(eq(users.id, userId));
}

const addGroupMember = async ({ 
    groupId, 
    userId, 
    role = groupRole.enumValues[1], 
    executor = db 
} : AddGroupMemberInput) => {
    const [member] = await executor
        .insert(groupMembers)
        .values({ 
            groupId, 
            userId, 
            role
        })
        .returning({ groupId: groupMembers.groupId, userId: groupMembers.userId, role: groupMembers.role });

    return member;
}

const createGroup = async (label: string, createdBy: string) => {
    return await db.transaction(async (tx) => {
        const [group] = await tx
            .insert(groups)
            .values({ label, createdBy })
            .returning({ id: groups.id, label: groups.label });

        await addGroupMember({ groupId: group.id, userId: createdBy, role: groupRole.enumValues[0], executor: tx });

        return group;
    });
}

export default {
    getUserByUsername,
    appendUsername,
    insertDirectMessage,
    insertGroupMessage,
    getGroupLabels,
    getUserLabels,
    getGroupMembers,
    getDirectMessages,
    updateLastSeen,
    getGroupMessages,
    addGroupMember,
    createGroup
}
