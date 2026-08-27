import Message from "../shared/Message.js";
import clientsModule from './clients.js';
import dbModule from '../db/queries.ts';

const { clients, usernameTOID, getSocketByUsername } = clientsModule;
const { 
    getUserByUsername,
    appendUsername, 
    handleClientDisconnection, 
    insertDirectMessage, 
    insertGroupMessage, 
    getGroupLabels,
    getUserLabels,
    getDirectMessages,
    getGroupMessages,
    getGroupMembers
} = dbModule;

const context = { clients, usernameTOID, getSocketByUsername };

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

const messageHandler = async (client, message) => {
    const msgType = message.type;
    const msgContent = message.content;

    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msgType}`);
        return;
    }

    switch (msgType) {
        case Message.TYPES.PING:
            if(!context.clients.has(client.id)) {
                client.socket.send(JSON.stringify(
                    errorMessage("Client has not initialized yet.")
                ));
                return;
            }

            // await updateLastSeen(client.id); this causes more write no doubt

            client.socket.send(JSON.stringify({ 
                type: Message.TYPES.PONG,
                content: "Ping Acknowledged. Pong response sent."
            }));

            break;
        case Message.TYPES.INIT:
            await initializeClient(client, msgContent);

            break;
        case Message.TYPES.CHAT:
            if(!context.clients.has(client.id)) {
                client.socket.send(JSON.stringify(
                    errorMessage("Client has not initialized yet.")
                ));
                return;
            }
        
            if (msgContent.kind === "dm") {
                await insertDirectMessage({
                    senderId: client.id, 
                    receiverUserId: msgContent.receiver, 
                    content: msgContent.message
                });            
            } else {
                // Handle group message logic here
            }

            break;
        case Message.TYPES.FETCH_MESSAGES:
            const messages = await getDirectMessages(
                context.usernameTOID.get(msgContent.userId), 
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

            break;
        case Message.TYPES.ERROR:
            console.log(`Error message received: ${msgContent}`);

            break;
        default:
            console.log(`Undefined message type used: ${msgType}`);
    }
};

export default messageHandler;
