import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgent extends Document {
    workspaceId: mongoose.Types.ObjectId;
    retellAgentId: string;
    name: string;
    status: string;
    config: any;
    createdAt: Date;
    updatedAt: Date;
}

const AgentSchema: Schema = new Schema(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        retellAgentId: { type: String, required: true },
        name: { type: String, required: true },
        status: { type: String, default: 'inactive' },
        config: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

const Agent: Model<IAgent> = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);

export default Agent;
