import { Model, Schema, model, models } from "mongoose";

export interface IUser {
  name?: string | null;
  email: string;
  image?: string | null;
  role?: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserModel = Model<IUser>;

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const User: UserModel = (models.User as UserModel) || model<IUser>("User", UserSchema);

export default User;

