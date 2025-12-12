import { z } from "zod";

export const createNewsletterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  structureJSON: z.record(z.any()).default({}),
});

export const updateNewsletterSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  structureJSON: z.record(z.any()).optional(),
});

export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterSchema>;

