import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommunityFiltersProps {
  sortBy: 'recent' | 'popular' | 'cloned' | 'liked';
  onSortChange: (value: 'recent' | 'popular' | 'cloned' | 'liked') => void;
}

export function CommunityFilters({ sortBy, onSortChange }: CommunityFiltersProps) {
  const filters = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'liked', label: 'Most Liked' },
    { value: 'popular', label: 'Most Viewed' },
    { value: 'cloned', label: 'Most Used' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onSortChange(filter.value as any)}
          className={`paper-tab ${
            sortBy === filter.value ? 'paper-tab-active' : ''
          } whitespace-nowrap px-4 py-2 text-sm font-source-serif transition-all`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
