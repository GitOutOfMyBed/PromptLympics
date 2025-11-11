import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Trophy, Users, Zap, Target, Sparkles, ArrowRight } from "lucide-react";
import { Navbar } from "@/app/_components/navbar";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)] -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1),transparent_50%)] -z-10" />

        <div className="container mx-auto px-4 py-24 md:py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 mb-8 hover-lift">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">The future of prompt engineering</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="gradient-text">Compete</span> to Build the{" "}
            <br className="hidden md:block" />
            Perfect Prompt
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join the premier platform for prompt engineering competitions. Showcase your skills,
            win prizes, and help build the next generation of AI applications.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl hover-lift">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/competitions">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl hover-lift">
                Browse Competitions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="card-hover border-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
              <CardHeader className="pb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">1. Post a Challenge</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Define your prompt requirements, upload test cases, and set a
                  prize pool
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <CardHeader className="pb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">2. Compete</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Prompt engineers submit their solutions and compete on the
                  leaderboard
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />
              <CardHeader className="pb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">3. Win Prizes</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Top performers earn prizes and you get the perfect prompt for
                  your use case
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why PromptLympics?
            </h2>
            <p className="text-xl text-gray-600">Everything you need to crowdsource perfect prompts</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <div className="flex gap-5 group">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-smooth">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Faster Development</h3>
                <p className="text-gray-600 leading-relaxed">
                  Leverage the crowd to develop high-quality prompts faster than
                  manual iteration
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-smooth">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Better Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get diverse perspectives and creative solutions from expert
                  prompt engineers
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-smooth">
                  <Trophy className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Competitive Pricing</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set your own prize pool and only pay for results that meet your
                  requirements
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-smooth">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Growing Community</h3>
                <p className="text-gray-600 leading-relaxed">
                  Join a community of AI enthusiasts and prompt engineering
                  experts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] -z-10" />

        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
            Join PromptLympics today and discover the power of crowdsourced prompt
            engineering
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-xl hover-lift shadow-xl">
              Create Your Account Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
