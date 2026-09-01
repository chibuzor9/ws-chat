import UserIcon from "../shared/UserIcon"

const ChatHeader = ({
    username,
    connectionStatus,
    lastSeenAt,
    membershipStatus,
    isGroup,
    membershipHandler
}) => {
    const handleMembershipClick = () => {
        membershipStatus ? membershipHandler("leave") : membershipHandler("join");
    };

    const formatRelativeTime = (date) => {
        const diff = new Date().getTime() - new Date(date).getTime();

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return "just now";
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
        if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;

        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
            <div className="flex items-center gap-2">
                <UserIcon status={connectionStatus}/>

                <div className="flex flex-col">
                    <span className="font-semibold">{username || "Unknown User"}</span>
                    <span className="text-xs text-zinc-500">
                        { connectionStatus === "online"
                            ? "Online"
                            : connectionStatus === "offline"
                                ? lastSeenAt
                                    ? `last seen ${formatRelativeTime(lastSeenAt)}`
                                    : "Never been online"
                                : "Connection inactive"
                        }
                    </span>
                </div>
            </div>

            {isGroup && (
                <button
                    className={`rounded-md px-2 py-1 text-sm font-semibold ${
                        membershipStatus
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    onClick={handleMembershipClick}
                >
                    {membershipStatus ? "Leave" : "Join"}
                </button>
            )}
        </div>
    )
}

export default ChatHeader;
