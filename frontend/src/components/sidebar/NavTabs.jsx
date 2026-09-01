import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Plus } from 'lucide-react';

const NavTabs = ({ label, items = [], onSubmit, onCreate, isGroup }) => {
    const [open, setOpen] = useState(true);
    const [creating, setCreating] = useState(false);
    const [draft, setDraft] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (creating) inputRef.current?.focus();
    }, [creating]);

    const startCreating = () => {
        setDraft('');
        setOpen(true);
        setCreating(true);
    };

    const cancelCreating = () => {
        setCreating(false);
        setDraft('');
    };

    const commitCreating = () => {
        const name = draft.trim();
        if (name) onCreate?.(name);
        cancelCreating();
    };

    return (
        <div>
            <div className="flex w-full items-center gap-1 rounded-lg pr-2 text-sm font-medium text-zinc-400 hover:bg-zinc-700">
                <button
                    className="flex flex-1 items-center gap-2 px-3 py-2 text-left hover:text-zinc-100"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                >
                    {label}
                </button>

                {isGroup && (
                    <button
                        type="button"
                        className="shrink-0 hover:text-zinc-100"
                        title="Create Group"
                        aria-label="Create group"
                        onClick={startCreating}
                    >
                        <Plus className="size-4" />
                    </button>
                )}

                <ChevronRight
                    className={`shrink-0 size-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                    onClick={() => setOpen(!open)}
                />
            </div>

            <div className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className={`flex flex-col gap-1 pl-6 transition-[margin] duration-200 ${open ? 'mt-2' : 'mt-0'}`}>
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="text-sm text-zinc-400 hover:text-zinc-100 cursor-pointer"
                                onClick = {() => onSubmit(item.id) }
                            >
                                #{item.label}
                            </div>
                        ))}

                        {creating && (
                            <div className="flex items-center text-sm text-zinc-400">
                                <span className="select-none">#</span>
                                <input
                                    ref={inputRef}
                                    value={draft}
                                    placeholder="new-group"
                                    className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-600 outline-none"
                                    onChange={(e) => setDraft(e.target.value)}
                                    onBlur={cancelCreating}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') commitCreating();
                                        if (e.key === 'Escape') cancelCreating();
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
)};

export default NavTabs;
