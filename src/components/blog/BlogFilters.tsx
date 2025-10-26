import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { useState } from "react";

export const BlogFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 border-[2px] border-foreground rounded-xl">
          <Filter className="w-4 h-4 text-foreground" />
          <span className="font-bold text-foreground text-sm">Filter Posts</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-10 border-[3px] border-foreground h-12 text-base font-medium focus:ring-4 focus:ring-primary/20"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
              onClick={clearSearch}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <Button 
          onClick={handleSearch}
          className="glossy-button h-12 px-6 text-base font-bold"
        >
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};
