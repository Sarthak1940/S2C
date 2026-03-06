import { Code2, Laptop, Wand2, Zap } from "lucide-react";

const features = [
  {
    icon: <Wand2 className="size-10 text-purple-500" />,
    title: "AI-Powered Generation",
    description:
      "Upload a sketch or screenshot, and our advanced AI will instantly generate clean, production-ready code.",
  },
  {
    icon: <Code2 className="size-10 text-blue-500" />,
    title: "Clean React Code",
    description:
      "Get high-quality, semantic React components styled with Tailwind CSS. No spaghetti code, just what you need.",
  },
  {
    icon: <Laptop className="size-10 text-green-500" />,
    title: "Responsive by Default",
    description:
      "Every generated design is fully responsive and optimized for all devices, from mobile phones to large desktops.",
  },
  {
    icon: <Zap className="size-10 text-yellow-500" />,
    title: "Lightning Fast Iteration",
    description:
      "Make changes in real-time. Describe what you want to tweak, and watch the code update instantly.",
  },
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="container mx-auto py-24 px-4 md:px-6">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Features that <span className="text-purple-500">Empower</span> You
        </h2>
        <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Everything you need to go from idea to production in minutes, not days.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:gap-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-8 transition-colors hover:bg-white/10"
          >
            <div className="rounded-lg bg-black/50 p-3 ring-1 ring-white/10">
              {feature.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
