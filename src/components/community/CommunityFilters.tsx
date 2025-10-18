import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommunityFiltersProps {
  sortBy: 'recent' | 'popular' | 'cloned';
  onSortChange: (value: 'recent' | 'popular' | 'cloned') => void;
}

export function CommunityFilters({ sortBy, onSortChange }: CommunityFiltersProps) {
  return (
    <Select value={sortBy} onValueChange={onSortChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Most Recent</SelectItem>
        <SelectItem value="popular">Most Popular</SelectItem>
        <SelectItem value="cloned">Most Used</SelectItem>
      </SelectContent>
    </Select>
  );
}
