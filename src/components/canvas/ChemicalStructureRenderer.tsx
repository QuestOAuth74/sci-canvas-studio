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
  FlaskConical,
  Search,
  Download,
  Copy,
  Check,
  Loader2,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChemicalStructureRendererProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertStructure: (svgDataUrl: string, moleculeName?: string) => void;
}

interface MoleculePreset {
  name: string;
  smiles: string;
  category: string;
  description?: string;
}

// Common molecule presets organized by category
const moleculePresets: MoleculePreset[] = [
  // Amino Acids
  { name: 'Glycine', smiles: 'NCC(=O)O', category: 'Amino Acids' },
  { name: 'Alanine', smiles: 'CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Valine', smiles: 'CC(C)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Leucine', smiles: 'CC(C)CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Isoleucine', smiles: 'CCC(C)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Phenylalanine', smiles: 'NC(Cc1ccccc1)C(=O)O', category: 'Amino Acids' },
  { name: 'Tryptophan', smiles: 'NC(Cc1c[nH]c2ccccc12)C(=O)O', category: 'Amino Acids' },
  { name: 'Serine', smiles: 'NC(CO)C(=O)O', category: 'Amino Acids' },
  { name: 'Threonine', smiles: 'CC(O)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Cysteine', smiles: 'NC(CS)C(=O)O', category: 'Amino Acids' },
  { name: 'Methionine', smiles: 'CSCCC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Tyrosine', smiles: 'NC(Cc1ccc(O)cc1)C(=O)O', category: 'Amino Acids' },
  { name: 'Asparagine', smiles: 'NC(CC(N)=O)C(=O)O', category: 'Amino Acids' },
  { name: 'Glutamine', smiles: 'NC(CCC(N)=O)C(=O)O', category: 'Amino Acids' },
  { name: 'Aspartic Acid', smiles: 'NC(CC(=O)O)C(=O)O', category: 'Amino Acids' },
  { name: 'Glutamic Acid', smiles: 'NC(CCC(=O)O)C(=O)O', category: 'Amino Acids' },
  { name: 'Lysine', smiles: 'NCCCCC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Arginine', smiles: 'NC(CCCNC(N)=N)C(=O)O', category: 'Amino Acids' },
  { name: 'Histidine', smiles: 'NC(Cc1cnc[nH]1)C(=O)O', category: 'Amino Acids' },
  { name: 'Proline', smiles: 'OC(=O)C1CCCN1', category: 'Amino Acids' },

  // Nucleotides & Bases
  { name: 'Adenine', smiles: 'Nc1ncnc2[nH]cnc12', category: 'Nucleotides' },
  { name: 'Guanine', smiles: 'Nc1nc2[nH]cnc2c(=O)[nH]1', category: 'Nucleotides' },
  { name: 'Cytosine', smiles: 'Nc1cc[nH]c(=O)n1', category: 'Nucleotides' },
  { name: 'Thymine', smiles: 'Cc1c[nH]c(=O)[nH]c1=O', category: 'Nucleotides' },
  { name: 'Uracil', smiles: 'O=c1cc[nH]c(=O)[nH]1', category: 'Nucleotides' },

  // Sugars
  { name: 'Glucose', smiles: 'OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O', category: 'Sugars' },
  { name: 'Fructose', smiles: 'OC[C@H]1O[C@](O)(CO)[C@@H](O)[C@@H]1O', category: 'Sugars' },
  { name: 'Ribose', smiles: 'OC[C@H]1OC(O)[C@H](O)[C@@H]1O', category: 'Sugars' },
  { name: 'Sucrose', smiles: 'OC[C@H]1O[C@@](CO)(O[C@H]2O[C@H](CO)[C@@H](O)[C@H](O)[C@H]2O)[C@@H](O)[C@@H]1O', category: 'Sugars' },

  // Cofactors & Vitamins
  { name: 'ATP', smiles: 'Nc1ncnc2c1ncn2[C@@H]1O[C@H](COP(O)(=O)OP(O)(=O)OP(O)(O)=O)[C@@H](O)[C@H]1O', category: 'Cofactors' },
  { name: 'Vitamin C', smiles: 'OC[C@H](O)[C@H]1OC(=O)C(O)=C1O', category: 'Cofactors' },

  // Lipids
  { name: 'Cholesterol', smiles: 'C[C@H](CCCC(C)C)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]1[C@H]2CC=C2C[C@@H](O)CC[C@]12C)C', category: 'Lipids' },
  { name: 'Palmitic Acid', smiles: 'CCCCCCCCCCCCCCCC(=O)O', category: 'Lipids' },
  { name: 'Oleic Acid', smiles: 'CCCCCCCCC=CCCCCCCCC(=O)O', category: 'Lipids' },

  // Common Drugs
  { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O', category: 'Drugs' },
  { name: 'Ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', category: 'Drugs' },
  { name: 'Caffeine', smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C', category: 'Drugs' },
  { name: 'Acetaminophen', smiles: 'CC(=O)Nc1ccc(O)cc1', category: 'Drugs' },
  { name: 'Penicillin G', smiles: 'CC1(C)S[C@@H]2[C@H](NC(=O)Cc3ccccc3)C(=O)N2[C@H]1C(=O)O', category: 'Drugs' },

  // Neurotransmitters
  { name: 'Dopamine', smiles: 'NCCc1ccc(O)c(O)c1', category: 'Neurotransmitters' },
  { name: 'Serotonin', smiles: 'NCCc1c[nH]c2ccc(O)cc12', category: 'Neurotransmitters' },
  { name: 'Acetylcholine', smiles: 'CC(=O)OCC[N+](C)(C)C', category: 'Neurotransmitters' },
  { name: 'GABA', smiles: 'NCCCC(=O)O', category: 'Neurotransmitters' },
  { name: 'Glutamate', smiles: 'NC(CCC(=O)O)C(=O)O', category: 'Neurotransmitters' },
  { name: 'Epinephrine', smiles: 'CNC[C@H](O)c1ccc(O)c(O)c1', category: 'Neurotransmitters' },

  // Simple Organic
  { name: 'Ethanol', smiles: 'CCO', category: 'Simple' },
  { name: 'Acetic Acid', smiles: 'CC(=O)O', category: 'Simple' },
  { name: 'Benzene', smiles: 'c1ccccc1', category: 'Simple' },
  { name: 'Methane', smiles: 'C', category: 'Simple' },
  { name: 'Water', smiles: 'O', category: 'Simple' },
  { name: 'Ammonia', smiles: 'N', category: 'Simple' },
  { name: 'Urea', smiles: 'NC(N)=O', category: 'Simple' },
  { name: 'Methanol', smiles: 'CO', category: 'Simple' },
  { name: 'Formaldehyde', smiles: 'C=O', category: 'Simple' },
  { name: 'Acetone', smiles: 'CC(=O)C', category: 'Simple' },
];

// Color themes for molecule rendering
const colorThemes = {
  default: {
    name: 'Default',
    C: '#222222',
    O: '#e74c3c',
    N: '#3498db',
    S: '#f1c40f',
    P: '#e67e22',
    F: '#2ecc71',
    Cl: '#2ecc71',
    Br: '#c0392b',
    I: '#9b59b6',
    H: '#666666',
    background: '#ffffff',
  },
  dark: {
    name: 'Dark Mode',
    C: '#e0e0e0',
    O: '#ff6b6b',
    N: '#4dabf7',
    S: '#ffd43b',
    P: '#ff922b',
    F: '#51cf66',
    Cl: '#51cf66',
    Br: '#ff6b6b',
    I: '#cc5de8',
    H: '#888888',
    background: '#1a1a2e',
  },
  publication: {
    name: 'Publication',
    C: '#000000',
    O: '#000000',
    N: '#000000',
    S: '#000000',
    P: '#000000',
    F: '#000000',
    Cl: '#000000',
    Br: '#000000',
    I: '#000000',
    H: '#000000',
    background: '#ffffff',
  },
  colorful: {
    name: 'Colorful',
    C: '#4a4a4a',
    O: '#ff4757',
    N: '#3742fa',
    S: '#ffa502',
    P: '#ff6348',
    F: '#2ed573',
    Cl: '#1e90ff',
    Br: '#a55eea',
    I: '#6c5ce7',
    H: '#95a5a6',
    background: '#ffffff',
  },
};

export const ChemicalStructureRenderer = ({
  open,
  onOpenChange,
  onInsertStructure,
}: ChemicalStructureRendererProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smilesDrawerRef = useRef<any>(null);

  const [smilesInput, setSmilesInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [colorTheme, setColorTheme] = useState<keyof typeof colorThemes>('default');
  const [scale, setScale] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentMoleculeName, setCurrentMoleculeName] = useState<string>('');
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(moleculePresets.map(m => m.category)))];

  // Filter presets based on search and category
  const filteredPresets = moleculePresets.filter(preset => {
    const matchesSearch = searchQuery === '' ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.smiles.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Load SmilesDrawer library dynamically
  useEffect(() => {
    const loadSmilesDrawer = async () => {
      try {
        const SmilesDrawer = await import('smiles-drawer');
        smilesDrawerRef.current = SmilesDrawer.default || SmilesDrawer;
        setIsLibraryLoaded(true);
        console.log('SmilesDrawer loaded successfully');
      } catch (error) {
        console.error('Failed to load SmilesDrawer:', error);
        setRenderError('Failed to load molecule rendering library');
      }
    };

    if (open && !isLibraryLoaded) {
      loadSmilesDrawer();
    }
  }, [open, isLibraryLoaded]);

  // Render SMILES to canvas
  const renderSmiles = useCallback((smiles: string) => {
    if (!smiles || typeof smiles !== 'string' || !smiles.trim()) {
      setRenderError(null);
      return;
    }

    if (!canvasRef.current) {
      console.error('Canvas ref not available');
      return;
    }

    if (!smilesDrawerRef.current) {
      console.error('SmilesDrawer not loaded yet');
      setRenderError('Molecule renderer is loading...');
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderError('Canvas context not available');
      setIsRendering(false);
      return;
    }

    // Clear canvas with background color
    const theme = colorThemes[colorTheme];
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const SmilesDrawer = smilesDrawerRef.current;
      const smilesString = String(smiles).trim();

      // Configure drawer options
      const options = {
        width: canvas.width,
        height: canvas.height,
        bondThickness: 1.5,
        bondLength: 25,
        shortBondLength: 0.85,
        bondSpacing: 0.18 * 25,
        atomVisualization: 'default',
        isomeric: true,
        debug: false,
        terminalCarbons: false,
        explicitHydrogens: false,
        overlapSensitivity: 0.42,
        overlapResolutionIterations: 1,
        compactDrawing: true,
        fontSizeLarge: 6,
        fontSizeSmall: 4,
        padding: 20.0,
        themes: {
          light: {
            C: theme.C,
            O: theme.O,
            N: theme.N,
            S: theme.S,
            P: theme.P,
            F: theme.F,
            CL: theme.Cl,
            BR: theme.Br,
            I: theme.I,
            H: theme.H,
            BACKGROUND: theme.background,
          },
        },
      };

      // Create drawer instance using the correct API
      const drawer = new SmilesDrawer.Drawer(options);

      // Parse and draw the SMILES - use canvas ID
      SmilesDrawer.parse(smilesString, (tree: any) => {
        // Draw to canvas element directly
        drawer.draw(tree, 'smiles-canvas', 'light', false);
        setIsRendering(false);
        setRenderError(null);
      }, (err: any) => {
        console.error('SMILES parse error:', err);
        setRenderError(`Invalid SMILES: ${err?.message || 'Could not parse molecule'}`);
        setIsRendering(false);
      });

    } catch (error: any) {
      console.error('Render error:', error);
      setRenderError(`Render error: ${error?.message || 'Unknown error'}`);
      setIsRendering(false);
    }
  }, [colorTheme]);

  // Re-render when settings change
  useEffect(() => {
    if (smilesInput && isLibraryLoaded) {
      // Small delay to ensure canvas is ready
      const timer = setTimeout(() => {
        renderSmiles(smilesInput);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [smilesInput, colorTheme, isLibraryLoaded, renderSmiles]);

  // Handle preset selection
  const handlePresetSelect = (preset: MoleculePreset) => {
    setSmilesInput(preset.smiles);
    setCurrentMoleculeName(preset.name);
    setRenderError(null);
  };

  // Handle manual SMILES input
  const handleSmilesChange = (value: string) => {
    setSmilesInput(value);
    setCurrentMoleculeName('');
  };

  // Trigger render on button click
  const handleRenderClick = () => {
    if (smilesInput) {
      renderSmiles(smilesInput);
    }
  };

  // Copy SMILES to clipboard
  const handleCopySmiles = async () => {
    if (!smilesInput) return;
    await navigator.clipboard.writeText(smilesInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied', description: 'SMILES string copied to clipboard' });
  };

  // Export as PNG
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${currentMoleculeName || 'molecule'}-structure.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast({ title: 'Downloaded', description: 'Structure saved as PNG' });
  };

  // Insert to canvas
  const handleInsert = () => {
    if (!canvasRef.current || !smilesInput) return;

    const dataUrl = canvasRef.current.toDataURL('image/png');
    onInsertStructure(dataUrl, currentMoleculeName);
    onOpenChange(false);

    toast({
      title: 'Inserted',
      description: `${currentMoleculeName || 'Chemical structure'} added to canvas`,
    });
  };

  // Reset
  const handleReset = () => {
    setSmilesInput('');
    setCurrentMoleculeName('');
    setRenderError(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = colorThemes[colorTheme].background;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Chemical Structure Renderer</DialogTitle>
                <DialogDescription>
                  Visualize molecules from SMILES strings
                </DialogDescription>
              </div>
            </div>
            {currentMoleculeName && (
              <Badge variant="secondary" className="text-sm">
                {currentMoleculeName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Presets Library */}
          <div className="w-72 border-r flex flex-col bg-muted/20">
            <div className="p-4 space-y-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search molecules..."
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
                      smilesInput === preset.smiles && 'bg-primary/10 text-primary'
                    )}
                  >
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-muted-foreground truncate font-mono">
                      {preset.smiles}
                    </div>
                  </button>
                ))}
                {filteredPresets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No molecules found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* SMILES Input */}
            <div className="p-4 border-b space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    SMILES String
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter SMILES (e.g., CCO for ethanol)"
                      value={smilesInput}
                      onChange={(e) => handleSmilesChange(e.target.value)}
                      className="font-mono text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenderClick();
                        }
                      }}
                    />
                    <Button onClick={handleRenderClick} disabled={!smilesInput || !isLibraryLoaded}>
                      Render
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopySmiles}
                            disabled={!smilesInput}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy SMILES</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Render Options */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Theme:</Label>
                  <Select value={colorTheme} onValueChange={(v) => setColorTheme(v as any)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(colorThemes).map(([key, theme]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Palette className="h-3 w-3" />
                            {theme.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!isLibraryLoaded && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading renderer...
                  </div>
                )}
              </div>
            </div>

            {/* Canvas Preview */}
            <div className="flex-1 flex items-center justify-center p-6 bg-muted/10 overflow-auto">
              <div className="relative">
                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {renderError ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-destructive/5">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <p className="text-destructive font-medium">{renderError}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please check your SMILES string and try again
                    </p>
                  </div>
                ) : (
                  <div
                    className="border rounded-lg shadow-sm overflow-hidden"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'center',
                    }}
                  >
                    <canvas
                      id="smiles-canvas"
                      ref={canvasRef}
                      width={500}
                      height={500}
                      style={{
                        background: colorThemes[colorTheme].background,
                        display: 'block',
                      }}
                    />
                  </div>
                )}

                {!smilesInput && !renderError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
                    <FlaskConical className="h-16 w-16 mb-4 opacity-20" />
                    <p>Enter a SMILES string or select a molecule</p>
                    <p className="text-sm mt-1">from the library on the left</p>
                  </div>
                )}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="p-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[scale]}
                    onValueChange={([v]) => setScale(v)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-32"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-12">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!smilesInput || !!renderError}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button
                  onClick={handleInsert}
                  disabled={!smilesInput || !!renderError}
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

export default ChemicalStructureRenderer;
