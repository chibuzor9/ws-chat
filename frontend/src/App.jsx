import React, {useState, useEffect} from 'react';
import Sidebar from "./components/sidebar/Sidebar";
import ChatView from "./components/chat/ChatView";
import UsernameModal from "./components/UsernameModal";
import { TYPES } from "../../shared/messageTypes.js";
import messageHandler from "./components/messageHandler.js";


function App() {
    const [username, setUsername] = useState(() => localStorage.getItem("ws-chat:username") ?? "");
    const [activeConvo, setActiveConvo] = useState(false);
    const [conversationId, setConversationId] = useState("");
    const [connectionStatus, setConnectionStatus] = useState("offline");

    const handleUsernameSubmit = (submittedUsername = "") => {
        const cleanedUsername = submittedUsername.trim()

        const actualUsername =
            cleanedUsername ||
            `anonymous:${crypto.randomUUID().slice(0, 8)}`

        setUsername(actualUsername)
        localStorage.setItem("ws-chat:username", actualUsername)
    }

    const handleActiveConversation = (userId) => {
        if (userId) {
            setActiveConvo(true);
            setConversationId(`me-${userId}`)
        }
    };

    useEffect(() => {
        // Effect Code
        if (!username) return; // base case for no username

        let socket, pingInterval, retryTimer;
        let awaitingPong = false;

        const connect = () => {
            setConnectionStatus("connecting");
            
            const wsUri = `ws://127.0.0.1:${8080}`; // process.env.PORT ||
            socket = new WebSocket(wsUri);

            socket.addEventListener("open", () => {
                socket.send(JSON.stringify({ type: TYPES.INIT, content: { username } }));
                socket.send(JSON.stringify({ type: TYPES.PING, content: "ping" }));
                awaitingPong = true;

                pingInterval = setInterval(() => {
                    if (awaitingPong) { 
                        socket.close(); return; 
                    }   // never answered → dead

                    awaitingPong = true;
                    socket.send(JSON.stringify({ type: TYPES.PING, content: "ping" }));
                }, 30000);
            });

            socket.addEventListener("message", (event) => {
                const msg = JSON.parse(event.data);

                if (msg.type === TYPES.PONG) {
                    awaitingPong = false;
                    setConnectionStatus("online");
                }
                
                messageHandler(socket, event.data);
            });

            socket.addEventListener("close", () => {
                clearInterval(pingInterval);
                setConnectionStatus("offline");
                retryTimer = setTimeout(connect, 3000);   // next connect() → "connecting"
            });

            socket.addEventListener("error", () => socket.close());
        };

        connect();

        // cleanup 
        return () => {
            clearInterval(pingInterval);
            clearTimeout(retryTimer);
            socket?.close();
        };
    }, [username]); // dependencies


    return (
        <div className="flex h-dvh w-full overflow-hidden bg-zinc-200">
            <aside className="w-64 shrink-0 border-r border-zinc-700">
                <UsernameModal 
                    open={!username} 
                    onSubmit={handleUsernameSubmit}
                />
                <Sidebar 
                    username={username} 
                    connectionStatus={connectionStatus} 
                    onSelectConvo={handleActiveConversation}
                />
            </aside>
            <main className={`min-w-0 flex-1`}>
                { activeConvo ? 
                    <ChatView conversationId={conversationId}/> 
                    : 
                    <div className="flex h-full items-center justify-center px-6">
                        <p className="text-center text-sm text-zinc-500">
                            Pick someone from the sidebar to start reading.
                        </p>
                    </div>
                }
            </main>
        </div>
)};

export default App;
