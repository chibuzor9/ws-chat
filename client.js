import message from "./messageClass.js";
import messageHandler from "./messageHandler.js";

function initWSEventListeners(ws) {
    let pingInterval;

    ws.addEventListener("open", () => {
        console.log("CONNECTED!");
        
        pingInterval = setInterval(() => {
            console.log(`SENT: ping`);
            socket.send(JSON.stringify(pingMsg));
        }, 30000);

        //do something
    });

    ws.addEventListener("message", (msg) => {
        console.log(`Received: ${msg.data}`);
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

const wsUri = `ws://127.0.0.1:${process.env.PORT || 8056}`;
const socket = new WebSocket(wsUri);
const pingMsg = new message("ping", "ping");

initWSEventListeners(socket)
