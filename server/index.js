import 'dotenv/config';
import { WebSocketServer } from 'ws';
import messageHandler from './messageHandler.js';
import {randomUUID} from "crypto";
import Message from "../shared/Message.js";
import clientsModule from './clients.js';
import dbModule from '../db/queries.ts';

const { clients, usernameTOID } = clientsModule;
const { updateLastSeen } = dbModule;

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
        try {
            const message = JSON.parse(msg);

            await messageHandler(client, message);

            if (message.type == Message.TYPES.INIT) {
                clearTimeout(initTimeout);
            }
        } catch (error) {
            console.error("Error handling message:", error);

            ws.send(JSON.stringify({
                type: Message.TYPES.ERROR,
                content: "An error occurred while processing your message."
            }));
        }
    });

    ws.on("close", async () => {
        clearTimeout(initTimeout);

        if (!client.username) {
            console.log(`Client ${client.id} closed connection before initialization.`);
            return;
        }

        if (clients.get(client.id)) {
            clients.delete(client.id);
            usernameTOID.delete(client.username);
            await updateLastSeen(client.id);
        }
        console.log(`Client ${client.username} (${client.id}) disconnected.`);
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

server.on("error", (error) => {
    console.error("Server error:", error);
});
