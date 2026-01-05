import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkspace extends Document {
    name: string;
    ownerId: string; // Clerk ID
    retellApiKey?: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        ownerId: { type: String, required: true, index: true },
        retellApiKey: { type: String },
        slug: { type: String, required: true, unique: true, index: true },
    },
    { timestamps: true }
);

const Workspace: Model<IWorkspace> = mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);

export default Workspace;
