import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    id: v.string(),
    name: v.string(),
    type: v.string(), // "URL" or "IMAGE"
    content: v.string(),
    pins: v.array(
      v.object({
        id: v.string(),
        number: v.number(),
        x: v.number(),
        y: v.number(),
        status: v.string(), // "OPEN" or "RESOLVED"
        comments: v.array(
          v.object({
            id: v.string(),
            author: v.string(),
            text: v.string(),
            timestamp: v.string(), // ISO String
            attachment: v.optional(
              v.object({
                data: v.string(),
                name: v.string(),
                type: v.string(),
              })
            ),
          })
        ),
      })
    ),
    createdAt: v.string(), // ISO String
    isLocked: v.optional(v.boolean()),
    studentEmail: v.optional(v.string()),
    studentName: v.optional(v.string()),
    notes: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
  }).index("by_projectId", ["id"]),
});
