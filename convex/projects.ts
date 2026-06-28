import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

export const getProjectById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("id", args.id))
      .first();
  },
});

export const createProject = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    type: v.string(),
    content: v.string(),
    pins: v.array(
      v.object({
        id: v.string(),
        number: v.number(),
        x: v.number(),
        y: v.number(),
        status: v.string(),
        viewport: v.optional(v.string()),
        suggestedFix: v.optional(v.string()),
        rubricCategory: v.optional(v.string()),
        severity: v.optional(v.string()),
        linkedChecklistId: v.optional(v.string()),
        findingStatus: v.optional(v.string()),
        comments: v.array(
          v.object({
            id: v.string(),
            author: v.string(),
            text: v.string(),
            timestamp: v.string(),
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
    createdAt: v.string(),
    isLocked: v.optional(v.boolean()),
    studentEmail: v.optional(v.string()),
    studentName: v.optional(v.string()),
    notes: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    isV2: v.optional(v.boolean()),
    submissionStatus: v.optional(v.string()),
    readinessStatus: v.optional(v.string()),
    preflight: v.optional(v.string()),
    checklist: v.optional(v.string()),
    selfCheck: v.optional(v.string()),
    reusableComments: v.optional(v.array(v.string())),
    aiSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("id", args.id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("projects", args);
  },
});

export const updateProject = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    type: v.string(),
    content: v.string(),
    pins: v.array(
      v.object({
        id: v.string(),
        number: v.number(),
        x: v.number(),
        y: v.number(),
        status: v.string(),
        viewport: v.optional(v.string()),
        suggestedFix: v.optional(v.string()),
        rubricCategory: v.optional(v.string()),
        severity: v.optional(v.string()),
        linkedChecklistId: v.optional(v.string()),
        findingStatus: v.optional(v.string()),
        comments: v.array(
          v.object({
            id: v.string(),
            author: v.string(),
            text: v.string(),
            timestamp: v.string(),
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
    createdAt: v.string(),
    isLocked: v.optional(v.boolean()),
    studentEmail: v.optional(v.string()),
    studentName: v.optional(v.string()),
    notes: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    isV2: v.optional(v.boolean()),
    submissionStatus: v.optional(v.string()),
    readinessStatus: v.optional(v.string()),
    preflight: v.optional(v.string()),
    checklist: v.optional(v.string()),
    selfCheck: v.optional(v.string()),
    reusableComments: v.optional(v.array(v.string())),
    aiSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("id", args.id))
      .first();
    if (!existing) {
      throw new Error(`Project not found with id ${args.id}`);
    }
    await ctx.db.replace(existing._id, args);
  },
});

export const deleteProject = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("id", args.id))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
