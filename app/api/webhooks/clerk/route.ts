import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import connectDB from '@/lib/db'
import User from '@/models/User'
import Workspace from '@/models/Workspace'
import WorkspaceMember from '@/models/WorkspaceMember'

export async function POST(req: Request) {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!SIGNING_SECRET) {
        throw new Error('Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Create new Svix instance with secret
    const wh = new Webhook(SIGNING_SECRET)

    // Get headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error: Missing Svix headers', {
            status: 400,
        })
    }

    // Get body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    let evt: WebhookEvent

    // Verify payload with headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error: Could not verify webhook:', err)
        return new Response('Error: Verification error', {
            status: 400,
        })
    }

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data
    const eventType = evt.type
    console.log(`Webhook with and ID of ${id} and type of ${eventType}`)
    console.log('Webhook body:', body)

    if (eventType === 'user.created') {
        await connectDB()
        const { id, email_addresses, first_name, last_name } = evt.data
        const email = email_addresses[0]?.email_address
        const name = `${first_name || ''} ${last_name || ''}`.trim()

        try {
            // Create User
            const newUser = await User.create({
                clerkId: id,
                email,
                name,
            })

            // Create Default Workspace
            const workspaceName = `${name || 'My'}'s Workspace`
            const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

            const newWorkspace = await Workspace.create({
                name: workspaceName,
                ownerId: id,
                slug: slug,
            })

            // Create Workspace Member
            await WorkspaceMember.create({
                workspaceId: newWorkspace._id,
                userId: newUser._id,
                role: 'OWNER',
            })

            console.log(`User ${id} created with workspace ${newWorkspace._id}`)
        } catch (error) {
            console.error('Error creating user in DB:', error)
            return new Response('Error creating user in DB', { status: 500 })
        }
    }

    return new Response('Webhook received', { status: 200 })
}
