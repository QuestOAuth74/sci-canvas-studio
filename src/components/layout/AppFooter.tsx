import { Footer } from "@/components/ui/modem-animated-footer";
import {
  Twitter,
  Linkedin,
  Github,
  Mail,
  Microscope,
} from "lucide-react";

export const AppFooter = () => {
  const socialLinks = [
    {
      icon: <Twitter className="w-5 h-5" />,
      href: "https://twitter.com/biosketchart",
      label: "Twitter",
    },
    {
      icon: <Linkedin className="w-5 h-5" />,
      href: "https://linkedin.com/company/biosketch",
      label: "LinkedIn",
    },
    {
      icon: <Github className="w-5 h-5" />,
      href: "https://github.com/biosketch",
      label: "GitHub",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      href: "mailto:support@biosketch.art",
      label: "Email",
    },
  ];

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Community", href: "/community" },
    { label: "Blog", href: "/blog" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Contact", href: "/contact" },
    { label: "Terms", href: "/terms" },
  ];

  return (
    <Footer
      brandName="BioSketch"
      brandDescription="Create beautiful scientific illustrations with our free, intuitive canvas tool. Designed for researchers, educators, and science communicators."
      socialLinks={socialLinks}
      navLinks={navLinks}
      brandIcon={<Microscope className="h-5 w-5" />}
    />
  );
};
