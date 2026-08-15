import Logo from "./Logo";
import NavigationTabs from "./NavigationTabs";
import Profile from "./Profile";

const Sidebar = ({ username, connectionStatus, onSelectConvo }) => {    
    return (
        <div className="flex h-full flex-col bg-zinc-800 text-zinc-100">
            <Logo />
            <NavigationTabs onSelectConvo={onSelectConvo}/> 
            <Profile username={username} connectionStatus={connectionStatus} /> 
            {/* Fix later the dynamism of connection status: online, connecting, offline */}
        </div>
)};

export default Sidebar;