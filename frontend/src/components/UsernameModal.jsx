import React from 'react'

const UsernameModal = ({ open, onSubmit }) => {
    const isOpen = open ?? false

    return (
        isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
                    <p className="text-lg font-semibold text-zinc-400 mb-2">
                        Provide your username: 
                    </p>

                    <input 
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/40" 
                        placeholder="johndoe1" 
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onSubmit(e.target.value)
                            };
                        }} 
                    />
                </div>
            </div>
        )
)};

export default UsernameModal;