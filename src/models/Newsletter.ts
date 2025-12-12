import { Model, Schema, model, models } from "mongoose";

export interface INewsletter {
  title: string;
  userId: Schema.Types.ObjectId;
  structureJSON: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NewsletterModel = Model<INewsletter>;

const NewsletterSchema = new Schema<INewsletter>(
  {
    title: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    structureJSON: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Newsletter: NewsletterModel =
  (models.Newsletter as NewsletterModel) ||
  model<INewsletter>("Newsletter", NewsletterSchema);

export default Newsletter;

