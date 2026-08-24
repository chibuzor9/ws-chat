import 'dotenv/config';
import { WebSocketServer } from 'ws';
import messageHandler from './messageHandler.js';
import {randomUUID} from "crypto";
import Message from "../shared/Message.js";

const port = Number(process.env.PORT) || 8080;
const server = new WebSocketServer({ port });

server.on("listening", () => {
    console.log(`Server listening on ws://127.0.0.1:${port}`);
});

server.on("connection", (ws) => {
    const client = {
        id: randomUUID(),
        socket: ws,
        username: null
    };

    const initTimeout = setTimeout(() => {
        if (!client.username) {
            ws.close(1000, "Client did not initialize within the required time frame.");
        }
    }, 10000);

    ws.on("message", async (msg) => {
        if (JSON.parse(msg).type == Message.TYPES.INIT) {
            clearTimeout(initTimeout);
        }

        await messageHandler(client, msg);
    });

    ws.on("close", async () => {
        clearTimeout(initTimeout);
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

server.on("error", (error) => {
    console.error("Server error:", error);
});
