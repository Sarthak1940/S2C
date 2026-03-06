import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export const LandingHero = () => {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-24 md:px-6 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
      
      <div className="container flex flex-col items-center gap-8 text-center">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white backdrop-blur-xl">
          <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-2 animate-pulse" />
          <span className="text-muted-foreground">New:</span> 
          <span className="ml-1 font-medium">Auto-layout Generation</span>
          <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
        </div>

        <h1 className="max-w-4xl bg-gradient-to-b from-white to-white/40 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
          Transform Your Designs into{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Production Code
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Stop manually coding UIs. S2C uses advanced AI to convert your sketches and mockups into clean, responsive, and interactive code instantly.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
            <Link href="/auth/sign-up">
              Start Building Free
              <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-8 text-base border-white/10 bg-white/5 hover:bg-white/10">
            <Link href="#demo">View Demo</Link>
          </Button>
        </div>

        {/* Hero Visual Placeholder */}
        <div className="mt-16 w-full max-w-5xl rounded-xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm lg:rounded-2xl">
          <div className="aspect-video rounded-lg bg-black/50 border border-white/5 flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10" />
            <div className="text-muted-foreground flex flex-col items-center gap-2">
                 <p>Interactive Demo / Preview Image Holder</p>
                 <span className="text-xs text-muted-foreground/50">Replace with actual app screenshot or video</span>
            </div>
            
            {/* Abstract Shapes for visual interest */}
            <div className="absolute -top-20 -right-20 size-64 bg-purple-500/20 blur-[100px] rounded-full" />
             <div className="absolute -bottom-20 -left-20 size-64 bg-blue-500/20 blur-[100px] rounded-full" />

          </div>
        </div>
      </div>
    </section>
  );
};
