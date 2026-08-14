import React from 'react';
import MessageBubble from './MessageBubble';

const MessageList = () => {
    const messages = [
        { id: 1, sender: 'me', username: 'Alice', content: 'Hello, how are you?' },
        { id: 1, sender: 'me', username: 'Alice', content: "It's Alice!" },
        { id: 2, username: 'Bob', content: 'I am good, thanks! How about you?' },
        { id: 3, sender: 'me', username: 'Alice', content: 'I am doing well too!' },
    ];

    return (
        <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full scroll-fade">
            {messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    username={message.username}
                    content={message.content}
                    mine={message.sender === 'me'}
                />
            ))}
        </div>
    )
}

export default MessageList;