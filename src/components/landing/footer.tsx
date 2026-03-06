import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

export const LandingFooter = () => {
  return (
    <footer className="border-t border-white/10 bg-black py-12 md:py-16 lg:py-20">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 md:grid-cols-4 md:px-6">
        <div className="flex flex-col gap-4">
          <Link className="flex items-center gap-2 font-bold text-xl" href="/">
            <div className="size-8 rounded-full bg-white text-black flex items-center justify-center">
              <div className="size-3 rounded-full bg-black" />
            </div>
            S2C
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            The fastest way to go from design to code. Built for developers, by developers.
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Product</h3>
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="#changelog" className="text-sm text-muted-foreground hover:text-foreground">Changelog</Link>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Company</h3>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link>
          <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Legal</h3>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
        </div>
      </div>
      
      <div className="container mx-auto mt-12 flex flex-col items-center justify-between gap-4 px-4 border-t border-white/10 pt-8 md:flex-row md:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} S2C Inc. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground">
            <Twitter className="size-4" />
            <span className="sr-only">Twitter</span>
          </Link>
           <Link href="https://github.com" className="text-muted-foreground hover:text-foreground">
            <Github className="size-4" />
            <span className="sr-only">GitHub</span>
          </Link>
           <Link href="https://linkedin.com" className="text-muted-foreground hover:text-foreground">
            <Linkedin className="size-4" />
            <span className="sr-only">LinkedIn</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};
