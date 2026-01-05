import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    clerkId: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        clerkId: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true },
        name: { type: String },
    },
    { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
