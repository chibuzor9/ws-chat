import React from 'react';
import { tabs } from '../shared/TabsData';
import NavTabs from './NavTabs';

const NavigationTabs = ({ onSelectConvo }) => {
    const handleSelectedUser = (selectedUserId) => {
        onSelectConvo(selectedUserId);
    };

    return (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-4 scroll-fade">
            {tabs.map((tab) => (
                <NavTabs key={tab.id} id={tab.id} onSubmit={handleSelectedUser}/>
            ))}
        </div>
    )
}

export default NavigationTabs;