import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Mail, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export const ShareButtons = ({ url, title }: ShareButtonsProps) => {
  const { toast } = useToast();

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Post link copied to clipboard",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold">Share this post</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href={shareLinks.email}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
      </div>
    </div>
  );
};
