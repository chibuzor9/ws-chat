import React from 'react';
import UserIcon from '../shared/UserIcon';
import { LogOut } from "lucide-react";

const Profile = ({ username, connectionStatus, onLogOut}) => {

    return (
        <div className="flex h-12 items-center gap-3 border-t border-zinc-700 p-4">
            <UserIcon status={connectionStatus} />
            <p className="flex-1">{username}</p>
            <button className="flex hover:cursor-pointer" onClick={onLogOut}>
                <LogOut />
            </button>
        </div>
    )
}

export default Profile;