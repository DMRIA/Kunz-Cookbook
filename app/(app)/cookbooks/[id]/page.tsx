"use client"

import type React from "react"

import { use } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, ArrowLeft, Plus, Share2, Settings, Link2, ImageIcon, FileText, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { RecipeCard } from "@/components/recipe-card"

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

export default function CookbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const cookbook = useQuery(api.cookbooks.get, { id: id as Id<"cookbooks"> })
  const recipes = useQuery(api.recipes.list, { cookbookId: id as Id<"cookbooks"> })
  const updateCookbook = useMutation(api.cookbooks.update)
  const removeCookbook = useMutation(api.cookbooks.remove)
  const router = useRouter()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRecipes = useMemo(() => {
    if (!recipes) return []
    if (!searchQuery.trim()) return recipes

    const query = searchQuery.toLowerCase()
    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) || (recipe.description && recipe.description.toLowerCase().includes(query)),
    )
  }, [recipes, searchQuery])

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cookbook) return

    try {
      await updateCookbook({
        id: cookbook._id,
        name: editName,
        description: editDescription,
      })
      setIsEditOpen(false)
    } catch (error) {
      console.error("Failed to update cookbook:", error)
    }
  }

  const handleDeleteCookbook = async () => {
    if (!cookbook) return
    try {
      await removeCookbook({ id: cookbook._id })
      router.push("/cookbooks")
    } catch (error) {
      console.error("Failed to delete cookbook:", error)
    }
  }

  const openEditDialog = () => {
    if (cookbook) {
      setEditName(cookbook.name)
      setEditDescription(cookbook.description || "")
      setIsEditOpen(true)
    }
  }

  if (cookbook === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cookbook...</p>
        </div>
      </div>
    )
  }

  if (cookbook === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif font-bold text-primary">Family Cookbook</CardTitle>
            <CardDescription>This cookbook doesn't exist or you don't have access to it.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/cookbooks">Back to Cookbooks</Link>
            </Button>
          </CardFooter>
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
          <Button variant="ghost" asChild>
            <Link href="/cookbooks">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cookbooks
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Cookbook Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-5xl font-serif font-bold text-foreground mb-2">{cookbook.name}</h2>
              {cookbook.description && (
                <p className="text-xl text-muted-foreground leading-relaxed">{cookbook.description}</p>
              )}
              {cookbook.copiedFrom && (
                <p className="text-sm text-muted-foreground italic mt-2">
                  From {cookbook.copiedFrom.ownerName}'s cookbook
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openEditDialog}>
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/cookbooks/${id}/share`}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Add Recipe Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <Dialog open={isAddRecipeOpen} onOpenChange={setIsAddRecipeOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif">Add Recipe</DialogTitle>
                <DialogDescription>Choose how you'd like to add a recipe to your cookbook</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="url">
                    <Link2 className="w-4 h-4 mr-2" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Photo
                  </TabsTrigger>
                  <TabsTrigger value="manual">
                    <FileText className="w-4 h-4 mr-2" />
                    Manual
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-url">Recipe URL</Label>
                    <Input id="recipe-url" placeholder="https://example.com/recipe" />
                  </div>
                  <Button
                    onClick={() => {
                      setIsAddRecipeOpen(false)
                      router.push(`/cookbooks/${id}/add-recipe?method=url`)
                    }}
                  >
                    Extract Recipe
                  </Button>
                </TabsContent>
                <TabsContent value="image" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-image">Upload Recipe Photo</Label>
                    <Input id="recipe-image" type="file" accept="image/*" />
                  </div>
                  <Button
                    onClick={() => {
                      setIsAddRecipeOpen(false)
                      router.push(`/cookbooks/${id}/add-recipe?method=image`)
                    }}
                  >
                    Extract from Image
                  </Button>
                </TabsContent>
                <TabsContent value="manual" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">Enter recipe details manually</p>
                  <Button
                    onClick={() => {
                      setIsAddRecipeOpen(false)
                      router.push(`/cookbooks/${id}/add-recipe?method=manual`)
                    }}
                  >
                    Create Manually
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Recipes Grid */}
        {recipes === undefined ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center py-12">
              {searchQuery ? (
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
              ) : (
                <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
              )}
              <CardTitle className="text-2xl font-serif">
                {searchQuery ? "No matching recipes" : "No Recipes Yet"}
              </CardTitle>
              <CardDescription className="text-base">
                {searchQuery
                  ? "Try a different search term"
                  : "Add your first recipe to start building your cookbook"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                id={recipe._id}
                cookbookId={id}
                title={recipe.title}
                description={recipe.description}
                imageUrl={recipe.imageUrl}
                prepTime={recipe.prepTime}
                cookTime={recipe.cookTime}
                servings={recipe.servings}
              />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Edit Cookbook</DialogTitle>
              <DialogDescription>Update your cookbook's name and description</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Cookbook Name</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Cookbook
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{cookbook.name}" and all its recipes. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCookbook} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
