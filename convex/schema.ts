import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

const schema = defineSchema({
  ...authTables,

  cookbooks: defineTable({
    name: v.string(),
    userId: v.id("users"),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    copiedFrom: v.optional(
      v.object({
        cookbookId: v.id("cookbooks"),
        ownerName: v.string(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  recipes: defineTable({
    cookbookId: v.id("cookbooks"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    ingredients: v.array(
      v.object({
        item: v.string(),
        amount: v.optional(v.string()),
      }),
    ),
    instructions: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    originalUrl: v.optional(v.string()),
    prepTime: v.optional(v.string()),
    cookTime: v.optional(v.string()),
    servings: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_cookbook", ["cookbookId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  cookbookShares: defineTable({
    cookbookId: v.id("cookbooks"),
    shareToken: v.string(),
    createdBy: v.id("users"),
    expiresAt: v.optional(v.number()),
    usageCount: v.number(),
    maxUsages: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["shareToken"])
    .index("by_cookbook", ["cookbookId"]),
})

export default schema
