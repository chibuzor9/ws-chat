import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";

const ChatView = ({ 
    messages, 
    onSubmit, 
    recipientData, 
    senderId, 
    status, 
    isMember, 
    isGroup,
    membershipHandler,
    mapper 
}) => {
    return (
        <div className="flex h-full flex-col relative min-w-100">
            <ChatHeader 
                username={recipientData?.username || recipientData?.label}             
                connectionStatus={status}
                membershipStatus={isMember}
                isGroup={isGroup}
                membershipHandler={membershipHandler}
            />

            { isMember && messages.length ? (
                <MessageList 
                    messages={messages} 
                    isGroup={isGroup}
                    senderId={senderId}
                    mapper={mapper}
                />
            ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">
                    No messages yet. Start the conversation!
                </div>
            )}

            <MessageComposer onSend={onSubmit} memberStatus={isMember}/>
        </div>
    )
};

export default ChatView;
