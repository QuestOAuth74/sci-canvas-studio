"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mail, MapPin, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

function Footerdemo() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <img 
                  src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODM2MjgxLCJleHAiOjIwNzYxOTYyODF9.LDw-xwHK6WmdeLwiG_BwtT0jX3N6fjdOvZmoUcI4FP0"
                  alt="BioSketch Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className="text-lg font-semibold font-display text-foreground">BioSketch</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Professional scientific illustration software trusted by researchers worldwide. Create publication-ready figures with ease.
            </p>
            
            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Stay updated</p>
              <form className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-9 text-sm"
                />
                <Button type="submit" size="sm" className="h-9 px-3">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Product</h3>
            <nav className="space-y-3">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/community" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Community Gallery
              </Link>
              <Link to="/blog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Blog & Tutorials
              </Link>
              <Link to="/testimonials" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Testimonials
              </Link>
              <Link to="/release-notes" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Release Notes
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Support</h3>
            <nav className="space-y-3">
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/share" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Share BioSketch
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>2136 Ford Parkway #5111</p>
                  <p>Saint Paul, MN 55116</p>
                  <p>United States</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a 
                  href="mailto:support@biosketch.art" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  support@biosketch.art
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BioSketch. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }