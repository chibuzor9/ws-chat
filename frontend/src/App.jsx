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
    const [convo, setConvo] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState("offline");
    const [tabsData, setTabsData] = useState({});
    const [messages, setMessages] = useState({});
    const [retry, setRetry] = useState(0);
    const [membership, setMembership] = useState(false);
    const socket = useRef(null);
    const senderId = useRef(null);
    const tabsDataMap = {
        users: new Map(tabsData?.users?.map((user) => [user.id, user])),
        groups: new Map(tabsData?.groups?.map((group) => [group.id, group]))
    }
    const IDtoUsernameMap = new Map(tabsData?.users?.map((user) => [user.id, user.username]));

    const handleUserLogout = () => {
        socket.current?.close(1000, "User logged out");
        setUsername("");
        localStorage.removeItem("ws-chat:username");
        setConvo(null);
        setTabsData({});
        setMessages({});
        setConnectionStatus("offline");
        setMembership(false);
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

    const handleCreateGroup = (groupName) => {
        const createGroupMsg = new Message({
            type: Message.TYPES.CREATE_GROUP,
            content: {
                groupLabel: groupName
            }
        });

        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify(createGroupMsg));
        }
    };

    const handleActiveConversation = ({ conversationId, kind }) => {
        setConvo({ conversationId, kind });
    };  

    const handleChatSubmit = (text) => {
        const chatMsg = new Message({
            type: Message.TYPES.CHAT, 
            content: {
                kind: convo.kind,
                sender: username,
                receiver: convo.conversationId,
                message: text
            }
        });
        
        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify(chatMsg));
        }
    };

    const handleMembershipChange = (action) => {
        if (!convo || convo.kind !== "gc") return;

        const membershipMsg = new Message({
            type: Message.TYPES.MEMBERSHIP,
            content: {
                action,
                groupId: convo.conversationId
            }
        });

        if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify(membershipMsg));
        }
    };

    useEffect(() => { // establish WebSocket connection
        if (!username) return; // base case for no username

        let ws, pingInterval, retryTimer;
        let attempts = 0, disposed = false;

        const connect = () => {
            let awaitingPong = false
            setConnectionStatus("connecting");
            
            const wsUri = `ws://127.0.0.1:${import.meta.env.VITE_WS_PORT || 8080}`;
            ws = new WebSocket(wsUri);
            socket.current = ws

            ws.addEventListener("open", () => {
                const pingMsg = new Message({ type: Message.TYPES.PING, content: "ping" })

                const initAck = new Promise((resolve) => {
                    const initMsg = new Message({
                        type: Message.TYPES.INIT,
                        content: { username }
                    });
                    
                    ws.send(JSON.stringify(initMsg));
                    resolve();
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
                const result = messageHandler(event.data);

                if (!result) return;
                
                if (result && result.awaitingPong !== undefined) {
                    awaitingPong = result.awaitingPong;
                }

                if (result && result.senderId) {
                    senderId.current = result.senderId;
                    setConnectionStatus("online");
                    attempts = 0;
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
                    setTabsData((prev) => ({
                        ...prev,
                        users: prev.users.map((user) => {
                            if (user.id === result.conversationId) {
                                return {
                                    ...user,
                                    status: result.status,
                                    lastSeenAt: result.lastSeenAt ?? user.lastSeenAt
                                };
                            }
                            return user;
                        })
                    })); 
                    setMembership(result.memberStatus); // set membership status for groups
                }

                if (result && result.groupRemoved) {
                    setTabsData((prev) => ({
                        ...prev,
                        groups: (prev.groups || []).filter(
                            (group) => group.id !== result.groupRemoved
                        )
                    }));

                    setMessages((prev) => {
                        const next = { ...prev };
                        delete next[result.groupRemoved];

                        return next;
                    });

                    setConvo((prev) =>
                        prev?.conversationId === result.groupRemoved ? null : prev
                    );
                }

                if (result && result.chat) {
                    setMessages((prev) => {
                        const convoId = result.chat.kind === "dm"
                        ? (result.chat.senderId === senderId.current
                            ? result.chat.receiverId
                            : result.chat.senderId)
                        : result.chat.receiverId;

                        return {
                            ...prev,
                            [convoId]: [...(prev[convoId] || []), result.chat]
                        };
                    });
                }

                if (result && result.group) {
                    setTabsData((prev) => ({
                        ...prev,
                        groups: [...(prev.groups || []), {
                            id: result.group.id,
                            label: result.group.label
                        }]
                    }));
                }
            });

            ws.addEventListener("close", (event) => {
                clearInterval(pingInterval);
                setConnectionStatus("offline");
                
                if (event.code === 3000) {
                    disposed = true;
                    setConnectionStatus("reconnect");

                    setTabsData((prev) => ({
                        ...prev,
                        users: prev.users?.map((user) => ({ ...user, status: "inactive" }))
                    }));

                    console.log("Connection closed due to another session taking over.");
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

    useEffect(() => { // fetch messages for the active conversation
        if (connectionStatus !== "online" || !convo) return;

        const fetchMsg = new Message({
            type: Message.TYPES.FETCH_MESSAGES,
            content: { 
                conversationId: convo.conversationId,
                kind: convo.kind
            }
        });

        socket.current?.send(JSON.stringify(fetchMsg));
    }, [connectionStatus, convo]);


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
                    onCreate={handleCreateGroup}
                />
            </aside>
            <main className={`min-w-0 flex-1`}>
                { convo ? 
                    <ChatView 
                        messages={messages[convo.conversationId] || []}
                        onSubmit={handleChatSubmit}
                        recipientData={tabsDataMap.users.get(convo.conversationId) || tabsDataMap.groups.get(convo.conversationId)}
                        status={{
                            status: connectionStatus !== "online"
                                ? "inactive"
                                : tabsDataMap.users?.get(convo?.conversationId)?.status ?? "online",
                            lastSeenAt: tabsDataMap.users?.get(convo?.conversationId)?.lastSeenAt
                        }}
                        senderId={senderId} // accessed current val in MessageList.jsx
                        isMember={membership}
                        isGroup={convo.kind === "gc"}
                        membershipHandler={handleMembershipChange}
                        mapper={IDtoUsernameMap}
                    /> 
                    : 
                    <div className="flex h-full items-center justify-center px-6">
                        <p className="text-center text-sm text-zinc-500">
                            Pick someone from the sidebar to start chatting.
                        </p>
                    </div>
                }
            </main>
        </div>
)};

export default App;
