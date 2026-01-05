'use client';

import { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { createPublicWebCall } from '@/actions/retell';
import { Loader2, Mic, Phone, PhoneOff } from 'lucide-react';

interface PublicAgentTesterProps {
    agentId: string;
    agentName: string;
}

export default function PublicAgentTester({ agentId, agentName }: PublicAgentTesterProps) {
    const [isCalling, setIsCalling] = useState(false);
    const [isAgentTalking, setIsAgentTalking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const retellClient = useRef<RetellWebClient | null>(null);

    useEffect(() => {
        // Initialize SDK
        retellClient.current = new RetellWebClient();

        // Setup event listeners
        retellClient.current.on('call_started', () => {
            console.log('Call started');
            setIsCalling(true);
            setError(null);
        });

        retellClient.current.on('call_ended', () => {
            console.log('Call ended');
            setIsCalling(false);
            setIsAgentTalking(false);
        });

        retellClient.current.on('agent_start_talking', () => {
            setIsAgentTalking(true);
        });

        retellClient.current.on('agent_stop_talking', () => {
            setIsAgentTalking(false);
        });

        retellClient.current.on('error', (err) => {
            console.error('Retell Error:', err);
            setError('An error occurred during the call.');
            setIsCalling(false);
        });

        return () => {
            if (retellClient.current) {
                retellClient.current.stopCall();
            }
        };
    }, []);

    const startCall = async () => {
        setError(null);
        try {
            const data = await createPublicWebCall(agentId);
            if (!data.access_token) {
                throw new Error('Failed to get access token');
            }

            await retellClient.current?.startCall({
                accessToken: data.access_token,
            });
        } catch (err: any) {
            console.error('Failed to start call:', err);
            setError(err.message || 'Failed to start call');
        }
    };

    const stopCall = () => {
        retellClient.current?.stopCall();
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">{agentName}</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Powered by Retell AI
                    </p>
                </div>

                <div className="mt-8 flex flex-col items-center justify-center space-y-6 py-8">
                    {/* Status Indicator */}
                    <div className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-500 ${isCalling ? (isAgentTalking ? 'bg-green-100 scale-110' : 'bg-blue-50') : 'bg-gray-50'}`}>
                        {isCalling && (
                            <div className={`absolute inset-0 animate-ping rounded-full opacity-75 ${isAgentTalking ? 'bg-green-200' : 'bg-blue-200'}`}></div>
                        )}
                        <Mic className={`h-12 w-12 transition-colors duration-300 ${isCalling ? (isAgentTalking ? 'text-green-600' : 'text-blue-600') : 'text-gray-400'}`} />
                    </div>

                    <div className="text-center">
                        <p className="text-lg font-medium text-gray-900">
                            {isCalling ? (isAgentTalking ? 'Agent is speaking...' : 'Listening...') : 'Ready to chat'}
                        </p>
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4">
                        {!isCalling ? (
                            <button
                                onClick={startCall}
                                className="flex items-center gap-2 rounded-full bg-black px-8 py-4 text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-gray-800 active:scale-95"
                            >
                                <Phone className="h-6 w-6" />
                                Start Call
                            </button>
                        ) : (
                            <button
                                onClick={stopCall}
                                className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700 active:scale-95"
                            >
                                <PhoneOff className="h-6 w-6" />
                                End Call
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        Microphone access required.
                    </p>
                </div>
            </div>
        </div>
    );
}
