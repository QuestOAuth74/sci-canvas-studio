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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Circle,
  Minus,
  Settings2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Import SmilesDrawer - use default export which contains all classes
import SmilesDrawer from 'smiles-drawer';

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

// Common molecule presets - comprehensive library
const moleculePresets: MoleculePreset[] = [
  // ═══════════════════════════════════════════════════════════════
  // AMINO ACIDS (All 20 standard amino acids)
  // ═══════════════════════════════════════════════════════════════
  { name: 'Glycine (Gly)', smiles: 'NCC(=O)O', category: 'Amino Acids' },
  { name: 'Alanine (Ala)', smiles: 'CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Valine (Val)', smiles: 'CC(C)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Leucine (Leu)', smiles: 'CC(C)CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Isoleucine (Ile)', smiles: 'CCC(C)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Proline (Pro)', smiles: 'OC(=O)C1CCCN1', category: 'Amino Acids' },
  { name: 'Phenylalanine (Phe)', smiles: 'NC(Cc1ccccc1)C(=O)O', category: 'Amino Acids' },
  { name: 'Tryptophan (Trp)', smiles: 'NC(Cc1c[nH]c2ccccc12)C(=O)O', category: 'Amino Acids' },
  { name: 'Methionine (Met)', smiles: 'CSCCC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Serine (Ser)', smiles: 'NC(CO)C(=O)O', category: 'Amino Acids' },
  { name: 'Threonine (Thr)', smiles: 'CC(O)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Cysteine (Cys)', smiles: 'NC(CS)C(=O)O', category: 'Amino Acids' },
  { name: 'Tyrosine (Tyr)', smiles: 'NC(Cc1ccc(O)cc1)C(=O)O', category: 'Amino Acids' },
  { name: 'Asparagine (Asn)', smiles: 'NC(CC(N)=O)C(=O)O', category: 'Amino Acids' },
  { name: 'Glutamine (Gln)', smiles: 'NC(CCC(N)=O)C(=O)O', category: 'Amino Acids' },
  { name: 'Aspartic Acid (Asp)', smiles: 'NC(CC(=O)O)C(=O)O', category: 'Amino Acids' },
  { name: 'Glutamic Acid (Glu)', smiles: 'NC(CCC(=O)O)C(=O)O', category: 'Amino Acids' },
  { name: 'Lysine (Lys)', smiles: 'NCCCCC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Arginine (Arg)', smiles: 'NC(CCCNC(N)=N)C(=O)O', category: 'Amino Acids' },
  { name: 'Histidine (His)', smiles: 'NC(Cc1cnc[nH]1)C(=O)O', category: 'Amino Acids' },

  // ═══════════════════════════════════════════════════════════════
  // NUCLEOTIDES & NUCLEOSIDES
  // ═══════════════════════════════════════════════════════════════
  { name: 'Adenine', smiles: 'Nc1ncnc2[nH]cnc12', category: 'Nucleotides' },
  { name: 'Guanine', smiles: 'Nc1nc2[nH]cnc2c(=O)[nH]1', category: 'Nucleotides' },
  { name: 'Cytosine', smiles: 'Nc1cc[nH]c(=O)n1', category: 'Nucleotides' },
  { name: 'Thymine', smiles: 'Cc1c[nH]c(=O)[nH]c1=O', category: 'Nucleotides' },
  { name: 'Uracil', smiles: 'O=c1cc[nH]c(=O)[nH]1', category: 'Nucleotides' },
  { name: 'Adenosine', smiles: 'Nc1ncnc2c1ncn2C1OC(CO)C(O)C1O', category: 'Nucleotides' },
  { name: 'Guanosine', smiles: 'Nc1nc2c(ncn2C2OC(CO)C(O)C2O)c(=O)[nH]1', category: 'Nucleotides' },
  { name: 'Thymidine', smiles: 'Cc1cn(C2CC(O)C(CO)O2)c(=O)[nH]c1=O', category: 'Nucleotides' },
  { name: 'Xanthine', smiles: 'O=c1[nH]c(=O)c2[nH]cnc2[nH]1', category: 'Nucleotides' },
  { name: 'Hypoxanthine', smiles: 'O=c1[nH]cnc2[nH]cnc12', category: 'Nucleotides' },

  // ═══════════════════════════════════════════════════════════════
  // SUGARS & CARBOHYDRATES
  // ═══════════════════════════════════════════════════════════════
  { name: 'Glucose', smiles: 'OCC1OC(O)C(O)C(O)C1O', category: 'Sugars' },
  { name: 'Fructose', smiles: 'OCC1OC(O)(CO)C(O)C1O', category: 'Sugars' },
  { name: 'Galactose', smiles: 'OCC1OC(O)C(O)C(O)C1O', category: 'Sugars' },
  { name: 'Mannose', smiles: 'OCC1OC(O)C(O)C(O)C1O', category: 'Sugars' },
  { name: 'Ribose', smiles: 'OCC1OC(O)C(O)C1O', category: 'Sugars' },
  { name: 'Deoxyribose', smiles: 'OCC1OC(O)CC1O', category: 'Sugars' },
  { name: 'Sucrose', smiles: 'OCC1OC(OC2(CO)OC(CO)C(O)C2O)C(O)C(O)C1O', category: 'Sugars' },
  { name: 'Lactose', smiles: 'OCC1OC(OC2C(O)C(O)C(O)OC2CO)C(O)C(O)C1O', category: 'Sugars' },
  { name: 'Maltose', smiles: 'OCC1OC(OC2C(O)C(O)C(O)OC2CO)C(O)C(O)C1O', category: 'Sugars' },
  { name: 'Sorbitol', smiles: 'OCC(O)C(O)C(O)C(O)CO', category: 'Sugars' },

  // ═══════════════════════════════════════════════════════════════
  // PHARMACEUTICAL DRUGS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O', category: 'Drugs' },
  { name: 'Ibuprofen', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', category: 'Drugs' },
  { name: 'Acetaminophen', smiles: 'CC(=O)Nc1ccc(O)cc1', category: 'Drugs' },
  { name: 'Naproxen', smiles: 'COc1ccc2cc(C(C)C(=O)O)ccc2c1', category: 'Drugs' },
  { name: 'Caffeine', smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C', category: 'Drugs' },
  { name: 'Nicotine', smiles: 'CN1CCCC1c1cccnc1', category: 'Drugs' },
  { name: 'Morphine', smiles: 'CN1CCC23C4Oc5c(O)ccc(C2C1CC4O)c53', category: 'Drugs' },
  { name: 'Codeine', smiles: 'COc1ccc2C3C4CC5=C(C(O)CC5(O)C4C2c1)O3', category: 'Drugs' },
  { name: 'Penicillin G', smiles: 'CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O', category: 'Drugs' },
  { name: 'Amoxicillin', smiles: 'CC1(C)SC2C(NC(=O)C(N)c3ccc(O)cc3)C(=O)N2C1C(=O)O', category: 'Drugs' },
  { name: 'Metformin', smiles: 'CN(C)C(=N)NC(=N)N', category: 'Drugs' },
  { name: 'Atorvastatin', smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccc(F)cc3)n(c1CCC(O)CC(O)CC(=O)O)C(C)C', category: 'Drugs' },
  { name: 'Omeprazole', smiles: 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1', category: 'Drugs' },
  { name: 'Lisinopril', smiles: 'NCCCC(NC(CCc1ccccc1)C(=O)O)C(=O)N1CCCC1C(=O)O', category: 'Drugs' },
  { name: 'Metoprolol', smiles: 'COCCc1ccc(OCC(O)CNC(C)C)cc1', category: 'Drugs' },
  { name: 'Amlodipine', smiles: 'CCOC(=O)C1=C(COCCN)NC(C)=C(C1c1ccccc1Cl)C(=O)OC', category: 'Drugs' },
  { name: 'Sildenafil', smiles: 'CCCc1nn(C)c2c1nc(nc2S(=O)(=O)N1CCN(C)CC1)c1ccc(OCC)cc1', category: 'Drugs' },
  { name: 'Warfarin', smiles: 'CC(=O)CC(c1ccccc1)c1c(O)c2ccccc2oc1=O', category: 'Drugs' },
  { name: 'Diazepam', smiles: 'CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21', category: 'Drugs' },
  { name: 'Fluoxetine', smiles: 'CNCCC(Oc1ccc(C(F)(F)F)cc1)c1ccccc1', category: 'Drugs' },

  // ═══════════════════════════════════════════════════════════════
  // NEUROTRANSMITTERS & HORMONES
  // ═══════════════════════════════════════════════════════════════
  { name: 'Dopamine', smiles: 'NCCc1ccc(O)c(O)c1', category: 'Neurotransmitters' },
  { name: 'Serotonin', smiles: 'NCCc1c[nH]c2ccc(O)cc12', category: 'Neurotransmitters' },
  { name: 'Norepinephrine', smiles: 'NCC(O)c1ccc(O)c(O)c1', category: 'Neurotransmitters' },
  { name: 'Epinephrine', smiles: 'CNCC(O)c1ccc(O)c(O)c1', category: 'Neurotransmitters' },
  { name: 'GABA', smiles: 'NCCCC(=O)O', category: 'Neurotransmitters' },
  { name: 'Glutamate', smiles: 'NC(CCC(=O)O)C(=O)O', category: 'Neurotransmitters' },
  { name: 'Acetylcholine', smiles: 'CC(=O)OCC[N+](C)(C)C', category: 'Neurotransmitters' },
  { name: 'Histamine', smiles: 'NCCc1c[nH]cn1', category: 'Neurotransmitters' },
  { name: 'Melatonin', smiles: 'COc1ccc2[nH]cc(CCNC(C)=O)c2c1', category: 'Neurotransmitters' },
  { name: 'Glycine (NT)', smiles: 'NCC(=O)O', category: 'Neurotransmitters' },
  { name: 'Aspartate', smiles: 'NC(CC(=O)O)C(=O)O', category: 'Neurotransmitters' },
  { name: 'Endorphin (Leu-Enkephalin)', smiles: 'CC(C)CC(NC(=O)C(Cc1ccccc1)NC(=O)C(Cc1ccc(O)cc1)NC(=O)CNC(=O)C(N)Cc1ccc(O)cc1)C(=O)O', category: 'Neurotransmitters' },

  // ═══════════════════════════════════════════════════════════════
  // STEROIDS & HORMONES
  // ═══════════════════════════════════════════════════════════════
  { name: 'Cholesterol', smiles: 'CC(C)CCCC(C)C1CCC2C1(CCC1C2CC=C2CC(O)CCC12C)C', category: 'Steroids' },
  { name: 'Testosterone', smiles: 'CC12CCC3C(CCC4=CC(=O)CCC34C)C1CCC2O', category: 'Steroids' },
  { name: 'Estradiol', smiles: 'CC12CCC3c4ccc(O)cc4CCC3C1CCC2O', category: 'Steroids' },
  { name: 'Progesterone', smiles: 'CC(=O)C1CCC2C1(C)CCC1C2CCC2=CC(=O)CCC12C', category: 'Steroids' },
  { name: 'Cortisol', smiles: 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C1CCC2(O)C(=O)CO', category: 'Steroids' },
  { name: 'Aldosterone', smiles: 'CC12CCC(=O)C=C1CCC1C2C(=O)CC2(C)C1CCC2(O)C(=O)CO', category: 'Steroids' },
  { name: 'Prednisone', smiles: 'CC12C=CC(=O)C=C1CCC1C2C(=O)CC2(C)C1CCC2(O)C(=O)CO', category: 'Steroids' },
  { name: 'Vitamin D3', smiles: 'CC(C)CCCC(C)C1CCC2C1(C)CCC/C2=C/C=C1/CC(O)CCC1=C', category: 'Steroids' },
  { name: 'Bile Acid (Cholic)', smiles: 'CC(CCC(=O)O)C1CCC2C1(C)C(O)CC1C2C(O)CC2CC(O)CCC12C', category: 'Steroids' },

  // ═══════════════════════════════════════════════════════════════
  // LIPIDS & FATTY ACIDS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Palmitic Acid', smiles: 'CCCCCCCCCCCCCCCC(=O)O', category: 'Lipids' },
  { name: 'Stearic Acid', smiles: 'CCCCCCCCCCCCCCCCCC(=O)O', category: 'Lipids' },
  { name: 'Oleic Acid', smiles: 'CCCCCCCCC=CCCCCCCCC(=O)O', category: 'Lipids' },
  { name: 'Linoleic Acid', smiles: 'CCCCCC=CCC=CCCCCCCCC(=O)O', category: 'Lipids' },
  { name: 'Arachidonic Acid', smiles: 'CCCCC/C=C\\C/C=C\\C/C=C\\C/C=C\\CCCC(=O)O', category: 'Lipids' },
  { name: 'Lauric Acid', smiles: 'CCCCCCCCCCCC(=O)O', category: 'Lipids' },
  { name: 'Myristic Acid', smiles: 'CCCCCCCCCCCCCC(=O)O', category: 'Lipids' },
  { name: 'DHA', smiles: 'CCC=CCC=CCC=CCC=CCC=CCC=CCCC(=O)O', category: 'Lipids' },
  { name: 'EPA', smiles: 'CCC=CCC=CCC=CCC=CCC=CCCCC(=O)O', category: 'Lipids' },
  { name: 'Sphingosine', smiles: 'CCCCCCCCCCCCC=CC(O)C(N)CO', category: 'Lipids' },

  // ═══════════════════════════════════════════════════════════════
  // VITAMINS & COFACTORS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Vitamin A (Retinol)', smiles: 'CC1=C(C(CCC1)(C)C)C=CC(=CC=CC(=CCO)C)C', category: 'Vitamins' },
  { name: 'Vitamin B1 (Thiamine)', smiles: 'Cc1ncc(C[n+]2csc(CCO)c2C)c(N)n1', category: 'Vitamins' },
  { name: 'Vitamin B2 (Riboflavin)', smiles: 'Cc1cc2nc3c(=O)[nH]c(=O)nc-3n(CC(O)C(O)C(O)CO)c2cc1C', category: 'Vitamins' },
  { name: 'Vitamin B3 (Niacin)', smiles: 'OC(=O)c1cccnc1', category: 'Vitamins' },
  { name: 'Vitamin B5 (Pantothenic)', smiles: 'CC(C)(CO)C(O)C(=O)NCCC(=O)O', category: 'Vitamins' },
  { name: 'Vitamin B6 (Pyridoxine)', smiles: 'Cc1ncc(CO)c(CO)c1O', category: 'Vitamins' },
  { name: 'Vitamin B7 (Biotin)', smiles: 'OC(=O)CCCCC1SCC2NC(=O)NC12', category: 'Vitamins' },
  { name: 'Vitamin B9 (Folic Acid)', smiles: 'Nc1nc2ncc(CNc3ccc(cc3)C(=O)NC(CCC(=O)O)C(=O)O)nc2c(=O)[nH]1', category: 'Vitamins' },
  { name: 'Vitamin B12 Core', smiles: 'CC1=CC2=C(C)C(CCC(N)=O)=C(C)N2C(C)=C1', category: 'Vitamins' },
  { name: 'Vitamin C (Ascorbic)', smiles: 'OCC(O)C1OC(=O)C(O)=C1O', category: 'Vitamins' },
  { name: 'Vitamin E (α-Tocopherol)', smiles: 'CC(C)CCCC(C)CCCC(C)CCCC1(C)CCc2c(C)c(O)c(C)c(C)c2O1', category: 'Vitamins' },
  { name: 'Vitamin K1', smiles: 'CC(C)=CCCC(C)CCCC(C)CCCC1=C(C)C(=O)c2ccccc2C1=O', category: 'Vitamins' },
  { name: 'NAD+', smiles: 'NC(=O)c1ccc[n+](C2OC(COP(=O)(O)OP(=O)(O)OCC3OC(n4cnc5c(N)ncnc54)C(O)C3O)C(O)C2O)c1', category: 'Vitamins' },
  { name: 'FAD', smiles: 'Cc1cc2nc3c(=O)[nH]c(=O)nc-3n(CC(O)C(O)C(O)COP(=O)(O)OP(=O)(O)OCC3OC(n4cnc5c(N)ncnc54)C(O)C3O)c2cc1C', category: 'Vitamins' },
  { name: 'Coenzyme A (core)', smiles: 'CC(C)(COP(=O)(O)OP(=O)(O)OCC1OC(n2cnc3c(N)ncnc32)C(O)C1O)C(O)C(=O)NCCC(=O)NCCS', category: 'Vitamins' },

  // ═══════════════════════════════════════════════════════════════
  // METABOLITES & BIOCHEMICALS
  // ═══════════════════════════════════════════════════════════════
  { name: 'ATP', smiles: 'Nc1ncnc2c1ncn2C1OC(COP(=O)(O)OP(=O)(O)OP(=O)(O)O)C(O)C1O', category: 'Metabolites' },
  { name: 'ADP', smiles: 'Nc1ncnc2c1ncn2C1OC(COP(=O)(O)OP(=O)(O)O)C(O)C1O', category: 'Metabolites' },
  { name: 'AMP', smiles: 'Nc1ncnc2c1ncn2C1OC(COP(=O)(O)O)C(O)C1O', category: 'Metabolites' },
  { name: 'Pyruvate', smiles: 'CC(=O)C(=O)O', category: 'Metabolites' },
  { name: 'Lactate', smiles: 'CC(O)C(=O)O', category: 'Metabolites' },
  { name: 'Citrate', smiles: 'OC(=O)CC(O)(CC(=O)O)C(=O)O', category: 'Metabolites' },
  { name: 'Succinate', smiles: 'OC(=O)CCC(=O)O', category: 'Metabolites' },
  { name: 'Fumarate', smiles: 'OC(=O)C=CC(=O)O', category: 'Metabolites' },
  { name: 'Malate', smiles: 'OC(=O)CC(O)C(=O)O', category: 'Metabolites' },
  { name: 'Oxaloacetate', smiles: 'OC(=O)CC(=O)C(=O)O', category: 'Metabolites' },
  { name: 'α-Ketoglutarate', smiles: 'OC(=O)CCC(=O)C(=O)O', category: 'Metabolites' },
  { name: 'Acetyl-CoA (acetyl)', smiles: 'CC(=O)SCCNC(=O)CCNC(=O)C(O)C(C)(C)COP(=O)(O)O', category: 'Metabolites' },
  { name: 'Creatine', smiles: 'CN(CC(=O)O)C(=N)N', category: 'Metabolites' },
  { name: 'Creatinine', smiles: 'CN1CC(=O)NC1=N', category: 'Metabolites' },
  { name: 'Uric Acid', smiles: 'O=c1[nH]c(=O)c2[nH]c(=O)[nH]c2[nH]1', category: 'Metabolites' },
  { name: 'Bilirubin', smiles: 'CC1=C(C=C)C(=O)NC1=Cc1[nH]c(Cc2[nH]c(C=C3NC(=O)C(C=C)=C3C)c(CCC(=O)O)c2C)c(CCC(=O)O)c1C', category: 'Metabolites' },

  // ═══════════════════════════════════════════════════════════════
  // AROMATIC COMPOUNDS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Benzene', smiles: 'c1ccccc1', category: 'Aromatics' },
  { name: 'Toluene', smiles: 'Cc1ccccc1', category: 'Aromatics' },
  { name: 'Phenol', smiles: 'Oc1ccccc1', category: 'Aromatics' },
  { name: 'Aniline', smiles: 'Nc1ccccc1', category: 'Aromatics' },
  { name: 'Benzoic Acid', smiles: 'OC(=O)c1ccccc1', category: 'Aromatics' },
  { name: 'Naphthalene', smiles: 'c1ccc2ccccc2c1', category: 'Aromatics' },
  { name: 'Anthracene', smiles: 'c1ccc2cc3ccccc3cc2c1', category: 'Aromatics' },
  { name: 'Phenanthrene', smiles: 'c1ccc2c(c1)ccc1ccccc12', category: 'Aromatics' },
  { name: 'Pyrene', smiles: 'c1cc2ccc3cccc4ccc(c1)c2c34', category: 'Aromatics' },
  { name: 'Styrene', smiles: 'C=Cc1ccccc1', category: 'Aromatics' },
  { name: 'Biphenyl', smiles: 'c1ccc(cc1)c1ccccc1', category: 'Aromatics' },
  { name: 'Xylene (ortho)', smiles: 'Cc1ccccc1C', category: 'Aromatics' },

  // ═══════════════════════════════════════════════════════════════
  // NATURAL PRODUCTS & ALKALOIDS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Quinine', smiles: 'COc1ccc2nccc(C(O)C3CC4CCN3CC4C=C)c2c1', category: 'Natural Products' },
  { name: 'Capsaicin', smiles: 'COc1cc(CNC(=O)CCCC/C=C/C(C)C)ccc1O', category: 'Natural Products' },
  { name: 'Curcumin', smiles: 'COc1cc(/C=C/C(=O)CC(=O)/C=C/c2ccc(O)c(OC)c2)ccc1O', category: 'Natural Products' },
  { name: 'Resveratrol', smiles: 'Oc1ccc(C=Cc2cc(O)cc(O)c2)cc1', category: 'Natural Products' },
  { name: 'Quercetin', smiles: 'Oc1cc(O)c2c(c1)oc(c(O)c2=O)c1ccc(O)c(O)c1', category: 'Natural Products' },
  { name: 'EGCG', smiles: 'Oc1cc(O)c2c(c1)OC(c1cc(O)c(O)c(O)c1)C(OC(=O)c1cc(O)c(O)c(O)c1)C2', category: 'Natural Products' },
  { name: 'Artemisinin', smiles: 'CC1CCC2C(C)C(=O)OC3OC4(C)CCC1C23OO4', category: 'Natural Products' },
  { name: 'Taxol (core)', smiles: 'CC(=O)OC1C(=O)C2(C)C(O)CC3OCC4(OC(C)=O)C(OC(=O)c5ccccc5)C(O)C(C)(C1O)C34C2', category: 'Natural Products' },
  { name: 'Gingerol', smiles: 'CCCCC(O)CC(=O)CCc1ccc(O)c(OC)c1', category: 'Natural Products' },
  { name: 'Lycopene', smiles: 'CC(C)=CCCC(C)=CCCC(C)=CC=CC(C)=CC=CC=C(C)C=CC=C(C)C=CC=C(C)CCC=C(C)C', category: 'Natural Products' },
  { name: 'Beta-Carotene', smiles: 'CC1=C(C(CCC1)(C)C)C=CC(=CC=CC(=CC=CC=C(C)C=CC=C(C)C=CC1=C(C)CCCC1(C)C)C)C', category: 'Natural Products' },
  { name: 'Menthol', smiles: 'CC1CCC(C(C)C)C(O)C1', category: 'Natural Products' },
  { name: 'Camphor', smiles: 'CC1(C)C2CCC1(C)C(=O)C2', category: 'Natural Products' },
  { name: 'Limonene', smiles: 'CC(=C)C1CCC(C)=CC1', category: 'Natural Products' },
  { name: 'Vanillin', smiles: 'COc1cc(C=O)ccc1O', category: 'Natural Products' },
  { name: 'Eugenol', smiles: 'COc1cc(CC=C)ccc1O', category: 'Natural Products' },

  // ═══════════════════════════════════════════════════════════════
  // SIMPLE ORGANIC MOLECULES
  // ═══════════════════════════════════════════════════════════════
  { name: 'Methane', smiles: 'C', category: 'Simple' },
  { name: 'Ethane', smiles: 'CC', category: 'Simple' },
  { name: 'Propane', smiles: 'CCC', category: 'Simple' },
  { name: 'Butane', smiles: 'CCCC', category: 'Simple' },
  { name: 'Methanol', smiles: 'CO', category: 'Simple' },
  { name: 'Ethanol', smiles: 'CCO', category: 'Simple' },
  { name: 'Propanol', smiles: 'CCCO', category: 'Simple' },
  { name: 'Isopropanol', smiles: 'CC(C)O', category: 'Simple' },
  { name: 'Formaldehyde', smiles: 'C=O', category: 'Simple' },
  { name: 'Acetaldehyde', smiles: 'CC=O', category: 'Simple' },
  { name: 'Acetone', smiles: 'CC(=O)C', category: 'Simple' },
  { name: 'Formic Acid', smiles: 'OC=O', category: 'Simple' },
  { name: 'Acetic Acid', smiles: 'CC(=O)O', category: 'Simple' },
  { name: 'Propionic Acid', smiles: 'CCC(=O)O', category: 'Simple' },
  { name: 'Glycerol', smiles: 'OCC(O)CO', category: 'Simple' },
  { name: 'Ethylene Glycol', smiles: 'OCCO', category: 'Simple' },
  { name: 'Urea', smiles: 'NC(N)=O', category: 'Simple' },
  { name: 'Water', smiles: 'O', category: 'Simple' },
  { name: 'Ammonia', smiles: 'N', category: 'Simple' },
  { name: 'Hydrogen Peroxide', smiles: 'OO', category: 'Simple' },
  { name: 'Carbon Dioxide', smiles: 'O=C=O', category: 'Simple' },
  { name: 'Hydrogen Sulfide', smiles: 'S', category: 'Simple' },

  // ═══════════════════════════════════════════════════════════════
  // POLYMERS & MONOMERS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Ethylene', smiles: 'C=C', category: 'Polymers' },
  { name: 'Propylene', smiles: 'CC=C', category: 'Polymers' },
  { name: 'Vinyl Chloride', smiles: 'C=CCl', category: 'Polymers' },
  { name: 'Acrylonitrile', smiles: 'C=CC#N', category: 'Polymers' },
  { name: 'Acrylic Acid', smiles: 'C=CC(=O)O', category: 'Polymers' },
  { name: 'Methyl Methacrylate', smiles: 'CC(=C)C(=O)OC', category: 'Polymers' },
  { name: 'Caprolactam', smiles: 'O=C1CCCCCN1', category: 'Polymers' },
  { name: 'Terephthalic Acid', smiles: 'OC(=O)c1ccc(C(=O)O)cc1', category: 'Polymers' },
  { name: 'Adipic Acid', smiles: 'OC(=O)CCCCC(=O)O', category: 'Polymers' },
  { name: 'Hexamethylenediamine', smiles: 'NCCCCCCN', category: 'Polymers' },
  { name: 'Bisphenol A', smiles: 'CC(C)(c1ccc(O)cc1)c1ccc(O)cc1', category: 'Polymers' },
  { name: 'Lactic Acid', smiles: 'CC(O)C(=O)O', category: 'Polymers' },

  // ═══════════════════════════════════════════════════════════════
  // DYES & INDICATORS
  // ═══════════════════════════════════════════════════════════════
  { name: 'Phenolphthalein', smiles: 'OC(c1ccc(O)cc1)(c1ccc(O)cc1)c1ccccc1C(=O)O', category: 'Dyes' },
  { name: 'Methyl Orange', smiles: 'CN(C)c1ccc(N=Nc2ccc(S(=O)(=O)O)cc2)cc1', category: 'Dyes' },
  { name: 'Methylene Blue', smiles: 'CN(C)c1ccc2nc3ccc(N(C)C)cc3[s+]c2c1', category: 'Dyes' },
  { name: 'Bromothymol Blue', smiles: 'CC(C)c1cc(C2(c3cc(C(C)C)c(O)c(Br)c3)OS(=O)(=O)c3ccccc32)c(Br)c(O)c1C(C)C', category: 'Dyes' },
  { name: 'Fluorescein', smiles: 'OC(=O)c1ccccc1C1c2ccc(O)cc2Oc2cc(O)ccc21', category: 'Dyes' },
  { name: 'Rhodamine B', smiles: 'CCN(CC)c1ccc2c(c1)Oc1cc(N(CC)CC)ccc1C2c1ccccc1C(=O)O', category: 'Dyes' },
  { name: 'Crystal Violet', smiles: 'CN(C)c1ccc(C(c2ccc(N(C)C)cc2)c2ccc(N(C)C)cc2)cc1', category: 'Dyes' },
  { name: 'Indigo', smiles: 'O=C1Nc2ccccc2C1=C1C(=O)Nc2ccccc21', category: 'Dyes' },
  { name: 'Eosin Y', smiles: 'OC(=O)c1ccccc1C1c2cc(Br)c(O)c(Br)c2Oc2c(Br)c(O)c(Br)cc21', category: 'Dyes' },
  { name: 'DAPI', smiles: 'N=C(N)c1ccc(cc1)c1ccc2[nH]c(nc2c1)c1ccc(cc1)C(N)=N', category: 'Dyes' },

  // ═══════════════════════════════════════════════════════════════
  // TOXINS & POISONS (for educational purposes)
  // ═══════════════════════════════════════════════════════════════
  { name: 'Cyanide Ion', smiles: '[C-]#N', category: 'Toxins' },
  { name: 'Arsenic Trioxide', smiles: 'O=[As]O[As]=O', category: 'Toxins' },
  { name: 'Ricin (simplified)', smiles: 'OCC1OC(OCC2OC(O)C(O)C(O)C2O)C(O)C(O)C1O', category: 'Toxins' },
  { name: 'Aflatoxin B1', smiles: 'COc1cc2c(c3oc(=O)c4c(c13)CCC4=O)C1C=COC1O2', category: 'Toxins' },
  { name: 'Strychnine', smiles: 'O=C1CC2C3Cc4ccccc4N3C3CC=C4C2C1N4C=C3', category: 'Toxins' },
  { name: 'Tetrodotoxin (core)', smiles: 'OCC1(O)C(O)C2C3C(O)C(O)C(N)(O)C1(O)N=C(N)NC32', category: 'Toxins' },
  { name: 'Botulinum (simple)', smiles: 'NCCCC(N)C(=O)O', category: 'Toxins' },
  { name: 'Muscarine', smiles: 'C[N+](C)(C)CC(O)C1CCCO1', category: 'Toxins' },
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

  // Display mode options
  const [displayMode, setDisplayMode] = useState<'default' | 'balls'>('default');
  const [showTerminalCarbons, setShowTerminalCarbons] = useState(false);
  const [showExplicitHydrogens, setShowExplicitHydrogens] = useState(false);
  const [compactDrawing, setCompactDrawing] = useState(true);

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

  // Initialize/reinitialize drawer when dialog opens or display options change
  useEffect(() => {
    if (open) {
      try {
        drawerRef.current = new SmilesDrawer.Drawer({
          width: 500,
          height: 500,
          bondThickness: 1.0,
          bondLength: 20,
          shortBondLength: 0.85,
          bondSpacing: 3.6,
          atomVisualization: displayMode,
          isomeric: true,
          debug: false,
          terminalCarbons: showTerminalCarbons,
          explicitHydrogens: showExplicitHydrogens,
          overlapSensitivity: 0.42,
          overlapResolutionIterations: 1,
          compactDrawing: compactDrawing,
          fontSizeLarge: 6,
          fontSizeSmall: 4,
          padding: 30.0,
        });
        console.log('SmilesDrawer initialized with mode:', displayMode);

        // Re-render current molecule if one is selected
        if (smilesInput) {
          setTimeout(() => renderMolecule(smilesInput), 100);
        }
      } catch (err) {
        console.error('Failed to initialize SmilesDrawer:', err);
      }
    }
  }, [open, displayMode, showTerminalCarbons, showExplicitHydrogens, compactDrawing]);

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

              {/* Display Mode Controls */}
              <div className="flex items-center gap-6 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-medium text-muted-foreground">Display Mode:</Label>
                </div>

                {/* Skeletal vs Ball-and-Stick */}
                <div className="flex items-center gap-2">
                  <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as 'default' | 'balls')}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        <div className="flex items-center gap-2">
                          <Minus className="h-3 w-3" />
                          <span>Skeletal</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="balls">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3" />
                          <span>Ball & Stick</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Terminal Carbons */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="terminal-carbons"
                          checked={showTerminalCarbons}
                          onCheckedChange={setShowTerminalCarbons}
                          className="scale-75"
                        />
                        <Label htmlFor="terminal-carbons" className="text-xs cursor-pointer">
                          CH₃
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Show terminal carbons (CH₃ groups)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Explicit Hydrogens */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="explicit-hydrogens"
                          checked={showExplicitHydrogens}
                          onCheckedChange={setShowExplicitHydrogens}
                          className="scale-75"
                        />
                        <Label htmlFor="explicit-hydrogens" className="text-xs cursor-pointer">
                          H atoms
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Show all hydrogen atoms explicitly</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Compact Drawing */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="compact-drawing"
                          checked={compactDrawing}
                          onCheckedChange={setCompactDrawing}
                          className="scale-75"
                        />
                        <Label htmlFor="compact-drawing" className="text-xs cursor-pointer">
                          Compact
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Compact drawing mode</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
