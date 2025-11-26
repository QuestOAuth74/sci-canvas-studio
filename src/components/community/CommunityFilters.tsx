import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommunityFiltersProps {
  sortBy: 'recent' | 'popular' | 'cloned' | 'liked';
  onSortChange: (value: 'recent' | 'popular' | 'cloned' | 'liked') => void;
}

export function CommunityFilters({ sortBy, onSortChange }: CommunityFiltersProps) {
  return (
    <Select value={sortBy} onValueChange={onSortChange}>
      <SelectTrigger className="w-[180px] h-12 border-2 border-[hsl(var(--pencil-gray))] bg-white/80 hover:bg-[hsl(var(--highlighter-yellow))]/20 font-source-serif transition-colors">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent className="border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))] paper-shadow">
        <SelectItem value="recent" className="font-source-serif hover:bg-[hsl(var(--highlighter-yellow))]/30">Most Recent</SelectItem>
        <SelectItem value="liked" className="font-source-serif hover:bg-[hsl(var(--highlighter-yellow))]/30">Most Liked</SelectItem>
        <SelectItem value="popular" className="font-source-serif hover:bg-[hsl(var(--highlighter-yellow))]/30">Most Viewed</SelectItem>
        <SelectItem value="cloned" className="font-source-serif hover:bg-[hsl(var(--highlighter-yellow))]/30">Most Used</SelectItem>
      </SelectContent>
    </Select>
  );
}
