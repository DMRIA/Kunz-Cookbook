"use client"

import type React from "react"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, BookOpen, ChefHat, LogOut } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthActions } from "@convex-dev/auth/react"

export default function CookbooksPage() {
  const cookbooks = useQuery(api.cookbooks.list)
  const createCookbook = useMutation(api.cookbooks.create)
  const { signOut } = useAuthActions()
  const router = useRouter()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const id = await createCookbook({ name, description })
      setIsDialogOpen(false)
      setName("")
      setDescription("")
      router.push(`/cookbooks/${id}`)
    } catch (error) {
      console.error("Failed to create cookbook:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
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
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-serif font-bold text-foreground mb-2">My Cookbooks</h2>
            <p className="text-muted-foreground text-lg">Organize your recipes into collections</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                New Cookbook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif">Create New Cookbook</DialogTitle>
                <DialogDescription>Give your cookbook a name and optional description</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Cookbook Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Family Favorites, Holiday Recipes"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What kind of recipes will this cookbook contain?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Cookbook"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {cookbooks === undefined ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cookbooks.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
              <CardTitle className="text-2xl font-serif">No Cookbooks Yet</CardTitle>
              <CardDescription className="text-base">
                Create your first cookbook to start organizing your recipes
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cookbooks.map((cookbook) => (
              <Link key={cookbook._id} href={`/cookbooks/${cookbook._id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif group-hover:text-primary transition-colors">
                      {cookbook.name}
                    </CardTitle>
                    {cookbook.description && (
                      <CardDescription className="text-base">{cookbook.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>View recipes</span>
                    </div>
                  </CardContent>
                  {cookbook.copiedFrom && (
                    <CardFooter className="text-sm text-muted-foreground italic">
                      From {cookbook.copiedFrom.ownerName}'s cookbook
                    </CardFooter>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
