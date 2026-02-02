import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dna,
  Search,
  Download,
  Copy,
  Check,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Pause,
  Play,
  Maximize2,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Declare global $3Dmol
declare global {
  interface Window {
    $3Dmol: any;
  }
}

interface ProteinStructureRendererProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertStructure: (imageDataUrl: string, proteinName?: string) => void;
}

interface ProteinPreset {
  pdbId: string;
  name: string;
  description: string;
  category: string;
}

// Common protein presets with PDB IDs
const proteinPresets: ProteinPreset[] = [
  // Transport
  { pdbId: '1HHO', name: 'Hemoglobin', description: 'Oxygen transport protein', category: 'Transport' },
  { pdbId: '1MBO', name: 'Myoglobin', description: 'Muscle oxygen storage', category: 'Transport' },
  { pdbId: '4HHB', name: 'Deoxyhemoglobin', description: 'Human deoxyhemoglobin', category: 'Transport' },
  { pdbId: '1GZX', name: 'Hemoglobin (Oxy)', description: 'Human oxyhemoglobin', category: 'Transport' },

  // Enzymes
  { pdbId: '1HEW', name: 'Lysozyme', description: 'Antibacterial enzyme', category: 'Enzymes' },
  { pdbId: '1LYZ', name: 'Hen Lysozyme', description: 'Hen egg-white lysozyme', category: 'Enzymes' },
  { pdbId: '2CGA', name: 'Chymotrypsin', description: 'Digestive enzyme', category: 'Enzymes' },
  { pdbId: '1TRN', name: 'Trypsin', description: 'Serine protease', category: 'Enzymes' },
  { pdbId: '1LDM', name: 'Lactate Dehydrogenase', description: 'Metabolic enzyme', category: 'Enzymes' },
  { pdbId: '1AKE', name: 'Adenylate Kinase', description: 'ATP metabolism', category: 'Enzymes' },

  // DNA/RNA
  { pdbId: '1BNA', name: 'B-DNA', description: 'Double helix DNA structure', category: 'Nucleic Acids' },
  { pdbId: '1EHZ', name: 'tRNA-Phe', description: 'Phenylalanine tRNA', category: 'Nucleic Acids' },

  // Signaling
  { pdbId: '1INS', name: 'Insulin', description: 'Metabolic hormone', category: 'Signaling' },
  { pdbId: '1GCN', name: 'Glucagon', description: 'Blood sugar hormone', category: 'Signaling' },
  { pdbId: '1CRN', name: 'Crambin', description: 'Small plant protein', category: 'Signaling' },

  // Structural
  { pdbId: '1CGD', name: 'Collagen', description: 'Structural protein', category: 'Structural' },
  { pdbId: '3G37', name: 'Actin', description: 'Cytoskeleton protein', category: 'Structural' },

  // Immune
  { pdbId: '1IGT', name: 'Immunoglobulin G', description: 'Antibody structure', category: 'Immune' },
  { pdbId: '1HZH', name: 'IgG1 Antibody', description: 'Human antibody', category: 'Immune' },

  // Membrane
  { pdbId: '1BL8', name: 'Potassium Channel', description: 'Ion channel', category: 'Membrane' },
  { pdbId: '7AHL', name: 'Alpha-Hemolysin', description: 'Pore-forming toxin', category: 'Membrane' },

  // Viral
  { pdbId: '6VXX', name: 'SARS-CoV-2 Spike', description: 'COVID-19 spike protein', category: 'Viral' },
  { pdbId: '1HXB', name: 'HIV Protease', description: 'Viral enzyme', category: 'Viral' },

  // Chaperones
  { pdbId: '1AON', name: 'GroEL', description: 'Protein folding chaperone', category: 'Chaperones' },

  // Classic
  { pdbId: '1UBQ', name: 'Ubiquitin', description: 'Protein degradation tag', category: 'Classic' },
  { pdbId: '1GFL', name: 'GFP', description: 'Green fluorescent protein', category: 'Classic' },
  { pdbId: '2DHB', name: 'Hemoglobin (Horse)', description: 'Equine hemoglobin', category: 'Classic' },
];

type RepresentationStyle = 'cartoon' | 'stick' | 'sphere' | 'line' | 'cross';
type ColorScheme = 'spectrum' | 'chain' | 'ss' | 'residue' | 'element' | 'b';

