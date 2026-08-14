import React from 'react';
import ChatHeader from "./ChatHeader"
import MessageList from "./MessageList"
import MessageComposer from "./MessageComposer"

const ChatView = ({username}) => {
    return (
        <>
            <ChatHeader username={username} />

            <MessageList />

            <MessageComposer />
        </>
)};

export default ChatView;