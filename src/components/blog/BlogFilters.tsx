import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export const BlogFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced auto-search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() !== (searchParams.get('search') || '')) {
        setIsSearching(true);
        if (searchQuery.trim()) {
          searchParams.set('search', searchQuery.trim());
        } else {
          searchParams.delete('search');
        }
        setSearchParams(searchParams);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchParams.set('search', searchQuery.trim());
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground doodle-sketch" />
        <Input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-9 pr-10 h-10 border-2 border-[hsl(var(--pencil-gray))] bg-[#f9f6f0] focus:border-[hsl(var(--ink-blue))]"
        />
        {searchQuery && !isSearching && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
