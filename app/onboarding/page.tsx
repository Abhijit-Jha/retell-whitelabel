import { completeOnboarding } from '@/actions/onboarding';
import { currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Workspace from '@/models/Workspace';
import WorkspaceMember from '@/models/WorkspaceMember';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
    const user = await currentUser();
    if (!user) redirect('/sign-in');

    // Sync user if missing (fallback for failed webhook)
    await connectDB();
    const existingUser = await User.findOne({ clerkId: user.id });

    if (!existingUser) {
        const email = user.emailAddresses[0]?.emailAddress;
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();

        try {
            const newUser = await User.create({
                clerkId: user.id,
                email,
                name,
            });

            const workspaceName = `${name || 'My'}'s Workspace`;
            const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

            const newWorkspace = await Workspace.create({
                name: workspaceName,
                ownerId: user.id,
                slug: slug,
            });

            await WorkspaceMember.create({
                workspaceId: newWorkspace._id,
                userId: newUser._id,
                role: 'OWNER',
            });
        } catch (error) {
            console.error('Error syncing user:', error);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Welcome to Retell Dashboard
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        To get started, please connect your Retell account by providing your API Key.
                    </p>
                </div>

                <form action={completeOnboarding} className="space-y-6">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                            Retell API Key
                        </label>
                        <div className="mt-1">
                            <input
                                id="apiKey"
                                name="apiKey"
                                type="password"
                                required
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                placeholder="key_..."
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Your key is encrypted and stored securely.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                        Connect Retell to continue
                    </button>
                </form>
            </div>
        </div>
    );
}
