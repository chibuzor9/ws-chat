import message from "./messageClass.js";

const messageHandler = (ws, message) => {
    const msg = JSON.parse(message);

    const type = msg.type;
    const content = msg.content;

    if (msg.type === "ping") {
        ws.send(JSON.stringify({ 
            type: "pong",
            content: "pong"
        }));
    } else if (msg.type === "pong") {
        ws.send(JSON.stringify({ 
            type: "ping",
            content: "ping"
        }));
    } else if (msg.type === "message") {
        // do something
    } else {
        // do something
    }
};

export default messageHandler;