import React from 'react';
import UserIcon from "../shared/UserIcon"

const ChatHeader = ({username, status}) => {
    // const [connectionStatus, setConnectionStatus] = useState("connecting");
    // lowkey flawed logic, but it works for now. If the status is "offline", we know the user is offline. 
    // If the status is a timestamp, we can compare it to the current time to determine if the user is online or offline.
    const connectionStatus = (() => {
        if (status === "offline") return "offline";

        const lastSeen = new Date(status);
        const now = new Date();
        const diffInSeconds = (now - lastSeen) / 1000;

        if (diffInSeconds < 60) return "online";

        return "offline";
    })();

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