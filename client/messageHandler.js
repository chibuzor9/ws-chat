// CLI client message handler
import Message from "../shared/Message.js"

const errorMessage = (error) => {
    return new Message({
        type: Message.TYPES.ERROR,
        content: error
    });
}

const messageHandler = (client, message) => {
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
        // do something with chat message        
    } else if (msgType === Message.TYPES.CLOSE) {
        client.close();      
    } else if (msgType === Message.TYPES.ERROR) {
        console.log(`Error message received: ${msgContent}`);
    } else {
        console.log(`Undefined message type used: ${msgType}`);
    }
};

export default messageHandler;
