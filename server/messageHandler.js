import Message from "../shared/Message.js";
import clientsModule from './clients.js';
import dbModule from '../db/queries.ts';

const { clients, usernameTOID, getSocketByUsername, getSocketById } = clientsModule;
const {
    getUserByUsername,
    getUserById,
    appendUsername,
    insertDirectMessage,
    insertGroupMessage, 
    getGroupLabels,
    getUserLabels,
    getDirectMessages,
    getGroupMessages,
    getGroupMembers,
    createGroup,
    joinGroup,
    leaveGroup,
    updateLastSeen
} = dbModule;

const context = { clients, usernameTOID, getSocketByUsername, getSocketById };

const errorMessage = (error) => {
    return new Message({
        type: Message.TYPES.ERROR,
        content: error
    });
}

const initializationCheck = (client) => {
    if(!context.clients.has(client.id)) {
        client.socket.send(JSON.stringify(
            errorMessage("Client has not initialized yet.")
        ));
        return false;
    }

    return true;
};

const initializeClient = async (client, content) => {
    if (client.username) {
        client.socket.send(JSON.stringify(
            errorMessage("Client has already been initialized.")
        ));
        return;
    }

    const username = content.username;

    if (context.usernameTOID.has(username)) { // takeover logic
        const prevSocket = getSocketByUsername(username);

        console.log(`User ${username} is being taken over by another session. Closing previous connection.`);

        prevSocket.close(3000, "Another session has taken over this username.");
    }
    
    const userDbStatus = await getUserByUsername(username);

    client.id = userDbStatus 
        ? userDbStatus.id 
        : (await appendUsername(username)).id;

    client.username = username;    
    context.usernameTOID.set(client.username, client.id);
    context.clients.set(client.id, client);
    await updateLastSeen(client.id);

    const [users, groups] = await Promise.all([
        getUserLabels(client.username),
        getGroupLabels()
    ]);

    client.socket.send(JSON.stringify({ 
        type: Message.TYPES.INIT_ACK,
        content: {
            clientId: client.id,
            users: users.map((user) => {
                return { 
                    id: user.id, 
                    username: user.username,
                    status: context.clients.has(user.id) ? "online" : user.lastSeenAt
                };
            }),
            groups: groups.map((group) => {
                return {
                    id: group.id,
                    label: group.label
                };
            })
        }
    }));

    console.log(`User ${client.username} initialized with ID: ${client.id}`);
}

// const broadcastResponse = (response, excludeClientId = null) => {
//     context.clients.forEach((client) => {
//         if (client.id !== excludeClientId) {
//             client.socket.send(JSON.stringify(response));
//         }
//     });
// };

