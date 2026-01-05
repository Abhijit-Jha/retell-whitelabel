import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkspaceMember extends Document {
    workspaceId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: 'OWNER' | 'ADMIN' | 'VIEWER';
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceMemberSchema: Schema = new Schema(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        role: { type: String, enum: ['OWNER', 'ADMIN', 'VIEWER'], default: 'VIEWER', required: true },
    },
    { timestamps: true }
);

// Compound index to ensure a user is only a member of a workspace once
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const WorkspaceMember: Model<IWorkspaceMember> = mongoose.models.WorkspaceMember || mongoose.model<IWorkspaceMember>('WorkspaceMember', WorkspaceMemberSchema);

export default WorkspaceMember;
