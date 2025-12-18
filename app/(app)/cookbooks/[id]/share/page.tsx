"use client"

import { use, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, ArrowLeft, Copy, Check, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ShareCookbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const cookbook = useQuery(api.cookbooks.get, { id: id as Id<"cookbooks"> })
  const shares = useQuery(api.shares.listForCookbook, { cookbookId: id as Id<"cookbooks"> })
  const createShareLink = useMutation(api.shares.createShareLink)
  const { toast } = useToast()

  const [isCreating, setIsCreating] = useState(false)
  const [maxUsages, setMaxUsages] = useState("")
  const [expiresInDays, setExpiresInDays] = useState("")
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const handleCreateShare = async () => {
    setIsCreating(true)
    try {
      const result = await createShareLink({
        cookbookId: id as Id<"cookbooks">,
        maxUsages: maxUsages ? Number.parseInt(maxUsages) : undefined,
        expiresInDays: expiresInDays ? Number.parseInt(expiresInDays) : undefined,
      })

      toast({
        title: "Share link created",
        description: "Your cookbook share link has been generated",
      })

      setMaxUsages("")
      setExpiresInDays("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    })
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (cookbook === undefined || shares === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (cookbook === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Cookbook Not Found</CardTitle>
            <CardDescription>This cookbook doesn't exist or you don't have access to it.</CardDescription>
          </CardHeader>
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
            <Link href={`/cookbooks/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cookbook
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Share Cookbook</h2>
          <p className="text-lg text-muted-foreground">Create invite links to share "{cookbook.name}" with family</p>
        </div>

        <div className="space-y-8">
          {/* Create New Share Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Create Share Link</CardTitle>
              <CardDescription>Generate a new invite link for this cookbook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsages">Maximum Uses (Optional)</Label>
                  <Input
                    id="maxUsages"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={maxUsages}
                    onChange={(e) => setMaxUsages(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">How many times this link can be used</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                  <Input
                    id="expiresInDays"
                    type="number"
                    min="1"
                    placeholder="Never"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">How long until this link expires</p>
                </div>
              </div>
              <Button onClick={handleCreateShare} disabled={isCreating}>
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? "Creating..." : "Create Share Link"}
              </Button>
            </CardContent>
          </Card>

          {/* Active Share Links */}
          <div>
            <h3 className="text-2xl font-serif font-bold text-foreground mb-4">Active Share Links</h3>
            {shares.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No share links created yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {shares.map((share) => {
                  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${share.shareToken}`
                  const isExpired = share.expiresAt && share.expiresAt < Date.now()
                  const isMaxedOut = share.maxUsages && share.usageCount >= share.maxUsages

                  return (
                    <Card key={share._id} className={isExpired || isMaxedOut ? "opacity-50" : ""}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">{url}</code>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyShareLink(share.shareToken)}
                                disabled={isExpired || isMaxedOut}
                              >
                                {copiedToken === share.shareToken ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>
                                Used: {share.usageCount}
                                {share.maxUsages ? ` / ${share.maxUsages}` : " times"}
                              </span>
                              {share.expiresAt && (
                                <span>
                                  {isExpired ? "Expired" : `Expires: ${new Date(share.expiresAt).toLocaleDateString()}`}
                                </span>
                              )}
                              {!share.expiresAt && !share.maxUsages && <span className="text-green-600">Active</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info Card */}
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle className="text-xl font-serif">How Sharing Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p>
                When someone uses your share link, they'll be able to copy your cookbook to their own account. The
                copied cookbook will include all recipes and will note it came from your cookbook.
              </p>
              <p className="text-muted-foreground">Example: "From Mom's Cookbook"</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
