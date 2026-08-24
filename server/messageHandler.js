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
    getUserLabels
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

    if (userDbStatus) {
        client.id = userDbStatus.id;
        client.username = userDbStatus.username;
    } else {
        await appendUsername(username);
    }

    context.usernameTOID.set(client.username, client.id);
    context.clients.set(client.id, client);
    client.socket.send(JSON.stringify({ 
            type: Message.TYPES.PONG,
            content: "Initialization successful. Pong response sent."
    }));

    console.log(`User ${client.username} initialized with ID: ${client.id}`);
}

const messageHandler = async (client, message) => {
    const msg = JSON.parse(message) ;

    const msgType = msg.type;
    const msgContent = msg.content;


    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msgType}`);
        return;
    }

    if (msgType === Message.TYPES.PING) {
        if(!context.clients.has(client.id)) {
            client.socket.send(JSON.stringify(
                errorMessage("Client has not initialized yet.")
            ));

            return;
        }

        client.socket.send(JSON.stringify({ 
            type: Message.TYPES.PONG,
            content: "Ping Acknowledged. Pong response sent."
        }));
    } else if (msgType === Message.TYPES.INIT) {
        await initializeClient(client, msgContent);
    } else if (msgType === Message.TYPES.CHAT) {
        if(!context.clients.has(client.id)) {
            client.socket.send(JSON.stringify(
                errorMessage("Client has not initialized yet.")
            ));
            return;
        }
        
    } else if (msgType === Message.TYPES.CLOSE) {
        console.log(`${client.username || "A client"} with ID ${client.id} disconnected.`);

        await handleClientDisconnection(client.username);
        context.usernameTOID.delete(client.username);
        context.clients.delete(client.id);
    } else if (msgType === Message.TYPES.ERROR) {
        console.log(`Error message received: ${msgContent}`);
    } else {
        console.log(`Undefined message type use: ${msgType}`);
    }
};

export default messageHandler;
