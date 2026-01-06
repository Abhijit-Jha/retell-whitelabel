import { listRetellAgents, importAgent } from "@/actions/retell";
import { Plus } from "lucide-react";
import connectDB from "@/lib/db";
import Agent from "@/models/Agent";
import WorkspaceMember from "@/models/WorkspaceMember";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Components
import { ImportAgentButton } from "./import-button";

export default async function AgentsPage() {
    try {
        const { userId } = await auth();
        if (!userId) redirect("/sign-in");

        await connectDB();
        const User = (await import("@/models/User")).default;
        const user = await User.findOne({ clerkId: userId });
        if (!user) redirect("/sign-in");

        const membership = await WorkspaceMember.findOne({ userId: user._id });
        if (!membership) redirect("/onboarding");

        // Fetch imported agents from DB
        const importedAgents = await Agent.find({ workspaceId: membership.workspaceId }).sort({ createdAt: -1 });

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agents</h1>
                        <p className="text-sm text-gray-500">Manage your Retell AI voice agents.</p>
                    </div>
                    <ImportAgentButton />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Agent ID</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importedAgents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            No agents imported yet. Click "Import Agent" to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    importedAgents.map((agent) => (
                                        <tr key={agent._id.toString()} className="border-b bg-white hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <a href={`/dashboard/agents/${agent.retellAgentId}`} className="hover:underline">
                                                    {agent.name}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{agent.retellAgentId}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    {agent.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{new Date(agent.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error loading AgentsPage:", error);
        return (
            <div className="p-6 text-red-500">
                <h1 className="text-xl font-bold">Error Loading Agents</h1>
                <p>Please check the server logs for more details.</p>
                <pre className="mt-4 bg-gray-100 p-4 rounded text-sm text-gray-800 overflow-auto">
                    {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
                </pre>
            </div>
        );
    }
}
