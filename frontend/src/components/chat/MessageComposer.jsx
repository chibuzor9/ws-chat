import React, { useState } from 'react';

const MessageComposer = ({ onSend }) => {
    const [text, setText] = useState("");

    const send = () => {
        const trimmed = text.trim();
        if (!trimmed) return;

        onSend?.(trimmed);
        setText("");
    };

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-zinc-500/70 via-zinc-300/40 to-transparent px-4 pb-4 pt-12">
            <div className="pointer-events-auto flex w-full items-center gap-2 rounded-4xl border border-white/50 bg-white/30 p-1.5 shadow-lg shadow-zinc-500/20 backdrop-blur-md">
                <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && send()}
                    placeholder="Start Typing..."
                    className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm text-zinc-800 outline-none placeholder:text-zinc-500"
                />

                <button
                    onClick={send}
                    disabled={!text.trim()}
                    className="shrink-0 rounded-4xl bg-zinc-800/95 px-4 py-1.5 text-sm font-medium text-zinc-100 transition hover:bg-zinc-900 disabled:opacity-30"
                >
                    Send
                </button>
            </div>
        </div>
    )
};

export default MessageComposer;
