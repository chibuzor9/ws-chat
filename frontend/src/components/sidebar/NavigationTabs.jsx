import React from 'react';
import NavTabs from './NavTabs';

const NavigationTabs = () => {
    const tabs = [
        { id: 1, label: "Direct Messages", items: [
            { id: 123, label: "John Doe" },
            { id: 101, label: "Jane Smith" },
            { id: 187, label: "Alice Johnson" },
            { id: 145, label: "Bob Brown" },
            { id: 165, label: "Charlie Davis" },
        ] },

        { id: 2, label: "Groups", items: [
            { id: 23, label: "Project SpaceX" },
            { id: 49, label: "Project Citadel" },
            { id: 76, label: "Project Sparx" },
        ] }
    ];

    return (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-4 scroll-fade">
            {tabs.map((tab) => (
                <NavTabs key={tab.id} data={tab} />
            ))}
        </div>
    )
}

export default NavigationTabs;