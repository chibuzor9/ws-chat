import Message from "./messageClass.js";

const messageHandler = (ws, message) => {
    const msg = JSON.parse(message);

    const msgType = msg.type;
    const msgContent = msg.content;

    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msg.type}`);
        return;
    }

    if (msgType === "ping") {
        console.log(`Received: ${msgType} type message`);

        ws.send(JSON.stringify({ 
            type: "pong",
            content: "pong"
        }));
    } else if (msgType === "pong") {
        console.log("Received pong");
    } else if (msgType === "chat") {
        // do something
    } else {
        console.log(`Undefined message type use: ${msgType}`);
    }
};

export default messageHandler;