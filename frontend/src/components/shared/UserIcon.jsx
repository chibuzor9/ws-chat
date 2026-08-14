import React from 'react';
import { UserRound } from "lucide-react";

const UserIcon = ({status : connectionStatus}) => {
    const statusColors = {
        online: "bg-emerald-400",
        connecting: "bg-amber-400",
        offline: "bg-red-400",
    }
    
    return (
        <div className="relative flex size-9 items-center justify-center rounded-full bg-zinc-700">
                <UserRound className="size-5 text-zinc-200 " />

                <span
                    className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-zinc-800 ${statusColors[connectionStatus]} ${connectionStatus === "connecting" ? "animate-bounce" : ""} ${connectionStatus === "offline" ? "animate-pulse" : ""}`}
                    aria-label={connectionStatus}
                />
        </div>
    );
};

export default UserIcon;