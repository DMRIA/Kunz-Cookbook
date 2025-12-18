import { v } from "convex/values"
import { mutation, query, action } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { api } from "./_generated/api"

export const create = mutation({
  args: {
    cookbookId: v.id("cookbooks"),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    // Verify cookbook ownership
    const cookbook = await ctx.db.get(args.cookbookId)
    if (!cookbook || cookbook.userId !== userId) {
      throw new Error("Not authorized")
    }

    const recipeId = await ctx.db.insert("recipes", {
      cookbookId: args.cookbookId,
      userId,
      title: args.title,
      description: args.description,
      ingredients: args.ingredients,
      instructions: args.instructions,
      imageUrl: args.imageUrl,
      originalUrl: args.originalUrl,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return recipeId
  },
})

export const update = mutation({
  args: {
    id: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ingredients: v.optional(
      v.array(
        v.object({
          item: v.string(),
          amount: v.optional(v.string()),
        }),
      ),
    ),
    instructions: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    prepTime: v.optional(v.string()),
    cookTime: v.optional(v.string()),
    servings: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const recipe = await ctx.db.get(args.id)
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not authorized")
    }

    const { id, ...patch } = args
    await ctx.db.patch(id, {
      ...patch,
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const recipe = await ctx.db.get(args.id)
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not authorized")
    }

    await ctx.db.delete(args.id)
  },
})

export const list = query({
  args: { cookbookId: v.id("cookbooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)

    // Verify access to cookbook
    const cookbook = await ctx.db.get(args.cookbookId)
    if (!cookbook) return []
    if (cookbook.userId !== userId && !cookbook.isPublic) {
      return []
    }

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_cookbook", (q) => q.eq("cookbookId", args.cookbookId))
      .order("desc")
      .collect()

    return recipes
  },
})

export const get = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id)
    if (!recipe) return null

    const userId = await getAuthUserId(ctx)
    const cookbook = await ctx.db.get(recipe.cookbookId)

    // Verify access
    if (!cookbook || (cookbook.userId !== userId && !cookbook.isPublic)) {
      return null
    }

    return recipe
  },
})

export const extractFromUrl = action({
  args: {
    url: v.string(),
    cookbookId: v.id("cookbooks"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured")
    }

    try {
      // Fetch the webpage content first
      const pageResponse = await fetch(args.url)
      const pageText = await pageResponse.text()

      // Call Gemini API to extract recipe data
      // Call Gemini API to extract recipe data
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Extract recipe information from the following webpage content. Return a JSON object with these exact fields:
- title: string
- description: string (optional)
- ingredients: array of objects with "item" (string) and "amount" (string, optional)
- instructions: array of strings (each step as a separate string)
- prepTime: string (optional, e.g., "15 mins")
- cookTime: string (optional, e.g., "30 mins")
- servings: string (optional, e.g., "4-6")
- imageUrl: string (optional, extract if available)

Webpage content:
${pageText.slice(0, 10000)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        },
      )

      const data = await response.json()
      const recipeData = JSON.parse(data.candidates[0].content.parts[0].text)

      // If no image was found, generate a placeholder
      if (!recipeData.imageUrl) {
        recipeData.imageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(recipeData.title)}`
      }

      // Create recipe
      const recipeId = await ctx.runMutation(api.recipes.create, {
        cookbookId: args.cookbookId,
        ...recipeData,
        originalUrl: args.url,
      })

      return recipeId
    } catch (error) {
      console.error("Failed to extract recipe:", error)
      throw new Error("Failed to extract recipe from URL")
    }
  },
})

export const extractFromImage = action({
  args: {
    imageDataUrl: v.string(),
    cookbookId: v.id("cookbooks"),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured")
    }

    try {
      // Extract base64 data from data URL
      const base64Data = args.imageDataUrl.split(",")[1]

      // Call Gemini Vision API to extract recipe from image
      // Call Gemini API to extract recipe data
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Extract recipe information from this image. Return a JSON object with these exact fields:
- title: string
- description: string (optional)
- ingredients: array of objects with "item" (string) and "amount" (string, optional)
- instructions: array of strings (each step as a separate string)
- prepTime: string (optional, e.g., "15 mins")
- cookTime: string (optional, e.g., "30 mins")
- servings: string (optional, e.g., "4-6")`,
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        },
      )

      const data = await response.json()
      const recipeData = JSON.parse(data.candidates[0].content.parts[0].text)

      // Generate image for the recipe
      const imageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(recipeData.title)}`

      const recipeId = await ctx.runMutation(api.recipes.create, {
        cookbookId: args.cookbookId,
        ...recipeData,
        imageUrl,
      })

      return recipeId
    } catch (error) {
      console.error("Failed to extract recipe from image:", error)
      throw new Error("Failed to extract recipe from image")
    }
  },
})
