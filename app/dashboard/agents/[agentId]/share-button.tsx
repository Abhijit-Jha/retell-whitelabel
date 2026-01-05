'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
    slug: string;
    agentId: string;
}

export default function ShareButton({ slug, agentId }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const url = `${window.location.origin}/${slug}/${agentId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share Agent'}
        </button>
    );
}
