import { v, ConvexError } from "convex/values"
import { mutation, query } from "./_generated/server"

export const createFile = mutation({
  args: {
    name: v.string()
  },
  async handler(ctx, args) {
    const identify = await ctx.auth.getUserIdentity();
    if(!identify) {
      throw new ConvexError('you must be logged in to upload a file')
    }
    await ctx.db.insert("files", {
      name: args.name,
    })
  }
})

export const getFiles = query({
  args: {},
  async handler(ctx, args) {
    const identify = await ctx.auth.getUserIdentity();
    if(!identify) {
      return []
    }
    return ctx.db.query("files").collect()
  }
})