import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PromptLympics. All rights reserved.
          </p>
          <Link href="mailto:promptlympics@gmail.com">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </footer>
  );
}
