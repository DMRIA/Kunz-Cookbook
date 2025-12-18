"use client"

import type React from "react"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChefHat, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditRecipePage({ params }: { params: Promise<{ id: string; recipeId: string }> }) {
  const { id, recipeId } = use(params)
  const router = useRouter()

  const recipe = useQuery(api.recipes.get, { id: recipeId as Id<"recipes"> })
  const updateRecipe = useMutation(api.recipes.update)

  const [isProcessing, setIsProcessing] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ingredients, setIngredients] = useState<{ item: string; amount: string }[]>([{ item: "", amount: "" }])
  const [instructions, setInstructions] = useState<string[]>([""])
  const [imageUrl, setImageUrl] = useState("")
  const [prepTime, setPrepTime] = useState("")
  const [cookTime, setCookTime] = useState("")
  const [servings, setServings] = useState("")

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title)
      setDescription(recipe.description || "")
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ item: "", amount: "" }])
      setInstructions(recipe.instructions.length > 0 ? recipe.instructions : [""])
      setImageUrl(recipe.imageUrl || "")
      setPrepTime(recipe.prepTime || "")
      setCookTime(recipe.cookTime || "")
      setServings(recipe.servings || "")
    }
  }, [recipe])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const filteredIngredients = ingredients.filter((ing) => ing.item.trim() !== "")
      const filteredInstructions = instructions.filter((inst) => inst.trim() !== "")

      await updateRecipe({
        id: recipeId as Id<"recipes">,
        title,
        description: description || undefined,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        imageUrl: imageUrl || undefined,
        prepTime: prepTime || undefined,
        cookTime: cookTime || undefined,
        servings: servings || undefined,
      })

      router.push(`/cookbooks/${id}/recipes/${recipeId}`)
    } catch (error) {
      console.error("Failed to update recipe:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { item: "", amount: "" }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: "item" | "amount", value: string) => {
    const updated = [...ingredients]
    updated[index][field] = value
    setIngredients(updated)
  }

  const addInstruction = () => {
    setInstructions([...instructions, ""])
  }

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index))
  }

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions]
    updated[index] = value
    setInstructions(updated)
  }

  if (recipe === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/cookbooks" className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl font-serif font-bold text-primary">Family Cookbook</h1>
          </Link>
          <Button variant="ghost" asChild>
            <Link href={`/cookbooks/${id}/recipes/${recipeId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipe
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Edit Recipe</h2>
          <p className="text-muted-foreground text-lg">Update your recipe details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Recipe Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Grandma's Chocolate Chip Cookies"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of the recipe"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Prep Time</Label>
                  <Input
                    id="prepTime"
                    placeholder="e.g., 15 mins"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cookTime">Cook Time</Label>
                  <Input
                    id="cookTime"
                    placeholder="e.g., 30 mins"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    placeholder="e.g., 4-6"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Ingredients</CardTitle>
              <CardDescription>Add all ingredients with their measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Ingredient"
                      value={ingredient.item}
                      onChange={(e) => updateIngredient(index, "item", e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      placeholder="Amount"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                    />
                  </div>
                  {ingredients.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addIngredient}>
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Instructions</CardTitle>
              <CardDescription>Step-by-step directions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex items-center justify-center w-8 h-10 text-sm font-medium text-muted-foreground">
                    {index + 1}.
                  </div>
                  <Textarea
                    placeholder={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  {instructions.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeInstruction(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addInstruction}>
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating Recipe...
                </>
              ) : (
                "Update Recipe"
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link href={`/cookbooks/${id}/recipes/${recipeId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
