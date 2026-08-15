import React from 'react'
import { getSenderName } from "../shared/TabsData"

const MessageBubble = ({ content, sender, time, isGroup }) => {
    return (
        <div className={`bg-zinc-300 border border-zinc-700 p-2 rounded-2xl ${sender === "me" ? "self-end rounded-br-md" : "self-start rounded-bl-md"}`}>
            {isGroup && (
                <span className="block text-xs font-medium text-zinc-600">
                    {getSenderName(sender)}
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