export const ProteinStructureRenderer = ({
  open,
  onOpenChange,
  onInsertStructure,
}: ProteinStructureRendererProps) => {
  const { toast } = useToast();
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  const [pdbId, setPdbId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentProteinName, setCurrentProteinName] = useState<string>('');
  const [lib3DmolLoaded, setLib3DmolLoaded] = useState(false);
  const [proteinLoaded, setProteinLoaded] = useState(false);

  // Visualization settings
  const [representation, setRepresentation] = useState<RepresentationStyle>('cartoon');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('spectrum');
  const [isSpinning, setIsSpinning] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [showSurface, setShowSurface] = useState(false);
  const [surfaceOpacity, setSurfaceOpacity] = useState(0.7);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(proteinPresets.map(p => p.category)))];

  // Filter presets
  const filteredPresets = proteinPresets.filter(preset => {
    const matchesSearch = searchQuery === '' ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.pdbId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Load 3Dmol.js script
  useEffect(() => {
    if (!open) return;

    // Check if already loaded
    if (window.$3Dmol) {
      setLib3DmolLoaded(true);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.3/3Dmol-min.js';
    script.async = true;
    script.onload = () => {
      console.log('3Dmol.js loaded successfully');
      setLib3DmolLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load 3Dmol.js');
      setLoadError('Failed to load 3D viewer library');
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount - it can be reused
    };
  }, [open]);

  // Initialize viewer when library is loaded and dialog is open
  useEffect(() => {
    if (!open || !lib3DmolLoaded || !viewerContainerRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        // Clear any existing content
        if (viewerContainerRef.current) {
          viewerContainerRef.current.innerHTML = '';
        }

        // Create the viewer
        // For transparent background, use 0x000000 with alpha 0
        const config: any = {
          antialias: true,
        };

        if (backgroundColor === 'transparent') {
          config.backgroundColor = 'white';  // Initial color, will be transparent in capture
          config.backgroundAlpha = 0;
        } else {
          config.backgroundColor = backgroundColor;
          config.backgroundAlpha = 1;
        }

        viewerRef.current = window.$3Dmol.createViewer(viewerContainerRef.current, config);
        console.log('3Dmol viewer created with background:', backgroundColor);
      } catch (err) {
        console.error('Error creating viewer:', err);
        setLoadError('Failed to initialize 3D viewer');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (viewerRef.current) {
        try {
          viewerRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
        viewerRef.current = null;
      }
    };
  }, [open, lib3DmolLoaded, backgroundColor]);

  // Apply style to the model
  const applyStyle = useCallback(() => {
    if (!viewerRef.current || !proteinLoaded) return;

    try {
      // Clear all styles first
      viewerRef.current.setStyle({}, {});

      // Build style object
      const styleSpec: any = {};

      // Set representation
      switch (representation) {
        case 'cartoon':
          styleSpec.cartoon = { color: colorScheme };
          break;
        case 'stick':
          styleSpec.stick = { colorscheme: colorScheme === 'spectrum' ? 'default' : colorScheme };
          break;
        case 'sphere':
          styleSpec.sphere = { colorscheme: colorScheme === 'spectrum' ? 'default' : colorScheme, scale: 0.3 };
          break;
        case 'line':
          styleSpec.line = { colorscheme: colorScheme === 'spectrum' ? 'default' : colorScheme };
          break;
        case 'cross':
          styleSpec.cross = { colorscheme: colorScheme === 'spectrum' ? 'default' : colorScheme };
          break;
      }

      viewerRef.current.setStyle({}, styleSpec);

      // Add surface if enabled
      if (showSurface) {
        viewerRef.current.addSurface(window.$3Dmol.SurfaceType.VDW, {
          opacity: surfaceOpacity,
          color: 'white',
        });
      }

      viewerRef.current.render();
    } catch (err) {
      console.error('Error applying style:', err);
    }
  }, [representation, colorScheme, showSurface, surfaceOpacity, proteinLoaded]);

  // Fetch and load PDB structure
  const loadProtein = useCallback(async (id: string) => {
    if (!id || id.length < 4) {
      setLoadError('Please enter a valid 4-character PDB ID');
      return;
    }

    if (!viewerRef.current || !window.$3Dmol) {
      setLoadError('3D viewer not ready. Please wait and try again.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setProteinLoaded(false);

    try {
      // Clear previous model
      viewerRef.current.removeAllModels();
      viewerRef.current.removeAllSurfaces();

      // Use 3Dmol's download function which handles PDB fetching
      await new Promise<void>((resolve, reject) => {
        window.$3Dmol.download(
          `pdb:${id.toUpperCase()}`,
          viewerRef.current,
          { multimodel: true, frames: true },
          (model: any) => {
            if (model) {
              console.log('PDB loaded successfully:', id);
              resolve();
            } else {
              reject(new Error(`Failed to load PDB: ${id}`));
            }
          }
        );

        // Timeout fallback
        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, 30000);
      });

      // Apply initial styling
      viewerRef.current.setStyle({}, { cartoon: { color: colorScheme } });
      viewerRef.current.zoomTo();
      viewerRef.current.render();

      setProteinLoaded(true);
      setLoadError(null);

    } catch (err: any) {
      console.error('Error loading PDB:', err);
      setLoadError(err.message || `Failed to load PDB: ${id}`);
      setProteinLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [colorScheme]);

  // Apply style when settings change
  useEffect(() => {
    applyStyle();
  }, [applyStyle]);

  // Handle spin
  useEffect(() => {
    if (!viewerRef.current || !proteinLoaded) return;

    try {
      if (isSpinning) {
        viewerRef.current.spin('y', 1);
      } else {
        viewerRef.current.spin(false);
      }
    } catch (err) {
      console.error('Error setting spin:', err);
    }
  }, [isSpinning, proteinLoaded]);

  // Handle preset selection
  const handlePresetSelect = (preset: ProteinPreset) => {
    setPdbId(preset.pdbId);
    setCurrentProteinName(preset.name);
    loadProtein(preset.pdbId);
  };

  // Handle manual input
  const handlePdbChange = (value: string) => {
    setPdbId(value.toUpperCase());
    setCurrentProteinName('');
  };

  // Copy PDB ID
  const handleCopyPdbId = async () => {
    if (!pdbId) return;
    await navigator.clipboard.writeText(pdbId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied', description: 'PDB ID copied to clipboard' });
  };

  // Capture screenshot
  const captureImage = (): string | null => {
    if (!viewerRef.current || !proteinLoaded) return null;

    try {
      // Stop spinning for clean capture
      const wasSpinning = isSpinning;
      if (wasSpinning) viewerRef.current.spin(false);

      // Get image data - use transparent background if selected
      // pngURI accepts optional width, height, and noClear parameters
      const imageData = viewerRef.current.pngURI();

      // Resume spinning
      if (wasSpinning) viewerRef.current.spin('y', 1);

      // If transparent background is selected, the viewer already has backgroundAlpha: 0
      // The PNG should preserve transparency
      return imageData;
    } catch (err) {
      console.error('Error capturing image:', err);
      return null;
    }
  };

  // Download PNG
  const handleDownload = () => {
    const imageData = captureImage();
    if (!imageData) {
      toast({ title: 'Error', description: 'Could not capture image', variant: 'destructive' });
      return;
    }

    const link = document.createElement('a');
    link.download = `${pdbId || 'protein'}_${representation}.png`;
    link.href = imageData;
    link.click();
    toast({ title: 'Downloaded', description: 'Protein structure saved as PNG' });
  };

  // Insert to canvas
  const handleInsert = () => {
    const imageData = captureImage();
    if (!imageData) {
      toast({
        title: 'Error',
        description: 'Could not capture image. Please load a protein first.',
        variant: 'destructive'
      });
      return;
    }

    onInsertStructure(imageData, currentProteinName || pdbId);
    onOpenChange(false);
    toast({
      title: 'Inserted',
      description: `${currentProteinName || pdbId} added to canvas`,
    });
  };

  // Reset view
  const handleResetView = () => {
    if (viewerRef.current && proteinLoaded) {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    }
  };

  // Reset all
  const handleReset = () => {
    setPdbId('');
    setCurrentProteinName('');
    setLoadError(null);
    setProteinLoaded(false);
    if (viewerRef.current) {
      viewerRef.current.removeAllModels();
      viewerRef.current.removeAllSurfaces();
      viewerRef.current.render();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Dna className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Protein Structure Viewer</DialogTitle>
                <DialogDescription>
                  Load and visualize 3D protein structures from the Protein Data Bank (PDB)
                </DialogDescription>
              </div>
            </div>
            {currentProteinName && (
              <Badge variant="secondary" className="text-sm">
                {currentProteinName} ({pdbId})
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Presets */}
          <div className="w-72 border-r flex flex-col bg-muted/20">
            <div className="p-4 space-y-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search proteins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md transition-colors',
                      'hover:bg-muted',
                      pdbId === preset.pdbId && 'bg-blue-500/10 text-blue-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {preset.pdbId}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Input Row */}
            <div className="p-4 border-b space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    PDB ID (4-character code)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter PDB ID (e.g., 1CRN, 4HHB)"
                      value={pdbId}
                      onChange={(e) => handlePdbChange(e.target.value)}
                      className="font-mono text-sm uppercase"
                      maxLength={4}
                    />
                    <Button
                      onClick={() => loadProtein(pdbId)}
                      disabled={!pdbId || pdbId.length < 4 || isLoading || !lib3DmolLoaded}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Load'
                      )}
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyPdbId}
                            disabled={!pdbId}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy PDB ID</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(`https://www.rcsb.org/structure/${pdbId}`, '_blank')}
                            disabled={!pdbId}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View on RCSB PDB</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="outline" size="icon" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Visualization Controls */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Representation */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Style:</Label>
                  <Select value={representation} onValueChange={(v) => setRepresentation(v as RepresentationStyle)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                      <SelectItem value="stick">Sticks</SelectItem>
                      <SelectItem value="sphere">Spheres</SelectItem>
                      <SelectItem value="line">Lines</SelectItem>
                      <SelectItem value="cross">Cross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Color Scheme */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Color:</Label>
                  <Select value={colorScheme} onValueChange={(v) => setColorScheme(v as ColorScheme)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spectrum">Spectrum</SelectItem>
                      <SelectItem value="chain">By Chain</SelectItem>
                      <SelectItem value="ss">Secondary Structure</SelectItem>
                      <SelectItem value="residue">Residue Type</SelectItem>
                      <SelectItem value="element">Element</SelectItem>
                      <SelectItem value="b">B-Factor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Background */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Background:</Label>
                  <Tabs value={backgroundColor} onValueChange={setBackgroundColor}>
                    <TabsList className="h-7">
                      <TabsTrigger value="transparent" className="text-xs px-2 h-5">Transparent</TabsTrigger>
                      <TabsTrigger value="white" className="text-xs px-2 h-5">White</TabsTrigger>
                      <TabsTrigger value="black" className="text-xs px-2 h-5">Black</TabsTrigger>
                      <TabsTrigger value="gray" className="text-xs px-2 h-5">Gray</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Surface Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="show-surface"
                          checked={showSurface}
                          onCheckedChange={setShowSurface}
                          className="scale-75"
                        />
                        <Label htmlFor="show-surface" className="text-xs cursor-pointer">
                          Surface
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Show molecular surface</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {showSurface && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Opacity:</Label>
                    <Slider
                      value={[surfaceOpacity]}
                      onValueChange={([v]) => setSurfaceOpacity(v)}
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="w-20"
                    />
                  </div>
                )}

                <div className="h-4 w-px bg-border" />

                {/* Spin */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isSpinning ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIsSpinning(!isSpinning)}
                        disabled={!proteinLoaded}
                        className="h-7 px-2"
                      >
                        {isSpinning ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                        <span className="text-xs">{isSpinning ? 'Stop' : 'Spin'}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle rotation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetView}
                        disabled={!proteinLoaded}
                        className="h-7 px-2"
                      >
                        <Maximize2 className="h-3 w-3 mr-1" />
                        <span className="text-xs">Reset View</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset camera view</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* 3D Viewer */}
            <div className={cn(
              "flex-1 relative",
              backgroundColor === 'transparent'
                ? "bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px]"
                : "bg-slate-100"
            )}>
              {!lib3DmolLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-sm text-muted-foreground">Loading 3D viewer...</p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-sm text-muted-foreground">Loading protein structure...</p>
                  </div>
                </div>
              )}

              {loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10 bg-background/90">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-destructive font-medium">{loadError}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check the PDB ID and try again
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open('https://www.rcsb.org', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Browse RCSB PDB
                  </Button>
                </div>
              )}

              {/* The 3Dmol viewer container - MUST have position relative and explicit dimensions */}
              <div
                ref={viewerContainerRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  minHeight: '400px',
                }}
              />

              {!pdbId && !loadError && !isLoading && lib3DmolLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
                  <Dna className="h-16 w-16 mb-4 opacity-20" />
                  <p>Select a protein from the library</p>
                  <p className="text-sm mt-1">or enter a PDB ID</p>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  Drag to rotate | Scroll to zoom | Shift+Drag to pan
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!proteinLoaded}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Screenshot
                </Button>
                <Button
                  onClick={handleInsert}
                  disabled={!proteinLoaded}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Insert to Canvas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProteinStructureRenderer;
