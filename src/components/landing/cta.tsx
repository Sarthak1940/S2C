import Link from "next/link";
import { Button } from "@/components/ui/button";

export const LandingCTA = () => {
  return (
    <section className="border-t border-white/10 bg-black/50">
      <div className="container mx-auto flex flex-col items-center gap-6 py-24 px-4 text-center md:px-6 md:py-32">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Ready to Speed Up Your Workflow?
        </h2>
        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
          Join thousands of developers using S2C to build beautiful interfaces faster than ever before.
        </p>
        <div className="flex flex-col gap-4 min-[400px]:flex-row">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/auth/sign-up">Get Started for Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-white/10 bg-white/5 hover:bg-white/10">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
