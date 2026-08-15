import {React, useState} from 'react';
import UserIcon from "../shared/UserIcon"

const ChatHeader = ({username}) => {
    const [connectionStatus, setConnectionStatus] = useState("connecting");

    return (
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
            <div className="flex items-center gap-2">
                <UserIcon status={connectionStatus}/>

                <div className="flex flex-col">
                    <span className="font-semibold">{username}</span>
                    <span className="text-xs text-zinc-500">{connectionStatus}</span>
                </div>
            </div>
        </div>
    )
}

export default ChatHeader;