export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'flowchart' | 'scientific' | 'business' | 'educational';
  thumbnail: string;
  canvasData: any;
  dimensions: { width: number; height: number };
  paperSize: string;
}

export const TEMPLATES: Template[] = [
  // Scientific Templates
  {
    id: 'western-blot',
    name: 'Western Blot Figure',
    description: 'Basic western blot with lanes, bands, and labels for protein detection',
    category: 'scientific',
    paperSize: 'letter',
    dimensions: { width: 800, height: 600 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmNWY1ZjUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjkwIiB5MT0iNTAiIHgyPSI5MCIgeTI9IjE1MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iMTMwIiB5MT0iNTAiIHgyPSIxMzAiIHkyPSIxNTAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PGxpbmUgeDE9IjE3MCIgeTE9IjUwIiB4Mj0iMTcwIiB5Mj0iMTUwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSIyMTAiIHkxPSI1MCIgeDI9IjIxMCIgeTI9IjE1MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSI2MCIgeT0iNzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI1IiBmaWxsPSIjNDQ0Ii8+PHJlY3QgeD0iMTAwIiB5PSI3MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjUiIGZpbGw9IiM0NDQiLz48cmVjdCB4PSIxNDAiIHk9IjcwIiB3aWR0aD0iMjAiIGhlaWdodD0iNSIgZmlsbD0iIzQ0NCIvPjxyZWN0IHg9IjE4MCIgeT0iNzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI1IiBmaWxsPSIjNDQ0Ii8+PHRleHQgeD0iMTUwIiB5PSIxNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+V2VzdGVybiBCbG90PC90ZXh0Pjwvc3ZnPg==',
    canvasData: {
      version: '6.0.0',
      objects: [
        {
          type: 'rect',
          left: 200,
          top: 150,
          width: 400,
          height: 200,
          fill: '#f5f5f5',
          stroke: '#333333',
          strokeWidth: 2,
        },
        // Lane dividers
        { type: 'line', left: 260, top: 150, x1: 0, y1: 0, x2: 0, y2: 200, stroke: '#666666', strokeWidth: 1 },
        { type: 'line', left: 320, top: 150, x1: 0, y1: 0, x2: 0, y2: 200, stroke: '#666666', strokeWidth: 1 },
        { type: 'line', left: 380, top: 150, x1: 0, y1: 0, x2: 0, y2: 200, stroke: '#666666', strokeWidth: 1 },
        { type: 'line', left: 440, top: 150, x1: 0, y1: 0, x2: 0, y2: 200, stroke: '#666666', strokeWidth: 1 },
        { type: 'line', left: 500, top: 150, x1: 0, y1: 0, x2: 0, y2: 200, stroke: '#666666', strokeWidth: 1 },
        { type: 'line', left: 560, top: 150, x1: 0, y1: 0, x2: 0, y2: 200, stroke: '#666666', strokeWidth: 1 },
        // Bands
        { type: 'rect', left: 210, top: 190, width: 40, height: 8, fill: '#444444' },
        { type: 'rect', left: 270, top: 190, width: 40, height: 8, fill: '#444444' },
        { type: 'rect', left: 330, top: 190, width: 40, height: 8, fill: '#444444' },
        { type: 'rect', left: 390, top: 190, width: 40, height: 8, fill: '#444444' },
        { type: 'rect', left: 450, top: 190, width: 40, height: 8, fill: '#444444' },
        { type: 'rect', left: 510, top: 190, width: 40, height: 8, fill: '#444444' },
        // Labels
        { type: 'textbox', left: 230, top: 120, width: 200, text: 'Target Protein', fontSize: 16, fontFamily: 'Inter' },
        { type: 'textbox', left: 180, top: 360, width: 460, text: 'Lane 1: Control | Lane 2: Treatment A | Lane 3: Treatment B', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
      ],
    },
  },
  {
    id: 'microscopy-panel',
    name: 'Microscopy Panel',
    description: '2x2 image panel layout for microscopy or imaging data',
    category: 'scientific',
    paperSize: 'letter',
    dimensions: { width: 800, height: 600 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI3MCIgZmlsbD0iI2U1ZTVlNSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIxNjAiIHk9IjMwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjZTVlNWU1IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjMwIiB5PSIxMTAiIHdpZHRoPSIxMTAiIGhlaWdodD0iNzAiIGZpbGw9IiNlNWU1ZTUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTYwIiB5PSIxMTAiIHdpZHRoPSIxMTAiIGhlaWdodD0iNzAiIGZpbGw9IiNlNWU1ZTUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iODUiIHk9IjcwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkE8L3RleHQ+PHRleHQgeD0iMjE1IiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CPC90ZXh0Pjx0ZXh0IHg9Ijg1IiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QzwvdGV4dD48dGV4dCB4PSIyMTUiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EPC90ZXh0Pjwvc3ZnPg==',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Top left panel
        { type: 'rect', left: 150, top: 100, width: 180, height: 140, fill: '#e5e5e5', stroke: '#333333', strokeWidth: 2 },
        { type: 'textbox', left: 215, top: 75, width: 50, text: 'A', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        { type: 'textbox', left: 150, top: 250, width: 180, text: 'Control', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        // Top right panel
        { type: 'rect', left: 350, top: 100, width: 180, height: 140, fill: '#e5e5e5', stroke: '#333333', strokeWidth: 2 },
        { type: 'textbox', left: 415, top: 75, width: 50, text: 'B', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        { type: 'textbox', left: 350, top: 250, width: 180, text: 'Treatment', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        // Bottom left panel
        { type: 'rect', left: 150, top: 280, width: 180, height: 140, fill: '#e5e5e5', stroke: '#333333', strokeWidth: 2 },
        { type: 'textbox', left: 215, top: 255, width: 50, text: 'C', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        { type: 'textbox', left: 150, top: 430, width: 180, text: 'Merge', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        // Bottom right panel
        { type: 'rect', left: 350, top: 280, width: 180, height: 140, fill: '#e5e5e5', stroke: '#333333', strokeWidth: 2 },
        { type: 'textbox', left: 415, top: 255, width: 50, text: 'D', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        { type: 'textbox', left: 350, top: 430, width: 180, text: 'Quantification', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
      ],
    },
  },
  {
    id: 'cell-workflow',
    name: 'Cell Culture Workflow',
    description: 'Step-by-step cell culture process with arrows and labels',
    category: 'scientific',
    paperSize: 'letter',
    dimensions: { width: 1000, height: 600 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMTAwIiByPSIyNSIgZmlsbD0iI2U4ZjVlOSIgc3Ryb2tlPSIjNGNhZjUwIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iNzUiIHkxPSIxMDAiIHgyPSIxMTAiIHkyPSIxMDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93KSIvPjxyZWN0IHg9IjExMCIgeT0iNzUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2UzZjJmZCIgc3Ryb2tlPSIjMjE5NmYzIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTcwIiB5MT0iMTAwIiB4Mj0iMjA1IiB5Mj0iMTAwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgbWFya2VyLWVuZD0idXJsKCNhcnJvdykiLz48Y2lyY2xlIGN4PSIyMzAiIGN5PSIxMDAiIHI9IjI1IiBmaWxsPSIjZmZlYmVlIiBzdHJva2U9IiNmZjU3MjIiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwIiB5PSIxNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VlZDwvdGV4dD48dGV4dCB4PSIxNDAiIHk9IjE1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DdWx0dXJlPC90ZXh0Pjx0ZXh0IHg9IjIzMCIgeT0iMTU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFuYWx5c2lzPC90ZXh0PjxkZWZzPjxtYXJrZXIgaWQ9ImFycm93IiBtYXJrZXJXaWR0aD0iMTAiIG1hcmtlckhlaWdodD0iMTAiIHJlZlg9IjUiIHJlZlk9IjMiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTSAwIDAgTCA1IDMgTCAwIDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9tYXJrZXI+PC9kZWZzPjwvc3ZnPg==',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Step 1: Seed
        { type: 'circle', left: 80, top: 240, radius: 50, fill: '#e8f5e9', stroke: '#4caf50', strokeWidth: 3 },
        { type: 'textbox', left: 55, top: 280, width: 50, text: 'Seed\nCells', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
        
        // Arrow 1
        { 
          type: 'group',
          left: 150,
          top: 290,
          subTargetCheck: false,
          objects: [
            { type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, stroke: '#333333', strokeWidth: 3, selectable: false, evented: false },
            { type: 'polygon', points: [{x:100,y:0},{x:90,y:-5},{x:90,y:5}], fill: '#333333', stroke: '#333333', strokeWidth: 1, selectable: false, evented: false }
          ]
        },
        
        // Step 2: Culture
        { type: 'rect', left: 280, top: 240, width: 120, height: 100, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 290, top: 275, width: 100, text: 'Culture\n48-72h', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
        
        // Arrow 2
        { 
          type: 'group',
          left: 420,
          top: 290,
          subTargetCheck: false,
          objects: [
            { type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, stroke: '#333333', strokeWidth: 3, selectable: false, evented: false },
            { type: 'polygon', points: [{x:100,y:0},{x:90,y:-5},{x:90,y:5}], fill: '#333333', stroke: '#333333', strokeWidth: 1, selectable: false, evented: false }
          ]
        },
        
        // Step 3: Analysis
        { type: 'circle', left: 550, top: 240, radius: 50, fill: '#ffebee', stroke: '#ff5722', strokeWidth: 3 },
        { type: 'textbox', left: 525, top: 280, width: 50, text: 'Analysis', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
        
        // Title
        { type: 'textbox', left: 250, top: 150, width: 300, text: 'Cell Culture Workflow', fontSize: 20, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
      ],
    },
  },
  {
    id: 'experimental-timeline',
    name: 'Experimental Timeline',
    description: 'Timeline showing treatment groups and timepoints',
    category: 'scientific',
    paperSize: 'letter',
    dimensions: { width: 1000, height: 600 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxsaW5lIHgxPSIzMCIgeTE9IjEwMCIgeDI9IjI3MCIgeTI9IjEwMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjEwMCIgcj0iOCIgZmlsbD0iIzQzOTZmZiIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEwMCIgcj0iOCIgZmlsbD0iIzQzOTZmZiIvPjxjaXJjbGUgY3g9IjE4MCIgY3k9IjEwMCIgcj0iOCIgZmlsbD0iIzQzOTZmZiIvPjxjaXJjbGUgY3g9IjI0MCIgY3k9IjEwMCIgcj0iOCIgZmlsbD0iIzQzOTZmZiIvPjx0ZXh0IHg9IjYwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGF5IDA8L3RleHQ+PHRleHQgeD0iMTIwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGF5IDM8L3RleHQ+PHRleHQgeD0iMTgwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGF5IDc8L3RleHQ+PHRleHQgeD0iMjQwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGF5IDE0PC90ZXh0Pjwvc3ZnPg==',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Title
        { type: 'textbox', left: 300, top: 120, width: 400, text: 'Experimental Timeline', fontSize: 22, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
        
        // Main timeline
        { type: 'line', left: 100, top: 250, x1: 0, y1: 0, x2: 800, y2: 0, stroke: '#333333', strokeWidth: 4 },
        
        // Timepoints
        { type: 'circle', left: 95, top: 245, radius: 12, fill: '#4396ff', stroke: '#1976d2', strokeWidth: 2 },
        { type: 'textbox', left: 70, top: 270, width: 50, text: 'Day 0\nBaseline', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        { type: 'circle', left: 295, top: 245, radius: 12, fill: '#4396ff', stroke: '#1976d2', strokeWidth: 2 },
        { type: 'textbox', left: 260, top: 270, width: 70, text: 'Day 3\nTreatment', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        { type: 'circle', left: 495, top: 245, radius: 12, fill: '#4396ff', stroke: '#1976d2', strokeWidth: 2 },
        { type: 'textbox', left: 460, top: 270, width: 70, text: 'Day 7\nMid-point', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        { type: 'circle', left: 695, top: 245, radius: 12, fill: '#4396ff', stroke: '#1976d2', strokeWidth: 2 },
        { type: 'textbox', left: 660, top: 270, width: 70, text: 'Day 14\nEndpoint', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        { type: 'circle', left: 895, top: 245, radius: 12, fill: '#4396ff', stroke: '#1976d2', strokeWidth: 2 },
        { type: 'textbox', left: 860, top: 270, width: 70, text: 'Day 21\nFollow-up', fontSize: 12, fontFamily: 'Inter', textAlign: 'center' },
        
        // Notes
        { type: 'textbox', left: 100, top: 350, width: 800, text: 'Add your experimental details, treatment groups, and observations here...', fontSize: 14, fontFamily: 'Inter', fill: '#666666', textAlign: 'left' },
      ],
    },
  },
  
  // Flowchart Templates
  {
    id: 'basic-flowchart',
    name: 'Basic Flowchart',
    description: 'Simple process flowchart with start, decision, and end points',
    category: 'flowchart',
    paperSize: 'letter',
    dimensions: { width: 800, height: 600 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjExMCIgeT0iMjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI2U4ZjVlOSIgc3Ryb2tlPSIjNGNhZjUwIiBzdHJva2Utd2lkdGg9IjIiIHJ4PSIxNSIvPjxsaW5lIHgxPSIxNTAiIHkxPSI1MCIgeDI9IjE1MCIgeTI9IjcwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjExMCIgeT0iNzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI2UzZjJmZCIgc3Ryb2tlPSIjMjE5NmYzIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTUwIiB5MT0iMTAwIiB4Mj0iMTUwIiB5Mj0iMTIwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxwb2x5Z29uIHBvaW50cz0iMTUwLDEyMCAxMjAsMTQ1IDE1MCwxNzAgMTgwLDE0NSIgZmlsbD0iI2ZmZjNlMCIgc3Ryb2tlPSIjZmZiMzAwIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIxNTAiIHk9IjM3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlN0YXJ0PC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iODgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9jZXNzPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGVjaXNpb248L3RleHQ+PC9zdmc+',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Start
        { type: 'rect', left: 350, top: 80, width: 100, height: 50, fill: '#e8f5e9', stroke: '#4caf50', strokeWidth: 2, rx: 25, ry: 25 },
        { type: 'textbox', left: 365, top: 97, width: 70, text: 'Start', fontSize: 16, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
        
        // Arrow down
        { 
          type: 'group',
          left: 400,
          top: 130,
          subTargetCheck: false,
          objects: [
            { type: 'line', x1: 0, y1: 0, x2: 0, y2: 40, stroke: '#333333', strokeWidth: 2, selectable: false, evented: false },
            { type: 'polygon', points: [{x:0,y:40},{x:-5,y:30},{x:5,y:30}], fill: '#333333', stroke: '#333333', strokeWidth: 1, selectable: false, evented: false }
          ]
        },
        
        // Process
        { type: 'rect', left: 350, top: 180, width: 100, height: 50, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 },
        { type: 'textbox', left: 355, top: 195, width: 90, text: 'Process\nStep', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
        
        // Arrow down
        { 
          type: 'group',
          left: 400,
          top: 230,
          subTargetCheck: false,
          objects: [
            { type: 'line', x1: 0, y1: 0, x2: 0, y2: 40, stroke: '#333333', strokeWidth: 2, selectable: false, evented: false },
            { type: 'polygon', points: [{x:0,y:40},{x:-5,y:30},{x:5,y:30}], fill: '#333333', stroke: '#333333', strokeWidth: 1, selectable: false, evented: false }
          ]
        },
        
        // Decision diamond
        { type: 'polygon', left: 400, top: 280, points: [{x:0,y:-40},{x:50,y:0},{x:0,y:40},{x:-50,y:0}], fill: '#fff3e0', stroke: '#ffb300', strokeWidth: 2 },
        { type: 'textbox', left: 365, top: 272, width: 70, text: 'Decision?', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
        
        // Yes arrow (right)
        { 
          type: 'group',
          left: 450,
          top: 280,
          subTargetCheck: false,
          objects: [
            { type: 'line', x1: 0, y1: 0, x2: 60, y2: 0, stroke: '#333333', strokeWidth: 2, selectable: false, evented: false },
            { type: 'polygon', points: [{x:60,y:0},{x:50,y:-5},{x:50,y:5}], fill: '#333333', stroke: '#333333', strokeWidth: 1, selectable: false, evented: false }
          ]
        },
        { type: 'textbox', left: 460, top: 255, width: 30, text: 'Yes', fontSize: 12, fontFamily: 'Inter' },
        
        // Process 2 (right)
        { type: 'rect', left: 520, top: 255, width: 100, height: 50, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 },
        { type: 'textbox', left: 525, top: 270, width: 90, text: 'Action A', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
        
        // No arrow (down)
        { 
          type: 'group',
          left: 400,
          top: 320,
          subTargetCheck: false,
          objects: [
            { type: 'line', x1: 0, y1: 0, x2: 0, y2: 40, stroke: '#333333', strokeWidth: 2, selectable: false, evented: false },
            { type: 'polygon', points: [{x:0,y:40},{x:-5,y:30},{x:5,y:30}], fill: '#333333', stroke: '#333333', strokeWidth: 1, selectable: false, evented: false }
          ]
        },
        { type: 'textbox', left: 405, top: 330, width: 30, text: 'No', fontSize: 12, fontFamily: 'Inter' },
        
        // Process 3 (down)
        { type: 'rect', left: 350, top: 370, width: 100, height: 50, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 },
        { type: 'textbox', left: 355, top: 385, width: 90, text: 'Action B', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
        
        // Arrows to End - combined into single path with arrow
        { 
          type: 'group',
          left: 570,
          top: 305,
          subTargetCheck: false,
          objects: [
            { type: 'line', x1: 0, y1: 0, x2: 0, y2: 135, stroke: '#333333', strokeWidth: 2, selectable: false, evented: false },
            { type: 'polygon', points: [{x:0,y:135},{x:-5,y:125},{x:5,y:125}], fill: '#333333', stroke: '#333333', strokeWidth: 1, selectable: false, evented: false }
          ]
        },
        { type: 'line', left: 400, top: 420, x1: 0, y1: 0, x2: 170, y2: 0, stroke: '#333333', strokeWidth: 2 },
        
        // End
        { type: 'rect', left: 520, top: 450, width: 100, height: 50, fill: '#ffebee', stroke: '#f44336', strokeWidth: 2, rx: 25, ry: 25 },
        { type: 'textbox', left: 535, top: 467, width: 70, text: 'End', fontSize: 16, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
      ],
    },
  },
  {
    id: 'swim-lane',
    name: 'Swim Lane Diagram',
    description: 'Cross-functional process flow with department lanes',
    category: 'flowchart',
    paperSize: 'letter',
    dimensions: { width: 1000, height: 700 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSIyMCIgeT0iNzAiIHdpZHRoPSIyNjAiIGhlaWdodD0iNTAiIGZpbGw9IiNmOWY5ZjkiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PHJlY3QgeD0iMjAiIHk9IjEyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSI0MCIgeT0iMzUiIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2UzZjJmZCIgc3Ryb2tlPSIjMjE5NmYzIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSIxMjAiIHk9Ijg1IiB3aWR0aD0iNTAiIGhlaWdodD0iMjAiIGZpbGw9IiNlM2YyZmQiIHN0cm9rZT0iIzIxOTZmMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PHJlY3QgeD0iMjAwIiB5PSIxMzUiIHdpZHRoPSI1MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2UzZjJmZCIgc3Ryb2tlPSIjMjE5NmYzIiBzdHJva2Utd2lkdGg9IjEiLz48dGV4dCB4PSI4MCIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+RGVwdCBBPC90ZXh0Pjx0ZXh0IHg9IjE0NSIgeT0iNjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+RGVwdCBCPC90ZXh0Pjx0ZXh0IHg9IjIyNSIgeT0iMTE4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkRlcHQgQzwvdGV4dD48L3N2Zz4=',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Lane backgrounds
        { type: 'rect', left: 50, top: 100, width: 900, height: 120, fill: '#f5f5f5', stroke: '#999999', strokeWidth: 1 },
        { type: 'rect', left: 50, top: 220, width: 900, height: 120, fill: '#fafafa', stroke: '#999999', strokeWidth: 1 },
        { type: 'rect', left: 50, top: 340, width: 900, height: 120, fill: '#f5f5f5', stroke: '#999999', strokeWidth: 1 },
        
        // Lane labels
        { type: 'textbox', left: 60, top: 140, width: 140, text: 'Department A', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', fill: '#555555' },
        { type: 'textbox', left: 60, top: 260, width: 140, text: 'Department B', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', fill: '#555555' },
        { type: 'textbox', left: 60, top: 380, width: 140, text: 'Department C', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', fill: '#555555' },
        
        // Process boxes in lanes
        { type: 'rect', left: 250, top: 130, width: 120, height: 60, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 },
        { type: 'textbox', left: 260, top: 150, width: 100, text: 'Task 1', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
        
        { type: 'rect', left: 500, top: 250, width: 120, height: 60, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 },
        { type: 'textbox', left: 510, top: 270, width: 100, text: 'Task 2', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
        
        { type: 'rect', left: 750, top: 370, width: 120, height: 60, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 },
        { type: 'textbox', left: 760, top: 390, width: 100, text: 'Task 3', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' },
        
        // Connecting arrows
        { type: 'line', left: 370, top: 160, x1: 0, y1: 0, x2: 80, y2: 90, stroke: '#333333', strokeWidth: 2 },
        { type: 'polygon', left: 445, top: 245, points: [{x:0,y:0},{x:-8,y:-5},{x:-5,y:-8}], fill: '#333333' },
        
        { type: 'line', left: 620, top: 280, x1: 0, y1: 0, x2: 80, y2: 90, stroke: '#333333', strokeWidth: 2 },
        { type: 'polygon', left: 695, top: 365, points: [{x:0,y:0},{x:-8,y:-5},{x:-5,y:-8}], fill: '#333333' },
        
        // Title
        { type: 'textbox', left: 300, top: 50, width: 400, text: 'Cross-Functional Process Flow', fontSize: 20, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
      ],
    },
  },
  
  // Business Templates
  {
    id: 'swot-analysis',
    name: 'SWOT Analysis',
    description: '2x2 grid for Strengths, Weaknesses, Opportunities, Threats',
    category: 'business',
    paperSize: 'letter',
    dimensions: { width: 800, height: 600 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjMwIiB5PSI0MCIgd2lkdGg9IjExNSIgaGVpZ2h0PSI3MCIgZmlsbD0iI2U4ZjVlOSIgc3Ryb2tlPSIjNGNhZjUwIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIxNTUiIHk9IjQwIiB3aWR0aD0iMTE1IiBoZWlnaHQ9IjcwIiBmaWxsPSIjZmZlYmVlIiBzdHJva2U9IiNmNDQzMzYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjMwIiB5PSIxMjAiIHdpZHRoPSIxMTUiIGhlaWdodD0iNzAiIGZpbGw9IiNlM2YyZmQiIHN0cm9rZT0iIzIxOTZmMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTU1IiB5PSIxMjAiIHdpZHRoPSIxMTUiIGhlaWdodD0iNzAiIGZpbGw9IiNmZmYzZTAiIHN0cm9rZT0iI2ZmYjMwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iODciIHk9IjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTEiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdHJlbmd0aHM8L3RleHQ+PHRleHQgeD0iMjEyIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjExIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+V2Vha25lc3NlczwvdGV4dD48dGV4dCB4PSI4NyIgeT0iMTE1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTEiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5PcHBvcnR1bml0aWVzPC90ZXh0Pjx0ZXh0IHg9IjIxMiIgeT0iMTE1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTEiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UaHJlYXRzPC90ZXh0Pjwvc3ZnPg==',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Title
        { type: 'textbox', left: 250, top: 80, width: 300, text: 'SWOT Analysis', fontSize: 24, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
        
        // Strengths (top left)
        { type: 'rect', left: 150, top: 150, width: 280, height: 180, fill: '#e8f5e9', stroke: '#4caf50', strokeWidth: 3 },
        { type: 'textbox', left: 160, top: 160, width: 260, text: 'STRENGTHS', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#2e7d32' },
        { type: 'textbox', left: 160, top: 195, width: 260, text: '• Internal positive factors\n• Core competencies\n• Competitive advantages\n• Resources & assets', fontSize: 13, fontFamily: 'Inter', fill: '#333333' },
        
        // Weaknesses (top right)
        { type: 'rect', left: 450, top: 150, width: 280, height: 180, fill: '#ffebee', stroke: '#f44336', strokeWidth: 3 },
        { type: 'textbox', left: 460, top: 160, width: 260, text: 'WEAKNESSES', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#c62828' },
        { type: 'textbox', left: 460, top: 195, width: 260, text: '• Internal limitations\n• Areas needing improvement\n• Resource constraints\n• Disadvantages', fontSize: 13, fontFamily: 'Inter', fill: '#333333' },
        
        // Opportunities (bottom left)
        { type: 'rect', left: 150, top: 350, width: 280, height: 180, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 3 },
        { type: 'textbox', left: 160, top: 360, width: 260, text: 'OPPORTUNITIES', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1565c0' },
        { type: 'textbox', left: 160, top: 395, width: 260, text: '• External positive factors\n• Market trends\n• Growth potential\n• Partnerships', fontSize: 13, fontFamily: 'Inter', fill: '#333333' },
        
        // Threats (bottom right)
        { type: 'rect', left: 450, top: 350, width: 280, height: 180, fill: '#fff3e0', stroke: '#ffb300', strokeWidth: 3 },
        { type: 'textbox', left: 460, top: 360, width: 260, text: 'THREATS', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#e65100' },
        { type: 'textbox', left: 460, top: 395, width: 260, text: '• External challenges\n• Market competition\n• Regulatory changes\n• Economic factors', fontSize: 13, fontFamily: 'Inter', fill: '#333333' },
      ],
    },
  },
  {
    id: 'venn-diagram',
    name: 'Venn Diagram',
    description: 'Two or three overlapping circles for comparison',
    category: 'business',
    paperSize: 'letter',
    dimensions: { width: 800, height: 600 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjExMCIgY3k9IjEwMCIgcj0iNTUiIGZpbGw9IiNlM2YyZmQiIGZpbGwtb3BhY2l0eT0iMC42IiBzdHJva2U9IiMyMTk2ZjMiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjE5MCIgY3k9IjEwMCIgcj0iNTUiIGZpbGw9IiNmM2U1ZjUiIGZpbGwtb3BhY2l0eT0iMC42IiBzdHJva2U9IiM5YzI3YjAiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9Ijg1IiB5PSI5MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCI+U2V0IEE8L3RleHQ+PHRleHQgeD0iMTkwIiB5PSI5MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCI+U2V0IEI8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Cb3RoPC90ZXh0Pjwvc3ZnPg==',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Title
        { type: 'textbox', left: 250, top: 80, width: 300, text: 'Venn Diagram Comparison', fontSize: 22, fontFamily: 'Inter', textAlign: 'center', fontWeight: 'bold' },
        
        // Left circle
        { type: 'circle', left: 200, top: 180, radius: 120, fill: '#e3f2fd', fillOpacity: 0.6, stroke: '#2196f3', strokeWidth: 3 },
        { type: 'textbox', left: 230, top: 200, width: 80, text: 'Category A', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        { type: 'textbox', left: 215, top: 230, width: 110, text: '• Feature 1\n• Feature 2\n• Feature 3', fontSize: 13, fontFamily: 'Inter' },
        
        // Right circle
        { type: 'circle', left: 380, top: 180, radius: 120, fill: '#f3e5f5', fillOpacity: 0.6, stroke: '#9c27b0', strokeWidth: 3 },
        { type: 'textbox', left: 470, top: 200, width: 80, text: 'Category B', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        { type: 'textbox', left: 455, top: 230, width: 110, text: '• Feature 4\n• Feature 5\n• Feature 6', fontSize: 13, fontFamily: 'Inter' },
        
        // Overlap label
        { type: 'textbox', left: 350, top: 265, width: 100, text: 'Common\nFeatures', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#6a1b9a' },
      ],
    },
  },
  
  // Educational Templates
  {
    id: 'mind-map',
    name: 'Mind Map',
    description: 'Central idea with branching concepts and sub-topics',
    category: 'educational',
    paperSize: 'letter',
    dimensions: { width: 1000, height: 700 },
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNmZmYzZTAiIHN0cm9rZT0iI2ZmYjMwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+PGxpbmUgeDE9IjE4MCIgeTE9IjEwMCIgeDI9IjI0MCIgeTI9IjYwIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjI0MCIgY3k9IjYwIiByPSIxOCIgZmlsbD0iI2UzZjJmZCIgc3Ryb2tlPSIjMjE5NmYzIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTgwIiB5MT0iMTAwIiB4Mj0iMjQwIiB5Mj0iMTQwIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjI0MCIgY3k9IjE0MCIgcj0iMTgiIGZpbGw9IiNlM2YyZmQiIHN0cm9rZT0iIzIxOTZmMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjEyMCIgeTE9IjEwMCIgeDI9IjYwIiB5Mj0iNjAiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iMTgiIGZpbGw9IiNlOGY1ZTkiIHN0cm9rZT0iIzRjYWY1MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTUwIiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPkNlbnRlcjwvdGV4dD48L3N2Zz4=',
    canvasData: {
      version: '6.0.0',
      objects: [
        // Central node
        { type: 'circle', left: 450, top: 300, radius: 60, fill: '#fff3e0', stroke: '#ffb300', strokeWidth: 4 },
        { type: 'textbox', left: 425, top: 350, width: 90, text: 'Main\nTopic', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        
        // Branch 1 (top)
        { type: 'line', left: 500, top: 260, x1: 0, y1: 0, x2: 0, y2: -80, stroke: '#666666', strokeWidth: 3 },
        { type: 'circle', left: 470, top: 120, radius: 40, fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 3 },
        { type: 'textbox', left: 455, top: 150, width: 70, text: 'Idea 1', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        
        // Branch 2 (right)
        { type: 'line', left: 570, top: 350, x1: 0, y1: 0, x2: 120, y2: 0, stroke: '#666666', strokeWidth: 3 },
        { type: 'circle', left: 690, top: 320, radius: 40, fill: '#f3e5f5', stroke: '#9c27b0', strokeWidth: 3 },
        { type: 'textbox', left: 675, top: 350, width: 70, text: 'Idea 2', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        
        // Branch 3 (bottom)
        { type: 'line', left: 500, top: 420, x1: 0, y1: 0, x2: 0, y2: 80, stroke: '#666666', strokeWidth: 3 },
        { type: 'circle', left: 470, top: 500, radius: 40, fill: '#e8f5e9', stroke: '#4caf50', strokeWidth: 3 },
        { type: 'textbox', left: 455, top: 530, width: 70, text: 'Idea 3', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        
        // Branch 4 (left)
        { type: 'line', left: 350, top: 350, x1: 0, y1: 0, x2: -120, y2: 0, stroke: '#666666', strokeWidth: 3 },
        { type: 'circle', left: 190, top: 320, radius: 40, fill: '#ffebee', stroke: '#f44336', strokeWidth: 3 },
        { type: 'textbox', left: 175, top: 350, width: 70, text: 'Idea 4', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center' },
        
        // Sub-branches
        { type: 'line', left: 530, top: 140, x1: 0, y1: 0, x2: 60, y2: -30, stroke: '#999999', strokeWidth: 2 },
        { type: 'circle', left: 580, top: 80, radius: 25, fill: '#e1f5fe', stroke: '#2196f3', strokeWidth: 2 },
        { type: 'textbox', left: 570, top: 100, width: 40, text: 'Sub', fontSize: 11, fontFamily: 'Inter', textAlign: 'center' },
        
        { type: 'line', left: 750, top: 350, x1: 0, y1: 0, x2: 50, y2: 30, stroke: '#999999', strokeWidth: 2 },
        { type: 'circle', left: 790, top: 370, radius: 25, fill: '#f3e5f5', stroke: '#9c27b0', strokeWidth: 2 },
        { type: 'textbox', left: 780, top: 390, width: 40, text: 'Sub', fontSize: 11, fontFamily: 'Inter', textAlign: 'center' },
      ],
    },
  },
  {
    id: "consort-flow-diagram",
    name: "Flow Chart for Study",
    description: "CONSORT 2010 Flow Diagram for reporting clinical trial participant flow",
    category: "flowchart",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjIwIiB5PSIxMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2I3ZDRmNCIgc3Ryb2tlPSIjMDAzZDdhIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSI3NSIgeT0iNDAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMjUiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PHJlY3QgeD0iMjAiIHk9Ijc1IiB3aWR0aD0iMjYwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjYjdkNGY0IiBzdHJva2U9IiMwMDNkN2EiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjIwIiB5PSIxMDUiIHdpZHRoPSIxMTAiIGhlaWdodD0iMjUiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PHJlY3QgeD0iMTcwIiB5PSIxMDUiIHdpZHRoPSIxMTAiIGhlaWdodD0iMjUiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PHJlY3QgeD0iMjAiIHk9IjE0MCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2I3ZDRmNCIgc3Ryb2tlPSIjMDAzZDdhIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSIyMCIgeT0iMTcwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjE3MCIgeT0iMTcwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==",
    canvasData: {
      version: "6.0.0",
      objects: [
        // Header
        {
          type: "textbox",
          left: 400,
          top: 30,
          width: 600,
          fontSize: 20,
          fontWeight: "bold",
          text: "CONSORT 2010 Flow Diagram",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "center",
          originX: "center",
          originY: "top",
        },
        
        // ENROLLMENT Section
        {
          type: "rect",
          left: 100,
          top: 80,
          width: 600,
          height: 35,
          fill: "#b7d4f4",
          stroke: "#003d7a",
          strokeWidth: 2,
          rx: 3,
          ry: 3,
        },
        {
          type: "textbox",
          left: 400,
          top: 88,
          width: 580,
          fontSize: 14,
          fontWeight: "bold",
          text: "Enrollment",
          fill: "#003d7a",
          fontFamily: "Inter",
          textAlign: "center",
          originX: "center",
          originY: "top",
        },
        
        // Assessed for eligibility
        {
          type: "rect",
          left: 250,
          top: 130,
          width: 300,
          height: 50,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 260,
          top: 145,
          width: 280,
          fontSize: 12,
          text: "Assessed for eligibility (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "center",
        },
        
        // Arrow down
        {
          type: "group",
          left: 400,
          top: 180,
          subTargetCheck: false,
          objects: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 30,
              stroke: "#000000",
              strokeWidth: 2,
              selectable: false,
              evented: false,
            },
            {
              type: "polygon",
              points: [{ x: 0, y: 30 }, { x: -5, y: 22 }, { x: 5, y: 22 }],
              fill: "#000000",
              stroke: "#000000",
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          ],
        },
        
        // Excluded box
        {
          type: "rect",
          left: 580,
          top: 220,
          width: 200,
          height: 110,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 590,
          top: 228,
          width: 180,
          fontSize: 11,
          text: "Excluded (n= )\n• Not meeting inclusion criteria (n= )\n• Declined to participate (n= )\n• Other reasons (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "left",
        },
        
        // Randomized box
        {
          type: "rect",
          left: 250,
          top: 220,
          width: 300,
          height: 50,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 260,
          top: 235,
          width: 280,
          fontSize: 12,
          text: "Randomized (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "center",
        },
        
        // Arrow from randomized down
        {
          type: "group",
          left: 400,
          top: 270,
          subTargetCheck: false,
          objects: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 30,
              stroke: "#000000",
              strokeWidth: 2,
              selectable: false,
              evented: false,
            },
            {
              type: "polygon",
              points: [{ x: 0, y: 30 }, { x: -5, y: 22 }, { x: 5, y: 22 }],
              fill: "#000000",
              stroke: "#000000",
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          ],
        },
        
        // ALLOCATION Section
        {
          type: "rect",
          left: 100,
          top: 310,
          width: 600,
          height: 35,
          fill: "#b7d4f4",
          stroke: "#003d7a",
          strokeWidth: 2,
          rx: 3,
          ry: 3,
        },
        {
          type: "textbox",
          left: 400,
          top: 318,
          width: 580,
          fontSize: 14,
          fontWeight: "bold",
          text: "Allocation",
          fill: "#003d7a",
          fontFamily: "Inter",
          textAlign: "center",
          originX: "center",
          originY: "top",
        },
        
        // Split arrows down
        {
          type: "line",
          left: 400,
          top: 345,
          x1: 0,
          y1: 0,
          x2: -150,
          y2: 20,
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "line",
          left: 400,
          top: 345,
          x1: 0,
          y1: 0,
          x2: 150,
          y2: 20,
          stroke: "#000000",
          strokeWidth: 2,
        },
        
        // Left branch - Allocated to intervention
        {
          type: "rect",
          left: 100,
          top: 370,
          width: 250,
          height: 60,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 110,
          top: 378,
          width: 230,
          fontSize: 11,
          text: "Allocated to intervention (n= )\n• Received allocated intervention (n= )\n• Did not receive allocated intervention (give reasons) (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "left",
        },
        
        // Right branch - Allocated to comparison
        {
          type: "rect",
          left: 450,
          top: 370,
          width: 250,
          height: 60,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 460,
          top: 378,
          width: 230,
          fontSize: 11,
          text: "Allocated to comparison (n= )\n• Received allocated intervention (n= )\n• Did not receive allocated intervention (give reasons) (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "left",
        },
        
        // Arrows down from allocation
        {
          type: "group",
          left: 225,
          top: 430,
          subTargetCheck: false,
          objects: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 30,
              stroke: "#000000",
              strokeWidth: 2,
              selectable: false,
              evented: false,
            },
            {
              type: "polygon",
              points: [{ x: 0, y: 30 }, { x: -5, y: 22 }, { x: 5, y: 22 }],
              fill: "#000000",
              stroke: "#000000",
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          ],
        },
        {
          type: "group",
          left: 575,
          top: 430,
          subTargetCheck: false,
          objects: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 30,
              stroke: "#000000",
              strokeWidth: 2,
              selectable: false,
              evented: false,
            },
            {
              type: "polygon",
              points: [{ x: 0, y: 30 }, { x: -5, y: 22 }, { x: 5, y: 22 }],
              fill: "#000000",
              stroke: "#000000",
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          ],
        },
        
        // FOLLOW-UP Section
        {
          type: "rect",
          left: 100,
          top: 470,
          width: 600,
          height: 35,
          fill: "#b7d4f4",
          stroke: "#003d7a",
          strokeWidth: 2,
          rx: 3,
          ry: 3,
        },
        {
          type: "textbox",
          left: 400,
          top: 478,
          width: 580,
          fontSize: 14,
          fontWeight: "bold",
          text: "Follow-Up",
          fill: "#003d7a",
          fontFamily: "Inter",
          textAlign: "center",
          originX: "center",
          originY: "top",
        },
        
        // Left follow-up
        {
          type: "rect",
          left: 100,
          top: 520,
          width: 250,
          height: 60,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 110,
          top: 528,
          width: 230,
          fontSize: 11,
          text: "Lost to follow-up (give reasons) (n= )\nDiscontinued intervention (give reasons) (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "left",
        },
        
        // Right follow-up
        {
          type: "rect",
          left: 450,
          top: 520,
          width: 250,
          height: 60,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 460,
          top: 528,
          width: 230,
          fontSize: 11,
          text: "Lost to follow-up (give reasons) (n= )\nDiscontinued intervention (give reasons) (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "left",
        },
        
        // Arrows down from follow-up
        {
          type: "group",
          left: 225,
          top: 580,
          subTargetCheck: false,
          objects: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 30,
              stroke: "#000000",
              strokeWidth: 2,
              selectable: false,
              evented: false,
            },
            {
              type: "polygon",
              points: [{ x: 0, y: 30 }, { x: -5, y: 22 }, { x: 5, y: 22 }],
              fill: "#000000",
              stroke: "#000000",
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          ],
        },
        {
          type: "group",
          left: 575,
          top: 580,
          subTargetCheck: false,
          objects: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 30,
              stroke: "#000000",
              strokeWidth: 2,
              selectable: false,
              evented: false,
            },
            {
              type: "polygon",
              points: [{ x: 0, y: 30 }, { x: -5, y: 22 }, { x: 5, y: 22 }],
              fill: "#000000",
              stroke: "#000000",
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          ],
        },
        
        // ANALYSIS Section
        {
          type: "rect",
          left: 100,
          top: 620,
          width: 600,
          height: 35,
          fill: "#b7d4f4",
          stroke: "#003d7a",
          strokeWidth: 2,
          rx: 3,
          ry: 3,
        },
        {
          type: "textbox",
          left: 400,
          top: 628,
          width: 580,
          fontSize: 14,
          fontWeight: "bold",
          text: "Analysis",
          fill: "#003d7a",
          fontFamily: "Inter",
          textAlign: "center",
          originX: "center",
          originY: "top",
        },
        
        // Left analysis
        {
          type: "rect",
          left: 100,
          top: 670,
          width: 250,
          height: 60,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 110,
          top: 678,
          width: 230,
          fontSize: 11,
          text: "Analysed (n= )\n• Excluded from analysis (give reasons) (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "left",
        },
        
        // Right analysis
        {
          type: "rect",
          left: 450,
          top: 670,
          width: 250,
          height: 60,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "textbox",
          left: 460,
          top: 678,
          width: 230,
          fontSize: 11,
          text: "Analysed (n= )\n• Excluded from analysis (give reasons) (n= )",
          fill: "#000000",
          fontFamily: "Inter",
          textAlign: "left",
        },
      ],
      background: "#ffffff",
    },
    dimensions: { width: 800, height: 800 },
    paperSize: "letter",
  },
];
