import React, {useState} from 'react';
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import { getConversation, getKind } from "../shared/TabsData";
import { demoMessages } from "../shared/DemoMessages";

const ChatView = ({ conversationId }) => {
    const convo = getConversation(conversationId); // convoId reaches here
    const [allMessages, setAllMessages] = useState(demoMessages);
    const messages = allMessages[conversationId] ?? [];
    const isGroup = getKind(conversationId) === "group";

    const handleMessageSubmit = (msg) => {
        setAllMessages((previous) => {
            const existingMessages = previous[conversationId] ?? [];

            const newMessage = {
                id: (existingMessages.at(-1)?.id ?? 0) + 1,
                sender: "me",
                content: msg,
                at: new Date().toISOString()
            };

            return {...previous, [conversationId]: [...existingMessages, newMessage]}
        });
    }

    return (
        <div className="flex h-full flex-col relative min-w-100">
            <ChatHeader username={convo.label} />

            <MessageList messages={messages} isGroup={isGroup} />

            <MessageComposer onSend={handleMessageSubmit}/>
        </div>
    )
};

export default ChatView;