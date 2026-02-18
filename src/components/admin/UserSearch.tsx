import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, User, Mail, MapPin, BookOpen, Clock, FolderOpen, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { z } from 'zod';

const searchSchema = z.string().trim().min(2, 'Search must be at least 2 characters').max(100);

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  field_of_study: string | null;
  created_at: string | null;
  last_login_at: string | null;
}

interface UserWithProjects extends UserProfile {
  projectCount: number;
  projects: { id: string; name: string }[];
}

export function UserSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserWithProjects[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const handleSearch = async () => {
    const parsed = searchSchema.safeParse(query);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    const searchTerm = parsed.data;
    setIsSearching(true);
    setHasSearched(true);
    setExpandedUser(null);

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, country, field_of_study, created_at, last_login_at')
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch project counts for each user
      const usersWithProjects: UserWithProjects[] = await Promise.all(
        (profiles || []).map(async (user) => {
          const { data: projects, error: projError } = await supabase
            .from('canvas_projects')
            .select('id, name')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          return {
            ...user,
            projectCount: projError ? 0 : (projects?.length || 0),
            projects: projError ? [] : (projects || []),
          };
        })
      );

      setResults(usersWithProjects);
    } catch (error: any) {
      console.error('User search error:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by email or name..."
          className="max-w-md"
        />
        <Button onClick={handleSearch} disabled={isSearching || query.trim().length < 2}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search
        </Button>
      </div>

      {hasSearched && (
        <p className="text-sm text-muted-foreground">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </p>
      )}

      {results.length > 0 && (
        <div className="grid gap-3">
          {results.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{user.full_name || 'No name'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-muted-foreground">{user.email || 'No email'}</span>
                    </div>
                    {user.country && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-muted-foreground">{user.country}</span>
                      </div>
                    )}
                    {user.field_of_study && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-muted-foreground">{user.field_of_study}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right flex-shrink-0 space-y-1">
                    <div>Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</div>
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      Last login: {formatLastLogin(user.last_login_at)}
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <FolderOpen className="h-3 w-3" />
                      {user.projectCount} project{user.projectCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Projects section */}
                {user.projectCount > 0 && (
                  <div className="border-t pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      className="text-xs gap-1"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      {expandedUser === user.id ? 'Hide' : 'View'} Projects ({user.projectCount})
                    </Button>

                    {expandedUser === user.id && (
                      <div className="mt-2 grid gap-1.5 pl-4">
                        {user.projects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-accent/50 group"
                          >
                            <span className="truncate text-muted-foreground">{project.name || 'Untitled'}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                              onClick={() => navigate(`/canvas?project=${project.id}`)}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
