import { z } from 'zod';

// Schema for app/api/admin/add-api-key/route.ts
export const AddApiKeySchema = z.object({
  apiKey: z.string().min(10, "API key must be at least 10 characters long"),
});

// Schema for app/api/admin/delete-api-key/route.ts and app/api/admin/toggle-api-key/route.ts
// Assuming 'id' is a CUID or UUID. Using string and can be refined with .cuid() or .uuid() if needed.
export const ApiKeyIdSchema = z.object({
  id: z.string().min(1, "ID is required"), // Basic check, can be made more specific e.g. .uuid()
});

// Schema for app/api/process-task/route.ts
export const ProcessTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional().nullable(),
  enable_ai_ranking: z.boolean(),
  enable_ai_subtasks: z.boolean(),
});

// If URL parameters are handled as an object after parsing
export const DeleteApiKeyParamsSchema = z.object({
  id: z.string().uuid("Invalid UUID format for API key ID"),
});

export const ToggleApiKeyParamsSchema = z.object({
  id: z.string().uuid("Invalid UUID format for API key ID"),
});
