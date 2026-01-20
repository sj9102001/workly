import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";

export function CtaSection() {
  return (
    <section className="bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to take control of your projects?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-primary-foreground/80">
            Deploy Workly on your own infrastructure in minutes. Free forever, no limits, full data ownership.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/docs">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base font-medium"
              >
                View installation docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-primary-foreground/20 bg-transparent px-8 text-base font-medium text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Github className="mr-2 h-4 w-4" />
                Star on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
