import React from 'react'

const MessageBubble = ({ content, mine }) => {
    return (
        <div className={`bg-zinc-300 border border-zinc-700 p-2 rounded-2xl ${mine ? "self-end  rounded-br-md" : "self-start rounded-bl-md"}`}>            
            <span className="text-1xl">{content}</span>
        </div>
    )
}

export default MessageBubble;