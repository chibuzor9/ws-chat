import { useState, React } from 'react';
import Logo from "./Logo";
import NavigationTabs from "./NavigationTabs";
import Profile from "./Profile";

const Sidebar = ({ username }) => {    
    return (
        <div className="flex h-full flex-col bg-zinc-800 text-zinc-100">
            <Logo />
            <NavigationTabs />
            <Profile username={username} connectionStatus="online" />
        </div>
)};

export default Sidebar;