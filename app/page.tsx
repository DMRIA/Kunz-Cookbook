import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChefHat, BookOpen, Users, Share2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ChefHat className="w-16 h-16 text-primary" strokeWidth={1.5} />
            <h1 className="text-5xl lg:text-7xl font-serif font-bold text-primary">Family Cookbook</h1>
          </div>

          <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            Preserve your family's culinary heritage. Create beautiful digital cookbooks and share treasured recipes
            with the people you love.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/sign-up">Start Your Cookbook</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 w-full mt-16">
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
              <BookOpen className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif font-semibold mb-2">Your Recipe Library</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organize recipes with beautiful cards. Add from URLs, photos, or write them manually.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
              <Share2 className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif font-semibold mb-2">Easy Sharing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Share cookbooks with family using invite links. Copy recipes with proper attribution.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
              <Users className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-serif font-semibold mb-2">Family Traditions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Keep track of where recipes came from. "From Mom's Cookbook" attribution built in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
