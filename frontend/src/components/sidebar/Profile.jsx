import React from 'react'
import { UserRound } from "lucide-react";

const Profile = ({username, connectionStatus}) => {
    const statusColors = {
        online: "bg-emerald-400",
        connecting: "bg-amber-400",
        offline: "bg-red-400",
    }

    return (
        <div className="flex h-12 items-center gap-3 border-t border-zinc-700 p-4">
            <div className="relative flex size-9 items-center justify-center rounded-full bg-zinc-700">
                <UserRound className="size-5 text-zinc-200" />

                <span
                    className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-zinc-800 ${statusColors[connectionStatus]}`}
                    aria-label={connectionStatus}
                />
            </div>
            <p>{username}</p>
        </div>
    )
}

export default Profile;