import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface Author {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

interface AuthorCardProps {
  author: Author;
}

export const AuthorCard = ({ author }: AuthorCardProps) => {
  return (
    <Card className="sticky-note bg-[#b4e4ff] border-[hsl(var(--pencil-gray))] relative" style={{ transform: 'rotate(-1deg)' }}>
      {/* Paper clip decoration */}
      <div className="absolute -top-3 -right-2 w-8 h-12 border-2 border-[hsl(var(--pencil-gray))] rounded-full bg-[hsl(var(--pencil-gray))]/20" />
      
      <CardContent className="flex items-center gap-4 pt-6">
        <Avatar className="h-16 w-16 border-2 border-[hsl(var(--ink-blue))]">
          <AvatarImage src={author.avatar_url} alt={author.full_name || 'Author'} />
          <AvatarFallback className="bg-[hsl(var(--highlighter-yellow))] text-[hsl(var(--ink-blue))]">
            {author.full_name?.charAt(0).toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs text-muted-foreground font-['Caveat']">Written by</p>
          <p className="font-semibold text-lg text-[hsl(var(--ink-blue))] font-['Caveat']">{author.full_name || 'Anonymous'}</p>
          <p className="text-sm text-muted-foreground">Author</p>
        </div>
      </CardContent>
    </Card>
  );
};
