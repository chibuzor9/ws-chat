import { WebSocketServer } from 'ws';
import messageHandler from './messageHandler.js';
import {randomUUID} from "crypto";

const port = Number(process.env.PORT) || 8080;
const server = new WebSocketServer({ port });

const clients = new Map();
const usernameTOID = new Map();

server.on("listening", () => {
    console.log(`Server listening on ws://127.0.0.1:${port}`);
});

server.on("connection", (ws) => {
    const client = {
        id: randomUUID(),
        socket: ws,
        username: null,
        hasInitialized: false
    };

    clients.set(client.id, client);

    ws.on("message", (msg) => {
        messageHandler(client, msg, { clients, usernameTOID });
    });

    ws.on("close", () => {
        console.log(`${client.username || "A client"} with ID ${client.id} disconnected.`);

        
        usernameTOID.delete(client.username);
        clients.delete(client.id);
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

server.on("error", (error) => {
    console.error("Server error:", error);
});
