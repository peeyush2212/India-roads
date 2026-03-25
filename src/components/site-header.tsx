import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight">
            India‑ROADS
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex">
            beta
          </Badge>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link href="/" className="rounded-md px-3 py-2 hover:bg-accent">
            Dashboard
          </Link>
          <Link href="/explorer" className="rounded-md px-3 py-2 hover:bg-accent">
            Explorer
          </Link>
          <Link href="/data-model" className="rounded-md px-3 py-2 hover:bg-accent">
            Data & Model
          </Link>
          <Link href="/premium" className="rounded-md px-3 py-2 hover:bg-accent">
            Premium
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
