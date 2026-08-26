import React from 'react';
import NavTabs from './NavTabs';

/*
tabsData = {
    users: [{ id, username }],
    groups: [{ id, label }]
}
*/
const NavigationTabs = ({ onSelectConvo, tabsData }) => {
    const { users, groups } = tabsData ?? {};

    const handleSelectedUser = (selectedUserId) => {
        onSelectConvo(selectedUserId);
    };

    const toItems = (rows) => {
        return (rows || []).map((row) => ({
            id: row.id,
            label: row.username || row.label
        }));
    };

    const userTabs = toItems(users);
    const groupTabs = toItems(groups);

    const sections = [
        { kind: "dm", label: "Direct Messages", items: userTabs },
        { kind: "group", label: "Groups", items: groupTabs }
    ];

    return (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-4 scroll-fade">
            {sections.map((section) => (
                <NavTabs
                    key={section.kind}
                    label={section.label}
                    items={section.items}
                    onSubmit={handleSelectedUser}
                />
            ))}
        </div>
    )
}

export default NavigationTabs;
