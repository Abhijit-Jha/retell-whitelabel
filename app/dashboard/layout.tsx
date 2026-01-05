import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard, Mic, Settings } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import WorkspaceMember from "@/models/WorkspaceMember";
import Workspace from "@/models/Workspace";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    await connectDB();
    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ clerkId: userId });

    if (!user) redirect("/onboarding");

    const membership = await WorkspaceMember.findOne({ userId: user._id }).populate("workspaceId");

    if (!membership) {
        redirect("/onboarding");
    }

    const workspace = membership.workspaceId as any;

    if (!workspace.retellApiKey) {
        redirect("/onboarding");
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white">
                <div className="flex h-16 items-center border-b border-gray-200 px-6">
                    <span className="text-lg font-bold tracking-tight">Retell Dash</span>
                </div>
                <nav className="flex flex-col gap-1 p-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </Link>
                    <Link
                        href="/dashboard/agents"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <Mic className="h-4 w-4" />
                        Agents
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </nav>
                <div className="absolute bottom-0 left-0 w-full border-t border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <UserButton />
                        <span className="text-sm font-medium text-gray-700">Account</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
