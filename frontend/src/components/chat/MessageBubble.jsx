import React from 'react';

const MessageBubble = ({ data }) => { 
    const { content, sender, time, isGroup, mine } = data;
    
    return (
        <div className={`bg-zinc-300 border border-zinc-700 p-2 rounded-2xl max-w-140 ${mine ? "self-end rounded-br-md" : "self-start rounded-bl-md"}`}>
            {isGroup && (
                <span className="block text-xs font-medium text-zinc-600">
                    {sender}
                </span>
            )}

            <span className="text-1xl">{content}</span>

            {time && (
                <span className="block text-right text-xs text-zinc-500">
                    {new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            )}
        </div>
    )
}

export default MessageBubble;
