import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommunityFiltersProps {
  sortBy: 'recent' | 'popular' | 'cloned' | 'liked';
  onSortChange: (value: 'recent' | 'popular' | 'cloned' | 'liked') => void;
}

export function CommunityFilters({ sortBy, onSortChange }: CommunityFiltersProps) {
  return (
    <Select value={sortBy} onValueChange={onSortChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Most Recent</SelectItem>
        <SelectItem value="liked">Most Liked</SelectItem>
        <SelectItem value="popular">Most Viewed</SelectItem>
        <SelectItem value="cloned">Most Used</SelectItem>
      </SelectContent>
    </Select>
  );
}
