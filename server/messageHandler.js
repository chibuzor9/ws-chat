import Message from "../shared/messageClass.js"

const errorMessage = (error) => {
    return new Message({
        type: Message.TYPES.ERROR,
        content: error
    });
}

const initializeClient = (client, content, context) => {
    const username = content.username;

    if (context.usernameTOID.has(username)) {
        client.socket.send(JSON.stringify(
            errorMessage(`Username ${username} is already taken.`)
        ));
        return;
    }

    if (client.hasInitialized) {
        client.socket.send(JSON.stringify(
            errorMessage(`Client with ID ${client.id} has already initialized.`)
        ));
        return;
    }

    client.username = username;
    client.hasInitialized = true;
    context.usernameTOID.set(username, client.id);

    context.clients.set(client.id, client);

    console.log(`User ${client.username} initialized with ID: ${client.id}`);
    
}

const messageHandler = (client, message, context) => {
    const msg = JSON.parse(message);

    const msgType = msg.type;
    const msgContent = msg.content;

    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msg.type}`);
        return;
    }

    if (msgType === Message.TYPES.PING) {
        if(!client.hasInitialized) {
            client.socket.send(JSON.stringify(
                errorMessage("Client has not initialized yet.")
            ));
            return;
        }

        client.socket.send(JSON.stringify({ 
            type: Message.TYPES.PONG,
            content: "pong"
        }));
    } else if (msgType === Message.TYPES.PONG) {
        console.log("Pong Acknowledged");
    } else if (msgType === Message.TYPES.INIT) {
        initializeClient(client, msgContent, context);
    } else if (msgType === Message.TYPES.CHAT) {
        if(!client.hasInitialized) {
            client.socket.send(JSON.stringify(
                errorMessage("Client has not initialized yet.")
            ));
            return;
        }
        
    } else if (msgType === Message.TYPES.ERROR) {
        console.log(`Error message received: ${msgContent}`);
    } else {
        console.log(`Undefined message type use: ${msgType}`);
    }
};

export default messageHandler;