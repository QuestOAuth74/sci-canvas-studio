import { Circle, Hexagon, Heart, GitBranch, BarChart3, Microscope, LucideIcon } from 'lucide-react';

export type ReferenceCategory = 
  | 'cell_biology'
  | 'molecular'
  | 'anatomy'
  | 'pathways'
  | 'data_viz'
  | 'microscopy';

export interface ReferenceImage {
  id: string;
  name: string;
  category: ReferenceCategory;
  description: string;
  source?: string;
  tags: string[];
  imagePath: string;
}

export interface ReferenceCategoryConfig {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const referenceCategories: Record<ReferenceCategory, ReferenceCategoryConfig> = {
  cell_biology: { 
    label: 'Cell Biology', 
    icon: Circle, 
    description: 'Cellular structures and organelles' 
  },
  molecular: { 
    label: 'Molecular', 
    icon: Hexagon, 
    description: 'Proteins, DNA, molecular structures' 
  },
  anatomy: { 
    label: 'Anatomy', 
    icon: Heart, 
    description: 'Anatomical illustrations' 
  },
  pathways: { 
    label: 'Pathways', 
    icon: GitBranch, 
    description: 'Signaling and metabolic pathways' 
  },
  data_viz: { 
    label: 'Data Visualization', 
    icon: BarChart3, 
    description: 'Charts, graphs, data figures' 
  },
  microscopy: { 
    label: 'Microscopy', 
    icon: Microscope, 
    description: 'Microscopy-style images' 
  },
};

// Reference images will be dynamically imported
export const referenceLibrary: ReferenceImage[] = [
  // Cell Biology
  {
    id: 'cell-eukaryotic',
    name: 'Eukaryotic Cell Cross-Section',
    category: 'cell_biology',
    description: 'Detailed cross-section of an animal cell showing major organelles including nucleus, mitochondria, ER, and Golgi apparatus.',
    source: 'AI Generated Reference',
    tags: ['cell', 'organelles', 'eukaryotic', 'cross-section'],
    imagePath: '/reference-library/cell-eukaryotic.png',
  },
  {
    id: 'cell-mitochondria',
    name: 'Mitochondria Structure',
    category: 'cell_biology',
    description: 'Internal structure of mitochondria showing cristae, matrix, and double membrane.',
    source: 'AI Generated Reference',
    tags: ['mitochondria', 'organelle', 'energy', 'cristae'],
    imagePath: '/reference-library/cell-mitochondria.png',
  },
  {
    id: 'cell-membrane',
    name: 'Cell Membrane Detail',
    category: 'cell_biology',
    description: 'Lipid bilayer with embedded proteins, channels, and receptors.',
    source: 'AI Generated Reference',
    tags: ['membrane', 'lipid', 'proteins', 'bilayer'],
    imagePath: '/reference-library/cell-membrane.png',
  },
  
  // Molecular
  {
    id: 'mol-dna-helix',
    name: 'DNA Double Helix',
    category: 'molecular',
    description: 'Classic DNA double helix structure showing base pairs and sugar-phosphate backbone.',
    source: 'AI Generated Reference',
    tags: ['DNA', 'helix', 'genetics', 'nucleotides'],
    imagePath: '/reference-library/mol-dna-helix.png',
  },
  {
    id: 'mol-protein',
    name: 'Protein Tertiary Structure',
    category: 'molecular',
    description: 'Ribbon diagram showing alpha helices, beta sheets, and protein folding.',
    source: 'AI Generated Reference',
    tags: ['protein', 'structure', 'ribbon', 'folding'],
    imagePath: '/reference-library/mol-protein.png',
  },
  {
    id: 'mol-enzyme',
    name: 'Enzyme-Substrate Complex',
    category: 'molecular',
    description: 'Enzyme active site with bound substrate showing lock-and-key mechanism.',
    source: 'AI Generated Reference',
    tags: ['enzyme', 'substrate', 'catalysis', 'active site'],
    imagePath: '/reference-library/mol-enzyme.png',
  },
  
  // Anatomy
  {
    id: 'anat-heart',
    name: 'Heart Cross-Section',
    category: 'anatomy',
    description: 'Four-chambered heart showing atria, ventricles, valves, and major vessels.',
    source: 'AI Generated Reference',
    tags: ['heart', 'cardiac', 'chambers', 'vessels'],
    imagePath: '/reference-library/anat-heart.png',
  },
  {
    id: 'anat-neuron',
    name: 'Neuron Structure',
    category: 'anatomy',
    description: 'Complete neuron showing soma, dendrites, axon, myelin sheath, and synaptic terminals.',
    source: 'AI Generated Reference',
    tags: ['neuron', 'brain', 'axon', 'dendrites'],
    imagePath: '/reference-library/anat-neuron.png',
  },
  {
    id: 'anat-muscle',
    name: 'Skeletal Muscle Fiber',
    category: 'anatomy',
    description: 'Muscle fiber structure showing sarcomeres, myofibrils, and striations.',
    source: 'AI Generated Reference',
    tags: ['muscle', 'fiber', 'sarcomere', 'contraction'],
    imagePath: '/reference-library/anat-muscle.png',
  },
  
  // Pathways
  {
    id: 'path-signal',
    name: 'Signal Transduction Pathway',
    category: 'pathways',
    description: 'Receptor-mediated signaling cascade showing kinases and transcription factors.',
    source: 'AI Generated Reference',
    tags: ['signaling', 'cascade', 'kinase', 'receptor'],
    imagePath: '/reference-library/path-signal.png',
  },
  {
    id: 'path-metabolic',
    name: 'Glycolysis Pathway',
    category: 'pathways',
    description: 'Complete glycolysis metabolic pathway with enzymes and intermediates.',
    source: 'AI Generated Reference',
    tags: ['glycolysis', 'metabolism', 'ATP', 'glucose'],
    imagePath: '/reference-library/path-metabolic.png',
  },
  {
    id: 'path-gene',
    name: 'Gene Expression Pathway',
    category: 'pathways',
    description: 'Central dogma showing DNA to RNA to protein with regulatory elements.',
    source: 'AI Generated Reference',
    tags: ['gene', 'expression', 'transcription', 'translation'],
    imagePath: '/reference-library/path-gene.png',
  },
  
  // Data Visualization
  {
    id: 'viz-barchart',
    name: 'Scientific Bar Chart',
    category: 'data_viz',
    description: 'Publication-ready bar chart with error bars and significance markers.',
    source: 'AI Generated Reference',
    tags: ['chart', 'bars', 'statistics', 'error bars'],
    imagePath: '/reference-library/viz-barchart.png',
  },
  {
    id: 'viz-heatmap',
    name: 'Expression Heatmap',
    category: 'data_viz',
    description: 'Gene expression heatmap with hierarchical clustering.',
    source: 'AI Generated Reference',
    tags: ['heatmap', 'expression', 'clustering', 'data'],
    imagePath: '/reference-library/viz-heatmap.png',
  },
  
  // Microscopy
  {
    id: 'micro-fluorescence',
    name: 'Fluorescence Microscopy',
    category: 'microscopy',
    description: 'Fluorescent-labeled cells showing nucleus, cytoskeleton, and organelles.',
    source: 'AI Generated Reference',
    tags: ['fluorescence', 'DAPI', 'cytoskeleton', 'imaging'],
    imagePath: '/reference-library/micro-fluorescence.png',
  },
  {
    id: 'micro-electron',
    name: 'Electron Microscopy',
    category: 'microscopy',
    description: 'TEM-style image of cellular ultrastructure with high detail.',
    source: 'AI Generated Reference',
    tags: ['electron', 'TEM', 'ultrastructure', 'grayscale'],
    imagePath: '/reference-library/micro-electron.png',
  },
];

// Helper to get images by category
export const getImagesByCategory = (category: ReferenceCategory): ReferenceImage[] => {
  return referenceLibrary.filter(img => img.category === category);
};

// Helper to search images by tags or name
export const searchImages = (query: string): ReferenceImage[] => {
  const lowerQuery = query.toLowerCase();
  return referenceLibrary.filter(img => 
    img.name.toLowerCase().includes(lowerQuery) ||
    img.description.toLowerCase().includes(lowerQuery) ||
    img.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
