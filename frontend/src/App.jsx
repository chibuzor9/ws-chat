import {useState, useEffect, useRef} from 'react';
import Sidebar from "./components/sidebar/Sidebar";
import ChatView from "./components/chat/ChatView";
import Message from "../../shared/Message.js";
import messageHandler from "./components/messageHandler.js";
import Modal from "../src/components/modal/Modal.jsx";
import UsernameModal from './components/modal/UsernameModal';
import RetryModal from './components/modal/RetryModal.jsx';


function App() {
    const [username, setUsername] = useState(() => localStorage.getItem("ws-chat:username") ?? "");
    const [activeConvo, setActiveConvo] = useState(false);
    const [conversationId, setConversationId] = useState("");
    const [connectionStatus, setConnectionStatus] = useState("offline");
    const socket = useRef(null);
    const [retry, setRetry] = useState(0);

    const handleUserLogout = () => {
        const close_msg = new Message({
            type: Message.TYPES.CLOSE,
            content: "Logging Out"
        })

        messageHandler(socket.current, JSON.stringify(close_msg));
        setUsername("");
        localStorage.removeItem("ws-chat:username");
        setActiveConvo(false);
        setConversationId("");
    }

    const handleRetryDependency = () => {
        setRetry((prev) => prev + 1);
    }

    const handleUsernameSubmit = (submittedUsername = "") => {
        const cleanedUsername = submittedUsername.toLowerCase().trim().slice(0, 16);

        const actualUsername =
            cleanedUsername ||
            `anonymous:${crypto.randomUUID().slice(0, 6)}`

        setUsername(actualUsername)
        localStorage.setItem("ws-chat:username", actualUsername)
    }

    const handleActiveConversation = (userId) => {
        if (userId) {
            setActiveConvo(true);
            setConversationId(`me-${userId}`)
        }
    };

    const handleChatSubmit = (text) => {
        const chatMsg = new Message({
            type: Message.TYPES.CHAT, 
            content: {
                sender: username,
                receiver: conversationId,
                text: text
            }
        });

        socket.send(JSON.stringify(chatMsg));
    };

    useEffect(() => {
        // Effect Code
        if (!username) return; // base case for no username

        let ws, pingInterval, retryTimer;
        let attempts = 0, awaitingPong = false, disposed = false;

        const connect = () => {
            setConnectionStatus("connecting");
            
            const wsUri = `ws://127.0.0.1:${import.meta.env.VITE_WS_PORT || 8080}`;
            ws = new WebSocket(wsUri);
            socket.current = ws

            ws.addEventListener("open", () => {
                const pingMsg = new Message({ type: Message.TYPES.PING, content: "ping" })

                ws.send(JSON.stringify({ type: Message.TYPES.INIT, content: { username } }));
                ws.send(JSON.stringify(pingMsg));
                awaitingPong = true;

                pingInterval = setInterval(() => {
                    if (awaitingPong) { 
                        ws.close(); return; 
                    }   // never answered → dead

                    awaitingPong = true;
                    ws.send(JSON.stringify(pingMsg));
                }, 30000);
            });

            ws.addEventListener("message", (event) => {
                const result = messageHandler(ws, event.data);
                
                if (result && result.awaitingPong !== undefined) {
                    awaitingPong = result.awaitingPong;
                    attempts = 0;
                }

                if (result && result.status) {
                    setConnectionStatus(result.status);
                }
            });

            ws.addEventListener("close", () => {
                clearInterval(pingInterval);
                setConnectionStatus("offline");

                if (!disposed) {
                    const delay = Math.min(1000 * 2 ** attempts, 30000); // exponential backoff with max delay
                    attempts++;

                    if (attempts < 10) {
                        retryTimer = setTimeout(connect, delay);   // next connect() → "connecting"
                    } else {
                        setConnectionStatus("reconnect");
                    }
                } 
            });

            ws.addEventListener("error", () => ws.close());
        };

        connect();

        const cleanup = () => {
            clearInterval(pingInterval);
            clearTimeout(retryTimer);
            disposed = true;
            ws.close();
        };

        return cleanup;
    }, [username, retry]); // dependencies


    return (
        <div className="flex h-dvh w-full overflow-hidden bg-zinc-200">
            <Modal open={!username}>
                <UsernameModal onSubmit={handleUsernameSubmit}/>
            </Modal>
            <Modal open={connectionStatus === "reconnect"}>
                <RetryModal onRetry={handleRetryDependency}/>
            </Modal>
            <aside className="w-64 shrink-0 border-r border-zinc-700">
                <Sidebar 
                    username={username} 
                    connectionStatus={connectionStatus} 
                    onSelectConvo={handleActiveConversation}
                    onLogOut={handleUserLogout}
                />
            </aside>
            <main className={`min-w-0 flex-1`}>
                { activeConvo ? 
                    <ChatView conversationId={conversationId} onSubmit={handleChatSubmit}/> 
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
