"use client"

import type React from "react"

import { use, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChefHat, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AddRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const method = searchParams.get("method") || "manual"
  const router = useRouter()

  const createRecipe = useMutation(api.recipes.create)
  const extractFromUrlAction = useAction(api.recipes.extractFromUrl)
  const extractFromImageAction = useAction(api.recipes.extractFromImage)

  const [isProcessing, setIsProcessing] = useState(false)
  const [extractionError, setExtractionError] = useState("")

  // Form state
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ingredients, setIngredients] = useState<{ item: string; amount: string }[]>([{ item: "", amount: "" }])
  const [instructions, setInstructions] = useState<string[]>([""])
  const [imageUrl, setImageUrl] = useState("")
  const [prepTime, setPrepTime] = useState("")
  const [cookTime, setCookTime] = useState("")
  const [servings, setServings] = useState("")

  const handleExtractFromUrl = async () => {
    if (!url.trim()) return
    setIsProcessing(true)
    setExtractionError("")

    try {
      const recipeId = await extractFromUrlAction({ url, cookbookId: id as Id<"cookbooks"> })
      router.push(`/cookbooks/${id}/recipes/${recipeId}`)
    } catch (error) {
      setExtractionError("Failed to extract recipe. Please try again or enter manually.")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setExtractionError("")

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Data = reader.result as string
        try {
          const recipeId = await extractFromImageAction({
            imageDataUrl: base64Data,
            cookbookId: id as Id<"cookbooks">,
          })
          router.push(`/cookbooks/${id}/recipes/${recipeId}`)
        } catch (error) {
          setExtractionError("Failed to extract recipe from image. Please try again.")
          console.error(error)
        } finally {
          setIsProcessing(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setExtractionError("Failed to read image file.")
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const filteredIngredients = ingredients.filter((ing) => ing.item.trim() !== "")
      const filteredInstructions = instructions.filter((inst) => inst.trim() !== "")

      await createRecipe({
        cookbookId: id as Id<"cookbooks">,
        title,
        description: description || undefined,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        imageUrl: imageUrl || undefined,
        originalUrl: method === "url" ? url : undefined,
        prepTime: prepTime || undefined,
        cookTime: cookTime || undefined,
        servings: servings || undefined,
      })

      router.push(`/cookbooks/${id}`)
    } catch (error) {
      console.error("Failed to create recipe:", error)
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
            <Link href={`/cookbooks/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cookbook
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Add Recipe</h2>
          <p className="text-muted-foreground text-lg">
            {method === "url"
              ? "Extract recipe from a URL"
              : method === "image"
                ? "Extract recipe from a photo"
                : "Enter recipe details manually"}
          </p>
        </div>

        {/* URL Extraction Section */}
        {method === "url" && !title && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-serif">Enter Recipe URL</CardTitle>
              <CardDescription>We'll extract the recipe details automatically using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Recipe URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/recipe"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              {extractionError && <p className="text-sm text-destructive">{extractionError}</p>}
              <Button onClick={handleExtractFromUrl} disabled={isProcessing || !url.trim()}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Recipe...
                  </>
                ) : (
                  "Extract Recipe"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Image Extraction Section */}
        {method === "image" && !title && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-serif">Upload Recipe Photo</CardTitle>
              <CardDescription>Take a photo of a recipe card or book and we'll digitize it for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">Recipe Image</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isProcessing}
                />
              </div>
              {extractionError && <p className="text-sm text-destructive">{extractionError}</p>}
              {isProcessing && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing image with AI...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recipe Form */}
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
                  Saving Recipe...
                </>
              ) : (
                "Save Recipe"
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link href={`/cookbooks/${id}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
