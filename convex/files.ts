import { v, ConvexError } from "convex/values"
import { mutation, query } from "./_generated/server"

export const createFile = mutation({
  args: {
    name: v.string(),
    orgId: v.string()
  },
  async handler(ctx, args) {
    const identify = await ctx.auth.getUserIdentity();
    if(!identify) {
      throw new ConvexError('you must be logged in to upload a file')
    }
    await ctx.db.insert("files", {
      name: args.name,
      orgId: args.orgId
    })
  }
})

export const getFiles = query({
  args: {
    orgId: v.string()
  },
  async handler(ctx, args) {
    const identify = await ctx.auth.getUserIdentity();
    if(!identify) {
      return []
    }
    return ctx.db.query("files").withIndex("by_orgId", q => q.eq("orgId", args.orgId)).collect()
  }
})