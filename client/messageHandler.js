import Message from "../shared/Message.js"

const errorMessage = (error) => {
    return new Message({
        type: Message.TYPES.ERROR,
        content: error
    });
}


const messageHandler = (client, message, context) => {
    const msg = JSON.parse(message);

    const msgType = msg.type;
    const msgContent = msg.content;

    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msg.type}`);
        return;
    }

    if (msgType === Message.TYPES.PONG) {// do something
        console.log("Pong Acknowledged");
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
