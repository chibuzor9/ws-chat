import WebSocket from "ws";
import Message from "../shared/messageClass.js";
import messageHandler from "./messageHandler.js";

function initWSEventListeners(ws) {
    let pingInterval;

    ws.addEventListener("open", () => {
        const pingMsg = new Message({ 
            type: Message.TYPES.PING, 
            content: "ping"
        });
        
        pingInterval = setInterval(() => {
            socket.send(JSON.stringify(pingMsg));
        }, 30000);

        //do something else
    });

    ws.addEventListener("message", (msg) => {
        messageHandler(ws, msg.data);
    });

    ws.addEventListener("close", () => {
        console.log("DISCONNECTED!");
        clearInterval(pingInterval);
    });

    ws.addEventListener("error", (e) => {
        console.log(`Error ${e}`);
    });
}

const wsUri = `ws://127.0.0.1:${process.env.PORT || 8080}`;
const socket = new WebSocket(wsUri);
const username = "Anonymous";

socket.addEventListener("open", () => {
    const initMsg = new Message({ 
        type: Message.TYPES.INIT, 
        content: {
            username: username
        }
    });

    socket.send(JSON.stringify(initMsg));
});

initWSEventListeners(socket)
