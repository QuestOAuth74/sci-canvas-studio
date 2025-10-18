export interface PaperSize {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'in';
  description: string;
}

// All sizes converted to pixels at 300 DPI for high-quality scientific publication
export const PAPER_SIZES: PaperSize[] = [
  {
    id: 'custom',
    name: 'Custom',
    width: 1200,
    height: 800,
    unit: 'px',
    description: 'Custom canvas size'
  },
  {
    id: 'a4',
    name: 'A4 (Portrait)',
    width: 2480,
    height: 3508,
    unit: 'px',
    description: '210 × 297 mm - Standard scientific paper'
  },
  {
    id: 'a4-landscape',
    name: 'A4 (Landscape)',
    width: 3508,
    height: 2480,
    unit: 'px',
    description: '297 × 210 mm'
  },
  {
    id: 'letter',
    name: 'Letter (Portrait)',
    width: 2550,
    height: 3300,
    unit: 'px',
    description: '8.5 × 11 in - US standard'
  },
  {
    id: 'letter-landscape',
    name: 'Letter (Landscape)',
    width: 3300,
    height: 2550,
    unit: 'px',
    description: '11 × 8.5 in'
  },
  {
    id: 'a5',
    name: 'A5 (Portrait)',
    width: 1748,
    height: 2480,
    unit: 'px',
    description: '148 × 210 mm'
  },
  {
    id: 'a3',
    name: 'A3 (Portrait)',
    width: 3508,
    height: 4961,
    unit: 'px',
    description: '297 × 420 mm - Large format'
  },
  {
    id: 'slide-169',
    name: 'Presentation Slide (16:9)',
    width: 3840,
    height: 2160,
    unit: 'px',
    description: 'Standard presentation format'
  },
  {
    id: 'slide-43',
    name: 'Presentation Slide (4:3)',
    width: 3000,
    height: 2250,
    unit: 'px',
    description: 'Classic presentation format'
  },
  {
    id: 'poster-a1',
    name: 'Scientific Poster (A1)',
    width: 7016,
    height: 9933,
    unit: 'px',
    description: '594 × 841 mm - Conference poster'
  },
  {
    id: 'poster-a0',
    name: 'Scientific Poster (A0)',
    width: 9933,
    height: 14043,
    unit: 'px',
    description: '841 × 1189 mm - Large poster'
  },
  {
    id: 'square-1024',
    name: 'Square (1024×1024)',
    width: 1024,
    height: 1024,
    unit: 'px',
    description: 'Social media / thumbnails'
  },
  {
    id: 'wide-2560',
    name: 'Wide (2560×1440)',
    width: 2560,
    height: 1440,
    unit: 'px',
    description: 'Wide display format'
  }
];

export const getPaperSize = (id: string): PaperSize => {
  return PAPER_SIZES.find(size => size.id === id) || PAPER_SIZES[0];
};
