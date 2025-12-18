"use client"

import { use } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChefHat, ArrowLeft, Clock, Users, ExternalLink, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ cookbookId: string; recipeId: string }>
}) {
  const { cookbookId, recipeId } = use(params)
  const recipe = useQuery(api.recipes.get, { id: recipeId as Id<"recipes"> })
  const removeRecipe = useMutation(api.recipes.remove)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      await removeRecipe({ id: recipeId as Id<"recipes"> })
      router.push(`/cookbooks/${cookbookId}`)
    } catch (error) {
      console.error("Failed to delete recipe:", error)
    }
  }

  if (recipe === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (recipe === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-serif font-bold text-primary mb-2">Recipe Not Found</h2>
            <p className="text-muted-foreground mb-6">This recipe doesn't exist or you don't have access to it.</p>
            <Button asChild>
              <Link href={`/cookbooks/${cookbookId}`}>Back to Cookbook</Link>
            </Button>
          </CardContent>
        </Card>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild size="sm">
              <Link href={`/cookbooks/${cookbookId}/recipes/${recipeId}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your recipe.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" asChild size="sm">
              <Link href={`/cookbooks/${cookbookId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Recipe Header */}
        <div className="mb-12">
          {recipe.imageUrl && (
            <div className="aspect-[21/9] relative overflow-hidden rounded-lg mb-8 shadow-lg">
              <img
                src={recipe.imageUrl || "/placeholder.svg"}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4 text-balance leading-tight">
              {recipe.title}
            </h1>

            {recipe.description && (
              <p className="text-xl text-muted-foreground leading-relaxed mb-6 text-pretty">{recipe.description}</p>
            )}

            {/* Recipe Meta */}
            <div className="flex flex-wrap gap-6 text-sm">
              {recipe.prepTime && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" strokeWidth={1.5} />
                  <div>
                    <div className="font-medium text-foreground">Prep Time</div>
                    <div>{recipe.prepTime}</div>
                  </div>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" strokeWidth={1.5} />
                  <div>
                    <div className="font-medium text-foreground">Cook Time</div>
                    <div>{recipe.cookTime}</div>
                  </div>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" strokeWidth={1.5} />
                  <div>
                    <div className="font-medium text-foreground">Servings</div>
                    <div>{recipe.servings}</div>
                  </div>
                </div>
              )}
            </div>

            {recipe.originalUrl && (
              <div className="mt-6">
                <a
                  href={recipe.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View original recipe
                </a>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-12" />

        {/* Recipe Content */}
        <div className="grid lg:grid-cols-[1fr,2fr] gap-12">
          {/* Ingredients */}
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-6">Ingredients</h2>
            <Card className="bg-secondary/50">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex gap-3 leading-relaxed">
                      <span className="text-primary font-medium shrink-0">•</span>
                      <span>
                        {ingredient.amount && <span className="font-medium">{ingredient.amount} </span>}
                        {ingredient.item}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-6">Instructions</h2>
            <ol className="space-y-6">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0">
                    {index + 1}
                  </span>
                  <p className="leading-relaxed pt-1 text-pretty">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
