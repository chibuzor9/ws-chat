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
    const [tabsData, setTabsData] = useState({});
    const [messages, setMessages] = useState({});
    const [retry, setRetry] = useState(0);
    const socket = useRef(null);
    const users = new Map(tabsData?.users?.map((user) => [user.id, user]));
    const [senderId, setSenderId] = useState("");

    const handleUserLogout = () => {
        socket.current?.close(1000, "User logged out");
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
        const fetchMsg = new Message({
            type: Message.TYPES.FETCH_MESSAGES,
            content: {
                userId: username,
                conversationId: userId,
            }
        });

        if (userId) {
            setActiveConvo(true);
            setConversationId(`${userId}`)
        }

        socket.current?.send(JSON.stringify(fetchMsg));
    };

    const handleChatSubmit = (text) => {
        const chatMsg = new Message({
            type: Message.TYPES.CHAT, 
            content: {
                kind: "dm",
                sender: username,
                receiver: conversationId,
                message: text
            }
        });
        
        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify(chatMsg));
        }
    };

    useEffect(() => {
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

                const initAck = new Promise((resolve) => {
                    (() => {
                        ws.send(JSON.stringify({ 
                            type: Message.TYPES.INIT, 
                            content: { username } 
                        }));
                        resolve();
                    })();
                });

                initAck.then(() => {
                    pingInterval = setInterval(() => {
                        if (awaitingPong) { 
                            ws.close(); return; 
                        }   // never answered → dead

                        ws.send(JSON.stringify(pingMsg));
                        awaitingPong = true;
                    }, 30000);
                });
            });

            ws.addEventListener("message", (event) => {
                const result = messageHandler(ws, event.data);

                if (!result) return;
                
                if (result && result.awaitingPong !== undefined) {
                    awaitingPong = result.awaitingPong;
                    attempts = 0;
                }

                if (result && result.senderId) {
                    setSenderId(result.senderId);
                }

                if (result && result.status) {
                    setConnectionStatus(result.status);
                }

                if (result && result.users) {
                    setTabsData((prev) => ({
                        ...prev,
                        users: result.users,
                        groups: result.groups
                    }));
                }

                if (result && result.messages) { 
                    setMessages((prev) => ({
                        ...prev,
                        [result.conversationId]: result.messages
                    }));                                      
                }
            });

            ws.addEventListener("close", (event) => {
                clearInterval(pingInterval);
                setConnectionStatus("offline");
                
                if (event.code === 3000) {
                    disposed = true;
                    setConnectionStatus("reconnect");
                    console.log("Connection closed due to another session taking over the username.");
                }

                if (!disposed) {
                    const delay = Math.min(1000 * 2 ** attempts, 30000); // exponential backoff
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
                    tabsData={tabsData}
                />
            </aside>
            <main className={`min-w-0 flex-1`}>
                { activeConvo ? 
                    <ChatView 
                        messages={messages[conversationId] || []}
                        onSubmit={handleChatSubmit}
                        recipientData={users.get(conversationId)}
                        senderId={senderId}
                    /> 
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
