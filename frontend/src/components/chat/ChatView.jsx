import React from 'react';
import ChatHeader from "./ChatHeader"
import MessageList from "./MessageList"
import MessageComposer from "./MessageComposer"

const ChatView = () => {
    return (
        <>
            <ChatHeader />
            <MessageList />
            <MessageComposer />
        </>
)};

export default ChatView;