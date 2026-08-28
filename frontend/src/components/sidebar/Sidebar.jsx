import Logo from "./Logo";
import NavigationTabs from "./NavigationTabs";
import Profile from "./Profile";

const Sidebar = ({ 
    username, 
    connectionStatus, 
    onSelectConvo, 
    onLogOut, 
    tabsData, 
    onCreate
}) => {    
    return (
        <div className="flex h-full flex-col bg-zinc-800 text-zinc-100">
            <Logo />

            <NavigationTabs 
                onSelectConvo={onSelectConvo} 
                tabsData={tabsData} 
                onCreate={onCreate}
            /> 

            <Profile
                username={username} 
                connectionStatus={connectionStatus} 
                onLogOut={onLogOut} 
            />
        </div>
)};

export default Sidebar;