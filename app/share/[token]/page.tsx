"use client"

import { use, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Authenticated, Unauthenticated } from "convex/react"

export default function ShareTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const shareData = useQuery(api.shares.getByToken, { token })
  const incrementShareLink = useMutation(api.shares.useShareLink)
  const copyCookbook = useMutation(api.cookbooks.copy)
  const router = useRouter()
  const [newName, setNewName] = useState("")
  const [isCopying, setIsCopying] = useState(false)
  const [error, setError] = useState("")

  const handleCopy = async () => {
    if (!shareData || !newName.trim()) return

    setIsCopying(true)
    setError("")

    try {
      await incrementShareLink({ token })

      const newCookbookId = await copyCookbook({
        sourceCookbookId: shareData.cookbook._id,
        newName: newName.trim(),
      })

      router.push(`/cookbooks/${newCookbookId}`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to copy cookbook")
      }
    } finally {
      setIsCopying(false)
    }
  }

  if (shareData === undefined || shareData === null) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        {shareData === undefined ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <Card className="max-w-md">
            <CardHeader>
              <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
              <CardTitle className="text-2xl font-serif text-center">Invalid or Expired Link</CardTitle>
              <CardDescription className="text-center">
                This share link is no longer valid. It may have expired or reached its usage limit.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link href="/">Go to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <ChefHat className="w-10 h-10 text-primary" strokeWidth={1.5} />
              <h1 className="text-4xl font-serif font-bold text-primary">Family Cookbook</h1>
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-3xl font-serif">{shareData.cookbook.name}</CardTitle>
              <CardDescription className="text-base">
                {shareData.ownerName} has shared their cookbook with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shareData.cookbook.description && (
                <p className="text-muted-foreground leading-relaxed mb-4">{shareData.cookbook.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Copy this cookbook to your account to access all recipes</span>
              </div>
            </CardContent>
          </Card>

          <Authenticated>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Copy to Your Account</CardTitle>
                <CardDescription>Choose a name for your copy of this cookbook</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cookbook-name">Cookbook Name</Label>
                  <Input
                    id="cookbook-name"
                    placeholder={shareData.cookbook.name}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This cookbook will be marked as "From {shareData.ownerName}'s cookbook"
                  </p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button onClick={handleCopy} disabled={isCopying || !newName.trim()} className="flex-1">
                  {isCopying ? "Copying..." : "Copy Cookbook"}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/cookbooks">Go to My Cookbooks</Link>
                </Button>
              </CardFooter>
            </Card>
          </Authenticated>

          <Unauthenticated>
            <Card>
              <CardHeader>
                <Users className="w-12 h-12 text-primary mx-auto mb-4" strokeWidth={1.5} />
                <CardTitle className="text-2xl font-serif text-center">Sign In Required</CardTitle>
                <CardDescription className="text-center text-base">
                  Create an account or sign in to copy this cookbook
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/sign-up">Create Account</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </CardFooter>
            </Card>
          </Unauthenticated>
        </div>
      </div>
    </div>
  )
}
