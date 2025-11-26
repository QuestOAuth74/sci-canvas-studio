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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const ITEMS_PER_PAGE = 10;

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

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
    setCurrentPage(1);
  }, [viewMode]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, fileType]);

  // Fetch public URLs for paginated assets
  useEffect(() => {
    const fetchUrls = async () => {
      const urls: Record<string, string> = {};
      for (const asset of paginatedAssets) {
        const url = await getAssetUrl(asset);
        if (url) {
          urls[asset.id] = url;
        }
      }
      setAssetUrls(urls);
    };
    
    if (paginatedAssets.length > 0) {
      fetchUrls();
    }
  }, [paginatedAssets, getAssetUrl]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--cream))]/95 backdrop-blur-sm notebook-sidebar ruled-lines">
      {/* Spiral binding decoration */}
      <div className="spiral-binding">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="spiral-hole" />
        ))}
      </div>
      
      <div className="p-4 pl-8 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="notebook-section-header">My Assets</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>

        <div className="flex gap-1 p-1 bg-[hsl(var(--cream))] rounded-lg border-2 border-[hsl(var(--pencil-gray))]">
          <button
            className={`flex-1 h-8 text-xs rounded-md transition-all flex items-center justify-center gap-1 font-source-serif ${
              viewMode === 'my-assets' 
                ? 'paper-tab-active' 
                : 'paper-tab'
            }`}
            onClick={() => setViewMode('my-assets')}
          >
            <FolderOpen className="h-3 w-3" />
            My Files
          </button>
          <button
            className={`flex-1 h-8 text-xs rounded-md transition-all flex items-center justify-center gap-1 font-source-serif ${
              viewMode === 'community' 
                ? 'paper-tab-active' 
                : 'paper-tab'
            }`}
            onClick={() => setViewMode('community')}
          >
            <Users className="h-3 w-3" />
            Community
          </button>
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
        <div className="p-4 pl-8">
          {loading ? (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
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
            <TooltipProvider>
              <div className="grid grid-cols-5 gap-2">
                {paginatedAssets.map((asset) => (
                  <Tooltip key={asset.id}>
                    <TooltipTrigger asChild>
                      <button
                        className="group relative aspect-square p-2 rounded-lg border-2 border-[hsl(var(--pencil-gray))]/20 bg-white hover:border-[hsl(var(--ink-blue))] hover:shadow-md transition-all"
                        onClick={() => handleAssetClick(asset)}
                      >
                        {assetUrls[asset.id] ? (
                          <img 
                            src={assetUrls[asset.id]} 
                            alt={asset.original_name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-xs font-mono text-muted-foreground">
                              {asset.file_type.toUpperCase()}
                            </div>
                          </div>
                        )}
                        
                        {/* Shared badge */}
                        {viewMode === 'my-assets' && asset.is_shared && (
                          <div className="absolute top-1 right-1 p-1 rounded bg-primary/90 text-white">
                            <Share2 className="h-3 w-3" />
                          </div>
                        )}
                        
                        {/* Action menu overlay */}
                        {viewMode === 'my-assets' && (
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => handleShare(asset.id, asset.is_shared, e)}
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  {asset.is_shared ? 'Unshare' : 'Share with community'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => handleDelete(asset.id, e)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs font-medium">{asset.original_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(asset.file_size)} • {asset.category}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}
        </div>
      </ScrollArea>

      {filteredAssets.length > ITEMS_PER_PAGE && (
        <div className="p-4 border-t space-y-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <PaginationEllipsis key={pageNum} />;
                }
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          <p className="text-xs text-center text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAssets.length)} of {filteredAssets.length}
          </p>
        </div>
      )}

      <AssetUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={() => fetchAssets()}
      />
    </div>
  );
}
