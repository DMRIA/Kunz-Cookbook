import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Generate a random share token
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const createShareLink = mutation({
  args: {
    cookbookId: v.id("cookbooks"),
    maxUsages: v.optional(v.number()),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    // Verify cookbook ownership
    const cookbook = await ctx.db.get(args.cookbookId)
    if (!cookbook || cookbook.userId !== userId) {
      throw new Error("Not authorized")
    }

    const shareToken = generateShareToken()
    const expiresAt = args.expiresInDays ? Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000 : undefined

    const shareId = await ctx.db.insert("cookbookShares", {
      cookbookId: args.cookbookId,
      shareToken,
      createdBy: userId,
      expiresAt,
      maxUsages: args.maxUsages,
      usageCount: 0,
      createdAt: Date.now(),
    })

    return { shareId, shareToken }
  },
})

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("cookbookShares")
      .withIndex("by_token", (q) => q.eq("shareToken", args.token))
      .first()

    if (!share) return null

    // Check if expired
    if (share.expiresAt && share.expiresAt < Date.now()) {
      return null
    }

    // Check if max usages reached
    if (share.maxUsages && share.usageCount >= share.maxUsages) {
      return null
    }

    const cookbook = await ctx.db.get(share.cookbookId)
    if (!cookbook) return null

    const owner = await ctx.db.get(cookbook.userId)

    return {
      cookbook,
      ownerName: owner?.name || owner?.email || "Unknown",
      share,
    }
  },
})

export const useShareLink = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const share = await ctx.db
      .query("cookbookShares")
      .withIndex("by_token", (q) => q.eq("shareToken", args.token))
      .first()

    if (!share) throw new Error("Invalid share link")

    // Check if expired
    if (share.expiresAt && share.expiresAt < Date.now()) {
      throw new Error("Share link has expired")
    }

    // Check if max usages reached
    if (share.maxUsages && share.usageCount >= share.maxUsages) {
      throw new Error("Share link has reached maximum usages")
    }

    // Increment usage count
    await ctx.db.patch(share._id, {
      usageCount: share.usageCount + 1,
    })

    return share.cookbookId
  },
})

export const listForCookbook = query({
  args: { cookbookId: v.id("cookbooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const cookbook = await ctx.db.get(args.cookbookId)
    if (!cookbook || cookbook.userId !== userId) {
      return []
    }

    const shares = await ctx.db
      .query("cookbookShares")
      .withIndex("by_cookbook", (q) => q.eq("cookbookId", args.cookbookId))
      .collect()

    return shares
  },
})
