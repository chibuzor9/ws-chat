import React from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, isGroup }) => {
    return (
        <div className="flex flex-col gap-2 p-4 pb-24 overflow-y-scroll h-full scroll-fade">
            {messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    content={message.content}
                    sender={message.sender}
                    time={message.at}
                    isGroup={isGroup}
                />
            ))}
        </div>
    )
}

export default MessageList;