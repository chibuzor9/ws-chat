import { WebSocketServer } from 'ws';
import messageHandler from './messageHandler.js';

const port = Number(process.env.PORT) || 8056;
const server = new WebSocketServer({ port });

server.on("listening", () => {
    console.log(`Server listening on ws://127.0.0.1:${port}`);
});

server.on("connection", (ws) => {
    console.log("CONNECTED!");

    ws.on("message", (msg) => {
        messageHandler(ws, msg);
    });

    ws.on("close", () => {
        console.log("DISCONNECTED!");
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

server.on("error", (error) => {
    console.error("Server error:", error);
});
