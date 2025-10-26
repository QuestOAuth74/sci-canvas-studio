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
    <div className="flex gap-2 items-center mb-8 relative">
      <div className="absolute -top-6 left-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider rotate-[-1deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-border">
        <Sparkles className="w-3 h-3 inline mr-1" />
        Smart Search
      </div>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search posts by title, content, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-10 h-12 border-4 border-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 font-medium"
        />
        {isSearching && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
            Searching...
          </div>
        )}
        {searchQuery && !isSearching && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <Button
        onClick={handleSearch}
        className="h-12 px-6 border-4 border-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-bold uppercase tracking-wider bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground backdrop-blur-sm"
      >
        <Search className="w-5 h-5 mr-2" />
        Search
      </Button>
    </div>
  );
};
