import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import WorkspaceMember from "@/models/WorkspaceMember";
import Workspace from "@/models/Workspace";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/actions/onboarding"; // Reuse the action or create a new one

export default async function SettingsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    await connectDB();
    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ clerkId: userId });
    if (!user) redirect("/sign-in");

    const membership = await WorkspaceMember.findOne({ userId: user._id }).populate("workspaceId");
    if (!membership) redirect("/onboarding");

    const workspace = membership.workspaceId as any;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Manage your workspace settings and integrations.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900">Retell Integration</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Update your Retell API Key to sync agents.
                </p>

                <form action={completeOnboarding} className="mt-6 max-w-md space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                            API Key
                        </label>
                        <div className="mt-1">
                            <input
                                id="apiKey"
                                name="apiKey"
                                type="password"
                                required
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
                                placeholder="key_..."
                                defaultValue={workspace.retellApiKey ? "********" : ""}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
