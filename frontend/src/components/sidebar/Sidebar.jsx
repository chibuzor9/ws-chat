import Logo from "./Logo";
import NavigationTabs from "./NavigationTabs";
import Profile from "./Profile";

const Sidebar = ({ username }) => {    
    return (
        <div className="flex h-full flex-col bg-zinc-800 text-zinc-100">
            <Logo />
            <NavigationTabs /> 
            <Profile username={username} connectionStatus="offline" /> 
            {/* Fix later the dynamism of connection status: online, connecting, offline */}
        </div>
)};

export default Sidebar;