import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import WorkspaceMember from "@/models/WorkspaceMember";
import Workspace from "@/models/Workspace";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    await connectDB();

    // Fetch user's workspace
    // Note: We need to find the User doc first to get the _id
    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ clerkId: userId });

    if (!user) redirect("/sign-in");

    const membership = await WorkspaceMember.findOne({ userId: user._id }).populate("workspaceId");

    if (!membership) {
        // Edge case: User exists but no workspace (maybe webhook failed?)
        // For now, redirect to onboarding or show error
        return <div>No workspace found. Please contact support.</div>;
    }

    const workspace = membership.workspaceId as any; // Type assertion for populated field

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                    Welcome back to {workspace.name}
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Stats Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Agents</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
                </div>

                {/* Status Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Integration Status</h3>
                    <div className="mt-2 flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${workspace.retellApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium text-gray-900">
                            {workspace.retellApiKey ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
