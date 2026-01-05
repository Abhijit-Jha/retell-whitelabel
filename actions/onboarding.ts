'use server';

import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Workspace from '@/models/Workspace';
import WorkspaceMember from '@/models/WorkspaceMember';
import { encrypt } from '@/lib/encryption';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('Unauthorized');
    }

    const apiKey = formData.get('apiKey') as string;
    if (!apiKey) {
        throw new Error('API Key is required');
    }

    await connectDB();

    // 1. Find User by Clerk ID
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
        throw new Error('User not found');
    }

    // 2. Find WorkspaceMember for this user with role OWNER
    const member = await WorkspaceMember.findOne({
        userId: user._id,
        role: 'OWNER'
    });

    if (!member) {
        throw new Error('No workspace found for user');
    }

    // 3. Update Workspace with API Key
    const encryptedKey = encrypt(apiKey);

    await Workspace.findByIdAndUpdate(member.workspaceId, {
        retellApiKey: encryptedKey
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');
}
