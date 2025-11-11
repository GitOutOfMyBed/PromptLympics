import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Trophy, Users, Zap, Target } from "lucide-react";
import { Navbar } from "@/app/_components/navbar";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Compete to be the Best Prompt Engineer or Crowdsource the Perfect
          Prompt
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join the best community of Prompt Engineers. PromptLympics is a
          competition platform where you can showcase your skills or bid for the
          perfect prompt. Compete for prizes, post challenges, and discover the
          best prompt engineering solutions.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/competitions">
            <Button size="lg" variant="outline">
              Browse Competitions
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>1. Post a Challenge</CardTitle>
                <CardDescription>
                  Define your prompt requirements, upload test cases, and set a
                  prize pool
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>2. Compete</CardTitle>
                <CardDescription>
                  Prompt engineers submit their solutions and compete on the
                  leaderboard
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>3. Win Prizes</CardTitle>
                <CardDescription>
                  Top performers earn prizes and you get the perfect prompt for
                  your use case
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why PromptLympics?
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4">
            <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Faster Development</h3>
              <p className="text-muted-foreground">
                Leverage the crowd to develop high-quality prompts faster than
                manual iteration
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Target className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Better Results</h3>
              <p className="text-muted-foreground">
                Get diverse perspectives and creative solutions from expert
                prompt engineers
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Trophy className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Competitive Pricing</h3>
              <p className="text-muted-foreground">
                Set your own prize pool and only pay for results that meet your
                requirements
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Growing Community</h3>
              <p className="text-muted-foreground">
                Join a community of AI enthusiasts and prompt engineering
                experts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join OptoPrompt today and discover the power of crowdsourced prompt
            engineering
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 PromptLympics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
