import { useState, useEffect } from 'react';
import { Search, Upload, Trash2, MoreVertical, FolderOpen, Share2, Users } from 'lucide-react';
import { useUserAssets } from '@/hooks/useUserAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AssetUploadDialog } from './AssetUploadDialog';

interface UserAssetsLibraryProps {
  onAssetSelect: (assetId: string, svgContent: string) => void;
}

export function UserAssetsLibrary({ onAssetSelect }: UserAssetsLibraryProps) {
  const { 
    assets, 
    sharedAssets,
    loading, 
    deleteAsset, 
    updateAsset, 
    fetchAssets, 
    fetchSharedAssets,
    shareAsset,
    unshareAsset,
    downloadAssetContent, 
    getAssetUrl 
  } = useUserAssets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [fileType, setFileType] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'my-assets' | 'community'>('my-assets');

  // Get the current asset list based on view mode
  const currentAssets = viewMode === 'my-assets' ? assets : sharedAssets;

  // Filter assets
  const filteredAssets = currentAssets.filter(asset => {
    const matchesSearch = search === '' || 
      asset.original_name.toLowerCase().includes(search.toLowerCase()) ||
      asset.file_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = category === 'all' || asset.category === category;
    const matchesType = fileType === 'all' || asset.file_type === fileType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // Only show categories and file types that exist in the current view
  const categories = ['all', ...Array.from(new Set(currentAssets.map(a => a.category)))];
  const fileTypes = ['all', ...Array.from(new Set(currentAssets.map(a => a.file_type)))];

  const handleAssetClick = async (asset: any) => {
    const content = await downloadAssetContent(asset);
    if (content) {
      onAssetSelect(asset.id, content);
    }
  };

  const handleDelete = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset(assetId);
    }
  };

  const handleShare = async (assetId: string, isShared: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isShared) {
      await unshareAsset(assetId);
    } else {
      await shareAsset(assetId);
    }
  };

  useEffect(() => {
    if (viewMode === 'community') {
      fetchSharedAssets();
    }
    // Reset filters when switching views to avoid showing "no results" for categories that don't exist in that view
    setCategory('all');
    setFileType('all');
    setSearch('');
  }, [viewMode]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">My Assets</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === 'my-assets' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setViewMode('my-assets')}
          >
            <FolderOpen className="h-3 w-3 mr-1" />
            My Files
          </Button>
          <Button
            variant={viewMode === 'community' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setViewMode('community')}
          >
            <Users className="h-3 w-3 mr-1" />
            Community
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {fileTypes.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  {type.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search || category !== 'all' || fileType !== 'all'
                  ? 'No assets found'
                  : 'No assets yet'}
              </p>
              {!search && category === 'all' && fileType === 'all' && viewMode === 'my-assets' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload your first asset
                </Button>
              )}
              {viewMode === 'community' && currentAssets.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  No assets have been shared by the community yet
                </p>
              )}
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleAssetClick(asset)}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {asset.file_type === 'svg' ? (
                    <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                      <path d="M9 9h6v6H9z" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <div className="text-xs font-mono text-muted-foreground">
                      {asset.file_type.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{asset.original_name}</p>
                    {viewMode === 'my-assets' && asset.is_shared && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary">
                        <Share2 className="h-3 w-3" />
                        Shared
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(asset.file_size)}</span>
                    <span>•</span>
                    <span className="truncate">{asset.category}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {viewMode === 'my-assets' && (
                      <DropdownMenuItem
                        onClick={(e) => handleShare(asset.id, asset.is_shared, e)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {asset.is_shared ? 'Unshare' : 'Share with community'}
                      </DropdownMenuItem>
                    )}
                    {viewMode === 'my-assets' && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDelete(asset.id, e)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <AssetUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={() => fetchAssets()}
      />
    </div>
  );
}
