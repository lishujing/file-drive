import { v, ConvexError } from 'convex/values'
import { getUser } from './users'
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server'
import { fileTypes } from './schema'
import { Id } from './_generated/dataModel'

export const generateUploadUrl = mutation(async (ctx) => {
  const identify = await ctx.auth.getUserIdentity()

  if (!identify) {
    throw new ConvexError('you must be logged in to upload a file')
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
    fileId: v.id('_storage'),
    orgId: v.string(),
    type: fileTypes,
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
      type: args.type,
    })
  },
})

export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    favorites: v.optional(v.boolean())
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
    let files = await ctx.db
      .query('files')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect()

    const query = args.query
    if (query) {
      files = files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()))
    }

    if(args.favorites) {
      const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", identify.tokenIdentifier)).first()
      if(!user) {
        return files
      }
      const favorites = await ctx.db.query("favorites").withIndex("by_userId_orgId_fileId", q => q.eq("userId", user._id).eq("orgId", args.orgId)).collect()
      files = files.filter((file) => favorites.some((favorite) => favorite.fileId === file._id))
    }
    return files
  },
})

export const deleteFile = mutation({
  args: {
    fileId: v.id('files'),
  },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId)
    if (!access) {
      throw new ConvexError('no access to file')
    }
    await ctx.db.delete(args.fileId)
  },
})

export const toggleFavorite = mutation({
  args: {
    fileId: v.id('files'),
  },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId)

    if (!access) {
      throw new ConvexError('no access to file')
    }
    const { user, file } = access

    const favorite = await ctx.db
      .query('favorites')
      .withIndex('by_userId_orgId_fileId', (q) =>
        q.eq('userId', user._id).eq('orgId', file.orgId).eq('fileId', file._id)
      )
      .first()

    if (!favorite) {
      await ctx.db.insert('favorites', {
        fileId: file._id,
        userId: user._id,
        orgId: file.orgId,
      })
    } else {
      await ctx.db.delete(favorite._id)
    }
  },
})

async function hasAccessToFile(ctx: QueryCtx | MutationCtx, fileId: Id<'files'>) {
  const identify = await ctx.auth.getUserIdentity()
  if (!identify) {
    return null
  }
  const file = await ctx.db.get(fileId)
  if (!file) {
    return null
  }

  const hasAccess = await hasAccessToOrg(ctx, identify.tokenIdentifier, file.orgId)
  if (!hasAccess) {
    return null
  }
  const user = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identify.tokenIdentifier))
    .first()
  if (!user) {
    return user
  }

  return { user, file }
}
