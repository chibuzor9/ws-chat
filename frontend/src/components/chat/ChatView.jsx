import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";

const ChatView = ({ messages, onSubmit, recipientData, senderId, status }) => {
    return (
        <div className="flex h-full flex-col relative min-w-100">
            <ChatHeader 
                username={recipientData?.username || recipientData?.label}             
                connectionStatus={status}
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
