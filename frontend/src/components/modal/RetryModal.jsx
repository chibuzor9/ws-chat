import React from 'react';

const RetryModal = ({ onRetry }) => {
    return (
        <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
            <p className="text-lg font-semibold text-zinc-400 mb-2">
                Connection lost. Please try again.
            </p>
            <button
                className="mt-4 rounded-lg bg-zinc-700 px-4 py-2 text-zinc-300 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
                onClick={onRetry}
            >
                Try Again
            </button>
        </div>
)};

export default RetryModal;
