import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const NavTabs = ({ data: tab }) => {
    const [open, setOpen] = useState(true);

    return (
        <div>
    <button
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
    >
        {tab.label}
        <ChevronRight className={`ml-auto size-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
    </button>

    <div className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
            <div className={`flex flex-col gap-1 pl-6 transition-[margin] duration-200 ${open ? 'mt-2' : 'mt-0'}`}>
                {tab.items.map((item) => (
                    <div key={item.id} className="text-sm text-zinc-400 hover:text-zinc-100 cursor-pointer">
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    </div>
</div>
    );
};

export default NavTabs;