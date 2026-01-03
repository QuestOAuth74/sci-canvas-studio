import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react"
import { Link } from "react-router-dom"

function StackedCircularFooter() {
  return (
    <footer className="pb-6 pt-16 lg:pb-8 lg:pt-24 bg-background">
      <div className="px-4 lg:px-8">
        <div className="flex flex-col items-center rounded-xl bg-accent py-12 md:py-16 lg:rounded-[2rem]">
          <div className="flex items-center gap-2">
            <Icons.logo className="h-7 w-auto fill-primary" />
            <span className="text-xl font-semibold text-foreground">BioSketch</span>
          </div>

          <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/community" className="hover:text-foreground transition-colors">Community</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/testimonials" className="hover:text-foreground transition-colors">Testimonials</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>

          <div className="mt-6 flex items-center gap-4">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </a>
          </div>

          <div className="mt-8 w-full max-w-sm px-4">
            <form className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              <div className="flex-1">
                <Label htmlFor="footer-email" className="sr-only">Email</Label>
                <Input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your email"
                  className="rounded-b-none sm:rounded-l-md sm:rounded-r-none border-r-0 sm:border-r-0"
                />
              </div>
              <Button type="submit" className="rounded-t-none sm:rounded-l-none sm:rounded-r-md">
                Subscribe
              </Button>
            </form>
          </div>

          <div className="mt-8 w-full border-t border-border pt-6">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} BioSketch. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { StackedCircularFooter }
