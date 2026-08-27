import React from 'react';
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";

const ChatView = ({ messages, onSubmit, recipientData, senderId }) => {
    return (
        <div className="flex h-full flex-col relative min-w-100">
            <ChatHeader 
                username={recipientData?.username || "Unknown User"} 
                status={"offline"} // fixme: this should be the recipient's status
                // but we don't have that data yet. 
                // We can get it from the server when we fetch the recipient's data.
            />

            { messages.length ? (
                <MessageList 
                    messages={messages} 
                    isGroup={messages?.[0]?.kind === "gc"} 
                    senderId={senderId}
                />
            ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">
                    No messages yet. Start the conversation!
                </div>
            )}

            <MessageComposer onSend={onSubmit}/>
        </div>
    )
};

export default ChatView;