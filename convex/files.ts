import { v, ConvexError } from 'convex/values'
import { getUser } from './users'
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server'
import { fileTypes } from './schema'

export const generateUploadUrl = mutation(async (ctx) => {
  const identify = await ctx.auth.getUserIdentity();

  if(!identify) {
    throw new ConvexError("you must be logged in to upload a file")
  }

  return await ctx.storage.generateUploadUrl()
})

async function hasAccessToOrg(ctx: QueryCtx | MutationCtx, tokenIdentifier: string, orgId: string) {
  const user = await getUser(ctx, tokenIdentifier)
  const hasAccess = user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId)
  return hasAccess
}

export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    orgId: v.string(),
    type: fileTypes
  },
  async handler(ctx, args) {
    const identify = await ctx.auth.getUserIdentity()
    if (!identify) {
      throw new ConvexError('you must be logged in to upload a file')
    }

    const hasAccess = await hasAccessToOrg(ctx, identify.tokenIdentifier, args.orgId)
    if (!hasAccess) {
      throw new ConvexError('you do not have access to this org')
    }
    await ctx.db.insert('files', {
      name: args.name,
      orgId: args.orgId,
      fileId: args.fileId,
      type: args.type
    })
  },
})

export const getFiles = query({
  args: {
    orgId: v.string(),
  },
  async handler(ctx, args) {
    const identify = await ctx.auth.getUserIdentity()
    if (!identify) {
      return []
    }
    const hasAccess = await hasAccessToOrg(ctx, identify.tokenIdentifier, args.orgId)
    if (!hasAccess) {
      return []
    }
    return ctx.db
      .query('files')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect()
  },
})


export const deleteFile = mutation({
  args: {
    fileId: v.id("files")
  },
  async handler(ctx, args) {
    const identify = await ctx.auth.getUserIdentity()
    if (!identify) {
      throw new ConvexError('you do not have access to this org')
    }

    const file = await ctx.db.get(args.fileId);

    if(!file) {
      throw new ConvexError("this file does not exist")
    }

    const hasAccess = await hasAccessToOrg(ctx, identify.tokenIdentifier, file.orgId)
    if (!hasAccess) {
      throw new ConvexError('you do not have access to delete this file')
    }

    await ctx.db.delete(args.fileId)
  }
})