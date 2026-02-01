import { useState, useEffect, useRef } from 'react';
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

// Import SmilesDrawer directly
import * as SmilesDrawer from 'smiles-drawer';

interface ChemicalStructureRendererProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertStructure: (svgDataUrl: string, moleculeName?: string) => void;
}

interface MoleculePreset {
  name: string;
  smiles: string;
  category: string;
}

// Common molecule presets
const moleculePresets: MoleculePreset[] = [
  // Amino Acids
  { name: 'Glycine', smiles: 'NCC(=O)O', category: 'Amino Acids' },
  { name: 'Alanine', smiles: 'CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Valine', smiles: 'CC(C)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Leucine', smiles: 'CC(C)CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Phenylalanine', smiles: 'NC(Cc1ccccc1)C(=O)O', category: 'Amino Acids' },
  { name: 'Tryptophan', smiles: 'NC(Cc1c[nH]c2ccccc12)C(=O)O', category: 'Amino Acids' },
  { name: 'Serine', smiles: 'NC(CO)C(=O)O', category: 'Amino Acids' },
  { name: 'Cysteine', smiles: 'NC(CS)C(=O)O', category: 'Amino Acids' },
  { name: 'Tyrosine', smiles: 'NC(Cc1ccc(O)cc1)C(=O)O', category: 'Amino Acids' },
  { name: 'Histidine', smiles: 'NC(Cc1cnc[nH]1)C(=O)O', category: 'Amino Acids' },
  { name: 'Proline', smiles: 'OC(=O)C1CCCN1', category: 'Amino Acids' },

  // Nucleotides
  { name: 'Adenine', smiles: 'Nc1ncnc2[nH]cnc12', category: 'Nucleotides' },
  { name: 'Guanine', smiles: 'Nc1nc2[nH]cnc2c(=O)[nH]1', category: 'Nucleotides' },
  { name: 'Cytosine', smiles: 'Nc1cc[nH]c(=O)n1', category: 'Nucleotides' },
  { name: 'Thymine', smiles: 'Cc1c[nH]c(=O)[nH]c1=O', category: 'Nucleotides' },
  { name: 'Uracil', smiles: 'O=c1cc[nH]c(=O)[nH]1', category: 'Nucleotides' },

  // Sugars
  { name: 'Glucose', smiles: 'OCC1OC(O)C(O)C(O)C1O', category: 'Sugars' },
  { name: 'Fructose', smiles: 'OCC1OC(O)(CO)C(O)C1O', category: 'Sugars' },
  { name: 'Ribose', smiles: 'OCC1OC(O)C(O)C1O', category: 'Sugars' },

  // Drugs
  { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O', category: 'Drugs' },
  { name: 'Ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', category: 'Drugs' },
  { name: 'Caffeine', smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C', category: 'Drugs' },
  { name: 'Acetaminophen', smiles: 'CC(=O)Nc1ccc(O)cc1', category: 'Drugs' },
  { name: 'Penicillin V', smiles: 'CC1(C)SC2C(NC(=O)COc3ccccc3)C(=O)N2C1C(=O)O', category: 'Drugs' },

  // Neurotransmitters
  { name: 'Dopamine', smiles: 'NCCc1ccc(O)c(O)c1', category: 'Neurotransmitters' },
  { name: 'Serotonin', smiles: 'NCCc1c[nH]c2ccc(O)cc12', category: 'Neurotransmitters' },
  { name: 'GABA', smiles: 'NCCCC(=O)O', category: 'Neurotransmitters' },
  { name: 'Acetylcholine', smiles: 'CC(=O)OCC[N+](C)(C)C', category: 'Neurotransmitters' },
  { name: 'Epinephrine', smiles: 'CNCC(O)c1ccc(O)c(O)c1', category: 'Neurotransmitters' },

  // Lipids
  { name: 'Cholesterol', smiles: 'CC(C)CCCC(C)C1CCC2C1(CCC1C2CC=C2CC(O)CCC12C)C', category: 'Lipids' },
  { name: 'Palmitic Acid', smiles: 'CCCCCCCCCCCCCCCC(=O)O', category: 'Lipids' },

  // Simple
  { name: 'Ethanol', smiles: 'CCO', category: 'Simple' },
  { name: 'Acetic Acid', smiles: 'CC(=O)O', category: 'Simple' },
  { name: 'Benzene', smiles: 'c1ccccc1', category: 'Simple' },
  { name: 'Methanol', smiles: 'CO', category: 'Simple' },
  { name: 'Acetone', smiles: 'CC(=O)C', category: 'Simple' },
  { name: 'Urea', smiles: 'NC(N)=O', category: 'Simple' },
  { name: 'Formaldehyde', smiles: 'C=O', category: 'Simple' },

  // Vitamins
  { name: 'Vitamin C', smiles: 'OCC(O)C1OC(=O)C(O)=C1O', category: 'Vitamins' },
];

export const ChemicalStructureRenderer = ({
  open,
  onOpenChange,
  onInsertStructure,
}: ChemicalStructureRendererProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawerRef = useRef<any>(null);

  const [smilesInput, setSmilesInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scale, setScale] = useState(1.0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentMoleculeName, setCurrentMoleculeName] = useState<string>('');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(moleculePresets.map(m => m.category)))];

  // Filter presets
  const filteredPresets = moleculePresets.filter(preset => {
    const matchesSearch = searchQuery === '' ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.smiles.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Initialize drawer when dialog opens
  useEffect(() => {
    if (open && !drawerRef.current) {
      try {
        drawerRef.current = new SmilesDrawer.Drawer({
          width: 500,
          height: 500,
          bondThickness: 1.0,
          bondLength: 20,
          shortBondLength: 0.85,
          bondSpacing: 3.6,
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
          padding: 30.0,
        });
        console.log('SmilesDrawer initialized');
      } catch (err) {
        console.error('Failed to initialize SmilesDrawer:', err);
      }
    }
  }, [open]);

  // Render function
  const renderMolecule = (smiles: string) => {
    if (!smiles || !canvasRef.current || !drawerRef.current) {
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    try {
      // Use SmilesDrawer.parse to parse the SMILES string
      SmilesDrawer.parse(
        smiles,
        (tree: any) => {
          try {
            // Draw to canvas using the canvas ID (as per SmilesDrawer API)
            drawerRef.current.draw(tree, 'smiles-preview-canvas', 'light', false);
            setRenderError(null);
          } catch (drawErr: any) {
            console.error('Draw error:', drawErr);
            setRenderError('Failed to draw molecule');
          }
          setIsRendering(false);
        },
        (parseErr: any) => {
          console.error('Parse error:', parseErr);
          setRenderError(`Invalid SMILES: ${parseErr?.message || 'Parse failed'}`);
          setIsRendering(false);
        }
      );
    } catch (err: any) {
      console.error('Render error:', err);
      setRenderError(`Error: ${err?.message || 'Unknown error'}`);
      setIsRendering(false);
    }
  };

  // Render when input changes
  useEffect(() => {
    if (smilesInput && open && drawerRef.current) {
      const timer = setTimeout(() => {
        renderMolecule(smilesInput);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [smilesInput, open]);

  // Handle preset selection
  const handlePresetSelect = (preset: MoleculePreset) => {
    setSmilesInput(preset.smiles);
    setCurrentMoleculeName(preset.name);
    setRenderError(null);
  };

  // Handle manual input
  const handleSmilesChange = (value: string) => {
    setSmilesInput(value);
    setCurrentMoleculeName('');
  };

  // Copy SMILES
  const handleCopySmiles = async () => {
    if (!smilesInput) return;
    await navigator.clipboard.writeText(smilesInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied', description: 'SMILES copied to clipboard' });
  };

  // Download PNG
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${currentMoleculeName || 'molecule'}.png`;
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
      description: `${currentMoleculeName || 'Structure'} added to canvas`,
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
        ctx.fillStyle = '#ffffff';
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
                  Visualize molecules from SMILES strings (100% free, runs locally)
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
          {/* Left Panel - Presets */}
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
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Input */}
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
                    />
                    <Button
                      onClick={() => renderMolecule(smilesInput)}
                      disabled={!smilesInput}
                    >
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
                    <Button variant="outline" size="icon" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-destructive font-medium">{renderError}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check your SMILES string and try again
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'center',
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      id="smiles-preview-canvas"
                      width={500}
                      height={500}
                      className="border rounded-lg shadow-sm bg-white"
                    />
                  </div>
                )}

                {!smilesInput && !renderError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
                    <FlaskConical className="h-16 w-16 mb-4 opacity-20" />
                    <p>Select a molecule from the library</p>
                    <p className="text-sm mt-1">or enter a SMILES string</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-3 border-t flex items-center justify-between">
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
                <span className="text-xs text-muted-foreground ml-2">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!smilesInput || !!renderError}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
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
