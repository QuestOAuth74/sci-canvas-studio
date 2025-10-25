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
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={author.avatar_url} alt={author.full_name || 'Author'} />
          <AvatarFallback>
            {author.full_name?.charAt(0).toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-lg">{author.full_name || 'Anonymous'}</p>
          <p className="text-sm text-muted-foreground">Author</p>
        </div>
      </CardContent>
    </Card>
  );
};
