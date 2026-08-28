import Message from "../shared/Message.js";
import clientsModule from './clients.js';
import dbModule from '../db/queries.ts';

const { clients, usernameTOID, getSocketByUsername, getSocketById } = clientsModule;
const {
    getUserByUsername,
    appendUsername,
    insertDirectMessage,
    insertGroupMessage, 
    getGroupLabels,
    getUserLabels,
    getDirectMessages,
    getGroupMessages,
    getGroupMembers,
    createGroup,
    addGroupMember
} = dbModule;

const context = { clients, usernameTOID, getSocketByUsername, getSocketById };

const errorMessage = (error) => {
    return new Message({
        type: Message.TYPES.ERROR,
        content: error
    });
}

const initializeClient = async (client, content) => {
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

    const [users, groups] = await Promise.all([
        getUserLabels(client.username),
        getGroupLabels()
    ]);

    client.socket.send(JSON.stringify({ 
        type: Message.TYPES.INIT_ACK,
        content: {
            clientId: client.id,
            users,
            groups
        }
    }));

    console.log(`User ${client.username} initialized with ID: ${client.id}`);
}

const broadcastResponse = (response, excludeClientId = null) => {
    context.clients.forEach((client) => {
        if (client.id !== excludeClientId) {
            client.socket.send(JSON.stringify(response));
        }
    });
};

const messageHandler = async (client, message) => {
    const msgType = message.type;
    const msgContent = message.content;

    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msgType}`);
        return;
    }

    switch (msgType) {
        case Message.TYPES.PING: {
            if(!context.clients.has(client.id)) {
                client.socket.send(JSON.stringify(
                    errorMessage("Client has not initialized yet.")
                ));
                return;
            }

            // await updateLastSeen(client.id); this causes more write no doubt
            // it'd be lovely to handle this with the maps on the server

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
            if(!context.clients.has(client.id)) {
                client.socket.send(JSON.stringify(
                    errorMessage("Client has not initialized yet.")
                ));
                return;
            }
        
            if (msgContent.kind === "dm") {
                if (msgContent.receiver === client.id) {
                    client.socket.send(JSON.stringify(
                        errorMessage("You cannot send a direct message to yourself.")
                    ));
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
                
                const groupMembers = await getGroupMembers(newMessage.receiverGroupId);

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
            if(!context.clients.has(client.id)) {
                client.socket.send(JSON.stringify(
                    errorMessage("Client has not initialized yet.")
                ));
                return;
            }

            if (msgContent.kind === "dm") {
                const messages = await getDirectMessages(
                    client.id, 
                    msgContent.conversationId
                );
                
                const response = new Message({
                    type: Message.TYPES.FETCH_MESSAGES,
                    content: {
                        conversationId: msgContent.conversationId,
                        messages
                    }
                });
                
                client.socket.send(JSON.stringify(response));
            } else if (msgContent.kind === "gc") {
                const messages = await getGroupMessages(
                    msgContent.conversationId
                );

                const response = new Message({
                    type: Message.TYPES.FETCH_MESSAGES,
                    content: {
                        conversationId: msgContent.conversationId,
                        messages
                    }
                });

                client.socket.send(JSON.stringify(response));
            }

            break;
        }
        case Message.TYPES.CREATE_GROUP: {
            if(!context.clients.has(client.id)) {
                client.socket.send(JSON.stringify(
                    errorMessage("Client has not initialized yet.")
                ));
                return;
            }

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
        case Message.TYPES.ERROR:
            console.log(`Error message received: ${msgContent}`);

            break;
        default:
            console.log(`Undefined message type used: ${msgType}`);
    }
};

export default messageHandler;
