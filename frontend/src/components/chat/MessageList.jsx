import React from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, isGroup, senderId }) => {
    return (
        <div className="flex flex-col gap-2 p-4 pb-24 overflow-y-scroll h-full scroll-fade">
            {messages && messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    data = {{
                        content: message.content,
                        sender: message.senderId,
                        time: message.createdAt,
                        isGroup: isGroup,
                        mine: message.senderId === senderId.current // useRef instance 
                    }}
                />
            ))}
        </div>
    )
}

export default MessageList;