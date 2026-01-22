"use client";
import React from "react";
import { Link } from "react-router-dom";
import { NotepadTextDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

interface FooterProps {
  brandName?: string;
  brandDescription?: string;
  socialLinks?: SocialLink[];
  navLinks?: FooterLink[];
  creatorName?: string;
  creatorUrl?: string;
  brandIcon?: React.ReactNode;
  className?: string;
}

export const Footer = ({
  brandName = "YourBrand",
  brandDescription = "Your description here",
  socialLinks = [],
  navLinks = [],
  creatorName,
  creatorUrl,
  brandIcon,
  className,
}: FooterProps) => {
  return (
    <footer className={cn("relative w-full bg-background overflow-hidden", className)}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  {brandIcon || <NotepadTextDashed className="h-5 w-5" />}
                </div>
                <span className="text-xl font-semibold text-foreground">
                  {brandName}
                </span>
              </div>

              <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
                {brandDescription}
              </p>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4 mb-8">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110"
                  >
                    <span className="transition-transform duration-300 group-hover:scale-110">
                      {link.icon}
                    </span>
                    <span className="sr-only">{link.label}</span>
                  </a>
                ))}
              </div>
            )}

            {navLinks.length > 0 && (
              <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mb-12">
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 border-t border-border/50 pt-8 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              ©{new Date().getFullYear()} {brandName}. All rights reserved.
            </p>

            {creatorName && creatorUrl && (
              <p className="text-xs text-muted-foreground">
                <a
                  href={creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Crafted by {creatorName}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Large background text */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-24 select-none text-center text-[12vw] font-bold leading-none text-muted/10 sm:text-[10vw]"
          aria-hidden="true"
        >
          {brandName.toUpperCase()}
        </div>

        {/* Bottom logo */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-muted/80 to-muted/20 text-muted-foreground/50 shadow-lg backdrop-blur-sm sm:h-24 sm:w-24">
            {brandIcon || (
              <NotepadTextDashed className="h-8 w-8 sm:h-10 sm:w-10" />
            )}
          </div>
        </div>

        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Bottom shadow */}
        <div className="absolute -bottom-2 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-primary/5 blur-2xl" />
      </div>
    </footer>
  );
};