const messageHandler = async (client, message) => {
    const msgType = message.type;
    const msgContent = message.content;

    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msgType}`);
        return;
    }

    switch (msgType) {
        case Message.TYPES.PING: {
            if (!initializationCheck(client)) return;            

            client.socket.send(JSON.stringify({ 
                type: Message.TYPES.PONG,
                content: "Ping Acknowledged. Pong response sent."
            }));

            break;
        }
        case Message.TYPES.INIT: {
            await initializeClient(client, msgContent);
            break;
        }
        case Message.TYPES.CHAT: {
            if (!initializationCheck(client)) return;            
        
            if (msgContent.kind === "dm") {
                if (msgContent.receiver === client.id) {
                    client.socket.send(JSON.stringify(
                        errorMessage("You cannot send a direct message to yourself."))
                    );
                    return;
                }

                const newMessage = await insertDirectMessage({
                    senderId: client.id, 
                    receiverUserId: msgContent.receiver, 
                    content: msgContent.message
                });
                
                const response = new Message({
                    type: Message.TYPES.CHAT,
                    content: {
                        messageId: newMessage.id,
                        messageKind: newMessage.kind,
                        senderId: newMessage.senderId,
                        receiverId: newMessage.receiverUserId,
                        content: newMessage.content,
                        createdAt: newMessage.createdAt
                    }
                });
                
                client.socket.send(JSON.stringify(response));
                
                const receiverSocket = context.getSocketById(newMessage.receiverUserId);

                if (receiverSocket && receiverSocket.readyState === receiverSocket.OPEN) {
                    receiverSocket.send(JSON.stringify(response));
                }
            }

            if (msgContent.kind === "gc") {
                const groupMembers = await getGroupMembers(msgContent.receiver);

                if (!groupMembers.some((member) => member.userId === client.id)) {
                    client.socket.send(JSON.stringify(
                        errorMessage("You are not a member of this group.")
                    ));
                    return;
                }

                const newMessage = await insertGroupMessage({
                    senderId: client.id, 
                    receiverGroupId: msgContent.receiver, 
                    content: msgContent.message
                });
                
                const response = new Message({
                    type: Message.TYPES.CHAT,
                    content: {
                        messageId: newMessage.id,
                        messageKind: "gc",
                        senderId: client.id,
                        receiverId: newMessage.receiverGroupId,
                        content: newMessage.content,
                        createdAt: newMessage.createdAt
                    }
                });
                
                client.socket.send(JSON.stringify(response));
                
                groupMembers.forEach((member) => {
                    if (member.userId !== client.id) {
                        const memberSocket = context.getSocketById(member.userId);

                        if (memberSocket && memberSocket.readyState === memberSocket.OPEN) {
                            memberSocket.send(JSON.stringify(response));
                        }
                    }
                });
            }
            break;
        }
        case Message.TYPES.FETCH_MESSAGES: {
            if (!initializationCheck(client)) return;            

            if (msgContent.kind === "dm") {
                const [messages, recipient] = await Promise.all([
                    getDirectMessages(client.id, msgContent.conversationId),
                    getUserById(msgContent.conversationId)
                ]);

                const response = new Message({
                    type: Message.TYPES.FETCH_MESSAGES,
                    content: {
                        conversationId: msgContent.conversationId,
                        messages,
                        status: context.clients.has(msgContent.conversationId)
                                ? "online"
                                : "offline",
                        lastSeenAt: recipient?.lastSeenAt ?? null,
                        isMember: true
                    }
                });

                client.socket.send(JSON.stringify(response));
            } else if (msgContent.kind === "gc") {
                const groupMembers = await getGroupMembers(msgContent.conversationId);

                if (!groupMembers.some((member) => member.userId === client.id)) {
                    client.socket.send(JSON.stringify(
                        new Message({
                            type: Message.TYPES.FETCH_MESSAGES,
                            content: {
                                isMember: false,
                                conversationId: msgContent.conversationId,
                                messages: []
                            }
                        })
                    ));
                    return;
                }

                const messages = await getGroupMessages(
                    msgContent.conversationId
                );

                const response = new Message({
                    type: Message.TYPES.FETCH_MESSAGES,
                    content: {
                        conversationId: msgContent.conversationId,
                        messages,
                        isMember: true
                    }
                });

                client.socket.send(JSON.stringify(response));
            }

            break;
        }
        case Message.TYPES.CREATE_GROUP: {
            if (!initializationCheck(client)) return;            

            let group;

            try {
                group = await createGroup(msgContent.groupLabel, client.id);
            } catch (error) {
                const dbError = error?.cause ?? error; // the pg error is on .cause: DrizzleQueryError

                if (dbError?.code === "23505") {
                    client.socket.send(JSON.stringify(
                        errorMessage(`A group named "${msgContent.groupLabel}" already exists.`)
                    ));
                } else {
                    throw error; // let server handle non-duplicate errors
                }

                return;
            }

            const { id: groupId, label: groupLabel } = group;

            const response = new Message({
                type: Message.TYPES.CREATE_GROUP,
                content: {
                    groupId,
                    groupLabel
                }
            });

            client.socket.send(JSON.stringify(response));

            // broadcastResponse(response, client.id); not needed yet, but could be useful 
            // for a "new group created" notification in the future

            break;            
        }
        case Message.TYPES.MEMBERSHIP: {
            if (!initializationCheck(client)) return;     
            
            const groupMembers = await getGroupMembers(msgContent.groupId);
            
            if (msgContent.action === "join") {
                if (groupMembers.some((member) => member.userId === client.id)) {
                    client.socket.send(JSON.stringify(
                        errorMessage("You are already a member of this group.")
                    ));
                    return;
                }

                await joinGroup({
                    groupId: msgContent.groupId, 
                    userId: client.id
                });

                await messageHandler(client, new Message({
                    type: Message.TYPES.FETCH_MESSAGES,
                    content: {
                        conversationId: msgContent.groupId,
                        kind: "gc"
                    }
                }));
            }

            if (msgContent.action === "leave") {
                if (!groupMembers.some((member) => member.userId === client.id)) {
                    client.socket.send(JSON.stringify(
                        errorMessage("You are not a member of this group.")
                    ));
                    return;
                }

                const outcome = await leaveGroup({
                    groupId: msgContent.groupId,
                    userId: client.id
                });

                if (outcome.groupDeleted) { // if sole member left, group is gone
                    client.socket.send(JSON.stringify(new Message({
                        type: Message.TYPES.MEMBERSHIP,
                        content: {
                            action: "leave",
                            groupId: msgContent.groupId,
                            groupDeleted: true
                        }
                    })));

                    return;
                }

                await messageHandler(client, new Message({
                    type: Message.TYPES.FETCH_MESSAGES,
                    content: {
                        conversationId: msgContent.groupId,
                        kind: "gc"
                    }
                }));
            }

            break;
        }
        case Message.TYPES.ERROR:
            console.log(`Error message received: ${msgContent}`);

            break;
        default:
            console.log(`Undefined message type used: ${msgType}`);
    }
};

export default messageHandler;
