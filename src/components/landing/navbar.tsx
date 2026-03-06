import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export const LandingNavbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link className="flex items-center gap-2 font-bold text-xl tracking-tighter" href="/">
          <div className="size-8 rounded-full bg-white text-black flex items-center justify-center">
            <div className="size-3 rounded-full bg-black" />
          </div>
          S2C
        </Link>
        <div className="flex items-center gap-6">
          <Link
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="#testimonials"
          >
           Testimonials
          </Link>
           <Link
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="#pricing"
          >
           Pricing
          </Link>
        </div>
        <div className="flex items-center gap-4">
             <Link href="/auth/sign-in" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Sign In
          </Link>
          <Button asChild size="sm" className="rounded-full px-6">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};
