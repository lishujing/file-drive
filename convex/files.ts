import { v, ConvexError } from 'convex/values'
import { getUser } from './users'
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server'

async function hasAccessToOrg(ctx: QueryCtx | MutationCtx, tokenIdentifier: string, orgId: string) {
  const user = await getUser(ctx, tokenIdentifier)
  const hasAccess = user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId)
  return hasAccess
}

export const createFile = mutation({
  args: {
    name: v.string(),
    orgId: v.string(),
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
