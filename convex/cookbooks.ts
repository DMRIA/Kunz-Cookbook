import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const cookbookId = await ctx.db.insert("cookbooks", {
      name: args.name,
      description: args.description,
      userId,
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return cookbookId
  },
})

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const cookbooks = await ctx.db
      .query("cookbooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect()

    return cookbooks
  },
})

export const get = query({
  args: { id: v.id("cookbooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    const cookbook = await ctx.db.get(args.id)

    if (!cookbook) return null

    // Allow access if user owns it or if it's public
    if (cookbook.userId !== userId && !cookbook.isPublic) {
      return null
    }

    return cookbook
  },
})

export const update = mutation({
  args: {
    id: v.id("cookbooks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const cookbook = await ctx.db.get(args.id)
    if (!cookbook || cookbook.userId !== userId) {
      throw new Error("Not authorized")
    }

    await ctx.db.patch(args.id, {
      ...(args.name && { name: args.name }),
      ...(args.description && { description: args.description }),
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id("cookbooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const cookbook = await ctx.db.get(args.id)
    if (!cookbook || cookbook.userId !== userId) {
      throw new Error("Not authorized")
    }

    // Delete all recipes in this cookbook
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_cookbook", (q) => q.eq("cookbookId", args.id))
      .collect()

    for (const recipe of recipes) {
      await ctx.db.delete(recipe._id)
    }

    // Delete all share links for this cookbook
    const shares = await ctx.db
      .query("cookbookShares")
      .withIndex("by_cookbook", (q) => q.eq("cookbookId", args.id))
      .collect()

    for (const share of shares) {
      await ctx.db.delete(share._id)
    }

    // Delete the cookbook itself
    await ctx.db.delete(args.id)
  },
})

export const copy = mutation({
  args: {
    sourceCookbookId: v.id("cookbooks"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const sourceCookbook = await ctx.db.get(args.sourceCookbookId)
    if (!sourceCookbook) throw new Error("Cookbook not found")

    // Get source cookbook owner name
    const sourceUser = await ctx.db.get(sourceCookbook.userId)
    const ownerName = sourceUser?.name || sourceUser?.email || "Unknown"

    // Create new cookbook
    const newCookbookId = await ctx.db.insert("cookbooks", {
      name: args.newName,
      description: sourceCookbook.description,
      userId,
      isPublic: false,
      copiedFrom: {
        cookbookId: args.sourceCookbookId,
        ownerName,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Copy all recipes
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_cookbook", (q) => q.eq("cookbookId", args.sourceCookbookId))
      .collect()

    for (const recipe of recipes) {
      await ctx.db.insert("recipes", {
        cookbookId: newCookbookId,
        userId,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        imageUrl: recipe.imageUrl,
        originalUrl: recipe.originalUrl,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    return newCookbookId
  },
})
