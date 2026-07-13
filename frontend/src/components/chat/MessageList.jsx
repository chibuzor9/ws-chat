import React from 'react'
import MessageBubble from './MessageBubble'

const MessageList = () => {
    return (
        <div>
            {
                Object.map((item) =>
                    <MessageBubble key={item.id} content={item.content} /> )
            }
        </div>
    )
}

export default MessageList;