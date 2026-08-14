import React from 'react';
import UserIcon from '../shared/UserIcon';

const Profile = ({username, connectionStatus}) => {

    return (
        <div className="flex h-12 items-center gap-3 border-t border-zinc-700 p-4">
            <UserIcon status={connectionStatus} />
            <p>{username}</p>
        </div>
    )
}

export default Profile;