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
        // V2 fields
        viewport: v.optional(v.string()),
        suggestedFix: v.optional(v.string()),
        rubricCategory: v.optional(v.string()),
        severity: v.optional(v.string()),
        linkedChecklistId: v.optional(v.string()),
        findingStatus: v.optional(v.string()), // "open" | "student_fixed" | "verified"
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
    // V2 project fields
    isV2: v.optional(v.boolean()),
    submissionStatus: v.optional(v.string()), // "submitted" | "in_review" | "published"
    readinessStatus: v.optional(v.string()), // "not_assessed" | "changes_required" | "submit_ready"
    preflight: v.optional(v.string()), // JSON string
    checklist: v.optional(v.string()), // JSON string
    selfCheck: v.optional(v.string()), // JSON string
    reusableComments: v.optional(v.array(v.string())),
    aiSummary: v.optional(v.string()),
  }).index("by_projectId", ["id"]),
});
