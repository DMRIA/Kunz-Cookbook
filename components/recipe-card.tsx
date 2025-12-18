"use client"

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"

interface RecipeCardProps {
  id: string
  cookbookId: string
  title: string
  description?: string
  imageUrl?: string
  prepTime?: string
  cookTime?: string
  servings?: string
}

export function RecipeCard({ id, cookbookId, title, description, imageUrl, prepTime, cookTime }: RecipeCardProps) {
  return (
    <Link href={`/cookbooks/${cookbookId}/recipes/${id}`}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-0 shadow-md">
        {imageUrl && (
          <div className="aspect-[4/3] relative overflow-hidden bg-muted">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-serif group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="line-clamp-2 text-base leading-relaxed">{description}</CardDescription>
          )}
        </CardHeader>
        {(prepTime || cookTime) && (
          <CardFooter className="pt-0 flex gap-4 text-sm text-muted-foreground">
            {prepTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                <span>{prepTime}</span>
              </div>
            )}
            {cookTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                <span>{cookTime}</span>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </Link>
  )
}
