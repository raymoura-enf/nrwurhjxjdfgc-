import { MessageSquare, Network } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="font-semibold">Notes App</div>
          <div className="flex gap-4">
            <Link href="/">
              <a className={`flex items-center gap-2 hover:text-primary ${
                location === "/" ? "text-primary" : "text-muted-foreground"
              }`}>
                <MessageSquare className="h-4 w-4" />
                <span>Feed</span>
              </a>
            </Link>
            <Link href="/graph">
              <a className={`flex items-center gap-2 hover:text-primary ${
                location === "/graph" ? "text-primary" : "text-muted-foreground"
              }`}>
                <Network className="h-4 w-4" />
                <span>Graph</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
