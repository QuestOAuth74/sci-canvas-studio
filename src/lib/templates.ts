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
  {
    id: "western-blot",
    name: "Western Blot",
    description: "Standard Western blot layout for protein analysis",
    category: "scientific",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjIyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjYwIiB5PSI2MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTBlN2ZmIi8+PHJlY3QgeD0iMTAwIiB5PSI2MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTBlN2ZmIi8+PHJlY3QgeD0iMTQwIiB5PSI2MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTBlN2ZmIi8+PHJlY3QgeD0iMTgwIiB5PSI2MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTBlN2ZmIi8+PC9zdmc+",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'rect', left: 100, top: 50, width: 600, height: 400, fill: '#ffffff', stroke: '#3B82F6', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 120, top: 70, width: 560, text: 'Western Blot Analysis', fontSize: 20, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b' },
        { type: 'line', left: 120, top: 110, x1: 0, y1: 0, x2: 560, y2: 0, stroke: '#cbd5e1', strokeWidth: 2 },
        
        { type: 'rect', left: 150, top: 140, width: 80, height: 250, fill: '#EEF2FF', stroke: '#6366F1', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 160, top: 400, width: 60, text: 'Lane 1', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 250, top: 140, width: 80, height: 250, fill: '#EEF2FF', stroke: '#6366F1', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 260, top: 400, width: 60, text: 'Lane 2', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 350, top: 140, width: 80, height: 250, fill: '#EEF2FF', stroke: '#6366F1', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 360, top: 400, width: 60, text: 'Lane 3', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 450, top: 140, width: 80, height: 250, fill: '#EEF2FF', stroke: '#6366F1', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 460, top: 400, width: 60, text: 'Lane 4', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 550, top: 140, width: 80, height: 250, fill: '#EEF2FF', stroke: '#6366F1', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 560, top: 400, width: 60, text: 'Lane 5', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 165, top: 200, width: 50, height: 12, fill: '#4F46E5', rx: 2, ry: 2 },
        { type: 'rect', left: 265, top: 200, width: 50, height: 12, fill: '#4F46E5', rx: 2, ry: 2 },
        { type: 'rect', left: 365, top: 200, width: 50, height: 12, fill: '#4F46E5', rx: 2, ry: 2 },
        { type: 'rect', left: 465, top: 200, width: 50, height: 12, fill: '#4F46E5', rx: 2, ry: 2 },
        { type: 'rect', left: 565, top: 200, width: 50, height: 12, fill: '#4F46E5', rx: 2, ry: 2 },
        
        { type: 'textbox', left: 70, top: 195, width: 60, text: '55 kDa', fontSize: 12, fontFamily: 'Inter', textAlign: 'right', fill: '#64748b' },
      ]
    },
    dimensions: { width: 800, height: 500 },
    paperSize: "letter",
  },
  {
    id: "microscopy-panel",
    name: "Microscopy Panel",
    description: "Multi-panel layout for microscopy images",
    category: "scientific",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTYwIiB5PSIyMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMjAiIHk9IjEyMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTYwIiB5PSIxMjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'textbox', left: 300, top: 30, width: 200, text: 'Microscopy Analysis', fontSize: 22, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b', textAlign: 'center' },
        
        { type: 'rect', left: 100, top: 80, width: 300, height: 250, fill: '#F8FAFC', stroke: '#06B6D4', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 120, top: 100, width: 260, text: 'A', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold', fill: '#06B6D4' },
        { type: 'textbox', left: 120, top: 290, width: 260, text: 'DAPI', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 450, top: 80, width: 300, height: 250, fill: '#F8FAFC', stroke: '#06B6D4', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 470, top: 100, width: 260, text: 'B', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold', fill: '#06B6D4' },
        { type: 'textbox', left: 470, top: 290, width: 260, text: 'GFP', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 100, top: 380, width: 300, height: 250, fill: '#F8FAFC', stroke: '#06B6D4', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 120, top: 400, width: 260, text: 'C', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold', fill: '#06B6D4' },
        { type: 'textbox', left: 120, top: 590, width: 260, text: 'RFP', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'rect', left: 450, top: 380, width: 300, height: 250, fill: '#F8FAFC', stroke: '#06B6D4', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 470, top: 400, width: 260, text: 'D', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold', fill: '#06B6D4' },
        { type: 'textbox', left: 470, top: 590, width: 260, text: 'Merge', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#475569' },
        
        { type: 'textbox', left: 100, top: 660, width: 650, text: 'Scale bar: 50 μm', fontSize: 12, fontFamily: 'Inter', fill: '#64748b', textAlign: 'center' },
      ]
    },
    dimensions: { width: 800, height: 720 },
    paperSize: "letter",
  },
  {
    id: "cell-workflow",
    name: "Cell Workflow",
    description: "Cellular process workflow diagram",
    category: "scientific",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iMTAwIiByPSIzMCIgZmlsbD0iI2UwZTdmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iOTAiIHkxPSIxMDAiIHgyPSIxMzAiIHkyPSIxMDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTYwIiBjeT0iMTAwIiByPSIzMCIgZmlsbD0iI2UwZTdmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTkwIiB5MT0iMTAwIiB4Mj0iMjMwIiB5Mj0iMTAwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjI2MCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNlMGU3ZmYiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'textbox', left: 250, top: 30, width: 300, text: 'Cell Signaling Pathway', fontSize: 22, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b', textAlign: 'center' },
        
        { type: 'rect', left: 100, top: 100, width: 140, height: 100, fill: '#DBEAFE', stroke: '#3B82F6', strokeWidth: 3, rx: 50, ry: 50 },
        { type: 'textbox', left: 120, top: 130, width: 100, text: 'Receptor', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e40af' },
        
        {
          type: 'group',
          left: 240,
          top: 125,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 80, y2: 0, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: 80, top: -6, points: [{x:0,y:0},{x:-12,y:-6},{x:-12,y:6}], fill: '#475569' }
          ]
        },
        
        { type: 'rect', left: 330, top: 100, width: 140, height: 100, fill: '#FEF3C7', stroke: '#F59E0B', strokeWidth: 3, rx: 50, ry: 50 },
        { type: 'textbox', left: 350, top: 130, width: 100, text: 'Kinase', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#92400e' },
        
        {
          type: 'group',
          left: 470,
          top: 125,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 80, y2: 0, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: 80, top: -6, points: [{x:0,y:0},{x:-12,y:-6},{x:-12,y:6}], fill: '#475569' }
          ]
        },
        
        { type: 'rect', left: 560, top: 100, width: 140, height: 100, fill: '#D1FAE5', stroke: '#10B981', strokeWidth: 3, rx: 50, ry: 50 },
        { type: 'textbox', left: 580, top: 120, width: 100, text: 'Transcription Factor', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#065f46' },
        
        {
          type: 'group',
          left: 620,
          top: 200,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 80, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: -6, top: 80, points: [{x:0,y:0},{x:-6,y:-12},{x:6,y:-12}], fill: '#475569' }
          ]
        },
        
        { type: 'rect', left: 560, top: 290, width: 140, height: 100, fill: '#FCE7F3', stroke: '#EC4899', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 580, top: 320, width: 100, text: 'Gene Expression', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#9f1239' },
      ]
    },
    dimensions: { width: 800, height: 450 },
    paperSize: "letter",
  },
  {
    id: "experimental-timeline",
    name: "Experimental Timeline",
    description: "Timeline for experimental procedures",
    category: "scientific",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxsaW5lIHgxPSIyMCIgeTE9IjEwMCIgeDI9IjI4MCIgeTI9IjEwMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjEwMCIgcj0iMTAiIGZpbGw9IiM0Mjg1RjQiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMDAiIHI9IjEwIiBmaWxsPSIjNDI4NUY0Ii8+PGNpcmNsZSBjeD0iMjQwIiBjeT0iMTAwIiByPSIxMCIgZmlsbD0iIzQyODVGNCIvPjwvc3ZnPg==",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'textbox', left: 250, top: 30, width: 300, text: 'Experiment Timeline', fontSize: 22, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b', textAlign: 'center' },
        
        { type: 'line', left: 100, top: 150, x1: 0, y1: 0, x2: 600, y2: 0, stroke: '#64748b', strokeWidth: 4 },
        
        { type: 'circle', left: 95, top: 145, radius: 12, fill: '#3B82F6', stroke: '#1e40af', strokeWidth: 2 },
        { type: 'textbox', left: 70, top: 180, width: 80, text: 'Day 0\nStart', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b', fontWeight: 'bold' },
        
        { type: 'circle', left: 245, top: 145, radius: 12, fill: '#F59E0B', stroke: '#d97706', strokeWidth: 2 },
        { type: 'textbox', left: 205, top: 180, width: 100, text: 'Day 3\nTreatment', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b', fontWeight: 'bold' },
        
        { type: 'circle', left: 395, top: 145, radius: 12, fill: '#10B981', stroke: '#059669', strokeWidth: 2 },
        { type: 'textbox', left: 360, top: 180, width: 90, text: 'Day 7\nAnalysis', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b', fontWeight: 'bold' },
        
        { type: 'circle', left: 545, top: 145, radius: 12, fill: '#8B5CF6', stroke: '#7c3aed', strokeWidth: 2 },
        { type: 'textbox', left: 515, top: 180, width: 80, text: 'Day 14\nResults', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b', fontWeight: 'bold' },
        
        { type: 'circle', left: 695, top: 145, radius: 12, fill: '#EC4899', stroke: '#db2777', strokeWidth: 2 },
        { type: 'textbox', left: 650, top: 180, width: 110, text: 'Day 21\nPublication', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b', fontWeight: 'bold' },
      ]
    },
    dimensions: { width: 800, height: 280 },
    paperSize: "letter",
  },
  {
    id: "basic-flowchart",
    name: "Basic Flowchart",
    description: "Simple flowchart with decision points",
    category: "flowchart",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxyZWN0IHg9IjEwMCIgeT0iMjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlMGU3ZmYiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iNSIvPjxwb2x5Z29uIHBvaW50cz0iMTUwLDgwIDIwMCwxMTAgMTUwLDE0MCAxMDAsMTEwIiBmaWxsPSIjZmZlMGUwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjEwMCIgeT0iMTYwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZTBlN2ZmIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgcng9IjUiLz48L3N2Zz4=",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'rect', left: 300, top: 50, width: 200, height: 80, fill: '#DBEAFE', stroke: '#3B82F6', strokeWidth: 3, rx: 40, ry: 40 },
        { type: 'textbox', left: 320, top: 70, width: 160, text: 'Start', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 390,
          top: 130,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 50, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: -6, top: 50, points: [{x:0,y:0},{x:-6,y:-12},{x:6,y:-12}], fill: '#475569' }
          ]
        },
        
        { type: 'polygon', left: 300, top: 190, points: [{x:100,y:0},{x:200,y:50},{x:100,y:100},{x:0,y:50}], fill: '#FEF3C7', stroke: '#F59E0B', strokeWidth: 3 },
        { type: 'textbox', left: 330, top: 220, width: 140, text: 'Decision?', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 500,
          top: 230,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 100, y2: 0, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: 100, top: -6, points: [{x:0,y:0},{x:-12,y:-6},{x:-12,y:6}], fill: '#475569' }
          ]
        },
        { type: 'textbox', left: 530, top: 205, width: 40, text: 'Yes', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', fill: '#059669' },
        
        {
          type: 'group',
          left: 390,
          top: 290,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 50, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: -6, top: 50, points: [{x:0,y:0},{x:-6,y:-12},{x:6,y:-12}], fill: '#475569' }
          ]
        },
        { type: 'textbox', left: 405, top: 305, width: 30, text: 'No', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', fill: '#DC2626' },
        
        { type: 'rect', left: 610, top: 200, width: 180, height: 80, fill: '#D1FAE5', stroke: '#10B981', strokeWidth: 3, rx: 10, ry: 10 },
        { type: 'textbox', left: 630, top: 220, width: 140, text: 'Process A', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
        
        { type: 'rect', left: 310, top: 350, width: 180, height: 80, fill: '#FCE7F3', stroke: '#EC4899', strokeWidth: 3, rx: 10, ry: 10 },
        { type: 'textbox', left: 330, top: 370, width: 140, text: 'Process B', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 390,
          top: 430,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 50, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: -6, top: 50, points: [{x:0,y:0},{x:-6,y:-12},{x:6,y:-12}], fill: '#475569' }
          ]
        },
        
        {
          type: 'group',
          left: 600,
          top: 240,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 100, y2: 240, stroke: '#475569', strokeWidth: 3 },
            { type: 'polygon', left: 94, top: 240, points: [{x:0,y:0},{x:-12,y:-6},{x:-6,y:-12}], fill: '#475569' }
          ]
        },
        
        { type: 'rect', left: 300, top: 490, width: 200, height: 80, fill: '#DBEAFE', stroke: '#3B82F6', strokeWidth: 3, rx: 40, ry: 40 },
        { type: 'textbox', left: 320, top: 510, width: 160, text: 'End', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
      ]
    },
    dimensions: { width: 800, height: 600 },
    paperSize: "letter",
  },
  {
    id: "swim-lane-diagram",
    name: "Swim Lane Diagram",
    description: "Process flow with swim lanes for different actors",
    category: "flowchart",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2UwZTdmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSIyMCIgeT0iNzAiIHdpZHRoPSIyNjAiIGhlaWdodD0iNTAiIGZpbGw9IiNmZmUwZTAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PHJlY3QgeD0iMjAiIHk9IjEyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2UwZmZlMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'textbox', left: 300, top: 30, width: 200, text: 'Process Flow', fontSize: 22, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b', textAlign: 'center' },
        
        { type: 'rect', left: 50, top: 80, width: 700, height: 120, fill: '#EEF2FF', stroke: '#cbd5e1', strokeWidth: 2 },
        { type: 'textbox', left: 70, top: 120, width: 100, text: 'Customer', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', fill: '#3B82F6' },
        
        { type: 'rect', left: 50, top: 200, width: 700, height: 120, fill: '#FEF3C7', stroke: '#cbd5e1', strokeWidth: 2 },
        { type: 'textbox', left: 70, top: 240, width: 100, text: 'Sales Team', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', fill: '#F59E0B' },
        
        { type: 'rect', left: 50, top: 320, width: 700, height: 120, fill: '#D1FAE5', stroke: '#cbd5e1', strokeWidth: 2 },
        { type: 'textbox', left: 70, top: 360, width: 100, text: 'Fulfillment', fontSize: 16, fontFamily: 'Inter', fontWeight: 'bold', fill: '#10B981' },
        
        { type: 'rect', left: 220, top: 110, width: 140, height: 60, fill: '#DBEAFE', stroke: '#3B82F6', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 235, top: 125, width: 110, text: 'Submit Order', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 360,
          top: 135,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 60, y2: 0, stroke: '#475569', strokeWidth: 2 },
            { type: 'polygon', left: 60, top: -5, points: [{x:0,y:0},{x:-10,y:-5},{x:-10,y:5}], fill: '#475569' }
          ]
        },
        
        { type: 'rect', left: 430, top: 230, width: 140, height: 60, fill: '#FDE68A', stroke: '#F59E0B', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 445, top: 240, width: 110, text: 'Review Order', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 500,
          top: 170,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 60, stroke: '#475569', strokeWidth: 2 },
            { type: 'polygon', left: -5, top: 60, points: [{x:0,y:0},{x:-5,y:-10},{x:5,y:-10}], fill: '#475569' }
          ]
        },
        
        { type: 'rect', left: 610, top: 350, width: 120, height: 60, fill: '#A7F3D0', stroke: '#10B981', strokeWidth: 3, rx: 8, ry: 8 },
        { type: 'textbox', left: 620, top: 365, width: 100, text: 'Ship Order', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 570,
          top: 260,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 100, y2: 90, stroke: '#475569', strokeWidth: 2 },
            { type: 'polygon', left: 95, top: 90, points: [{x:0,y:0},{x:-10,y:-5},{x:-5,y:-10}], fill: '#475569' }
          ]
        },
      ]
    },
    dimensions: { width: 800, height: 470 },
    paperSize: "letter",
  },
  {
    id: "consort-flow",
    name: "Flow Chart for Study",
    description: "CONSORT 2010 Flow Diagram template for reporting clinical trial participant flow",
    category: "flowchart",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjI4MCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzQyODVGNCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNDAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjEwIiB5PSIxMjAiIHdpZHRoPSIyODAiIGhlaWdodD0iMzAiIGZpbGw9IiM0Mjg1RjQiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMjAiIHk9IjE2MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI0MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTYwIiB5PSIxNjAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'textbox', left: 300, top: 20, width: 200, text: 'CONSORT 2010\nFlow Diagram', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b', textAlign: 'center' },
        
        { type: 'rect', left: 50, top: 80, width: 700, height: 50, fill: '#3B82F6', rx: 8, ry: 8 },
        { type: 'textbox', left: 70, top: 95, width: 660, text: 'Enrollment', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' },
        
        { type: 'rect', left: 250, top: 150, width: 300, height: 70, fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 270, top: 170, width: 260, text: 'Assessed for eligibility (n= )', fontSize: 14, fontFamily: 'Inter', fill: '#1e293b', textAlign: 'center' },
        
        {
          type: 'group',
          left: 390,
          top: 220,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 30, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: -5, top: 30, points: [{x:0,y:0},{x:-5,y:-10},{x:5,y:-10}], fill: '#334155' }
          ]
        },
        
        { type: 'rect', left: 560, top: 170, width: 180, height: 110, fill: '#F8FAFC', stroke: '#94a3b8', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 575, top: 180, width: 150, text: 'Excluded (n= )\n• Not meeting criteria (n= )\n• Declined (n= )\n• Other reasons (n= )', fontSize: 12, fontFamily: 'Inter', fill: '#475569' },
        
        { type: 'rect', left: 250, top: 260, width: 300, height: 70, fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 270, top: 280, width: 260, text: 'Randomized (n= )', fontSize: 14, fontFamily: 'Inter', fill: '#1e293b', textAlign: 'center' },
        
        {
          type: 'group',
          left: 390,
          top: 330,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 30, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: -5, top: 30, points: [{x:0,y:0},{x:-5,y:-10},{x:5,y:-10}], fill: '#334155' }
          ]
        },
        
        { type: 'rect', left: 50, top: 370, width: 700, height: 50, fill: '#3B82F6', rx: 8, ry: 8 },
        { type: 'textbox', left: 70, top: 385, width: 660, text: 'Allocation', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' },
        
        {
          type: 'group',
          left: 250,
          top: 420,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: -100, y2: 40, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: -105, top: 60, points: [{x:0,y:0},{x:5,y:-10},{x:10,y:-5}], fill: '#334155' }
          ]
        },
        
        {
          type: 'group',
          left: 550,
          top: 420,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 100, y2: 40, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: 95, top: 60, points: [{x:0,y:0},{x:-5,y:-10},{x:-10,y:-5}], fill: '#334155' }
          ]
        },
        
        { type: 'rect', left: 80, top: 490, width: 200, height: 90, fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 95, top: 505, width: 170, text: 'Allocated to intervention (n= )\n• Received intervention (n= )\n• Did not receive (n= )', fontSize: 12, fontFamily: 'Inter', fill: '#1e293b' },
        
        { type: 'rect', left: 520, top: 490, width: 200, height: 90, fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 535, top: 505, width: 170, text: 'Allocated to control (n= )\n• Received control (n= )\n• Did not receive (n= )', fontSize: 12, fontFamily: 'Inter', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 170,
          top: 580,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 30, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: -5, top: 30, points: [{x:0,y:0},{x:-5,y:-10},{x:5,y:-10}], fill: '#334155' }
          ]
        },
        
        {
          type: 'group',
          left: 610,
          top: 580,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 30, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: -5, top: 30, points: [{x:0,y:0},{x:-5,y:-10},{x:5,y:-10}], fill: '#334155' }
          ]
        },
        
        { type: 'rect', left: 50, top: 620, width: 700, height: 50, fill: '#3B82F6', rx: 8, ry: 8 },
        { type: 'textbox', left: 70, top: 635, width: 660, text: 'Follow-Up', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' },
        
        { type: 'rect', left: 80, top: 690, width: 200, height: 80, fill: '#F8FAFC', stroke: '#94a3b8', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 95, top: 705, width: 170, text: 'Lost to follow-up (n= )\nDiscontinued intervention (n= )', fontSize: 12, fontFamily: 'Inter', fill: '#475569' },
        
        { type: 'rect', left: 520, top: 690, width: 200, height: 80, fill: '#F8FAFC', stroke: '#94a3b8', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 535, top: 705, width: 170, text: 'Lost to follow-up (n= )\nDiscontinued intervention (n= )', fontSize: 12, fontFamily: 'Inter', fill: '#475569' },
        
        {
          type: 'group',
          left: 170,
          top: 770,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 30, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: -5, top: 30, points: [{x:0,y:0},{x:-5,y:-10},{x:5,y:-10}], fill: '#334155' }
          ]
        },
        
        {
          type: 'group',
          left: 610,
          top: 770,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 30, stroke: '#334155', strokeWidth: 2 },
            { type: 'polygon', left: -5, top: 30, points: [{x:0,y:0},{x:-5,y:-10},{x:5,y:-10}], fill: '#334155' }
          ]
        },
        
        { type: 'rect', left: 50, top: 810, width: 700, height: 50, fill: '#3B82F6', rx: 8, ry: 8 },
        { type: 'textbox', left: 70, top: 825, width: 660, text: 'Analysis', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' },
        
        { type: 'rect', left: 80, top: 880, width: 200, height: 80, fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 95, top: 895, width: 170, text: 'Analysed (n= )\nExcluded from analysis (n= )', fontSize: 12, fontFamily: 'Inter', fill: '#1e293b' },
        
        { type: 'rect', left: 520, top: 880, width: 200, height: 80, fill: '#ffffff', stroke: '#334155', strokeWidth: 2, rx: 6, ry: 6 },
        { type: 'textbox', left: 535, top: 895, width: 170, text: 'Analysed (n= )\nExcluded from analysis (n= )', fontSize: 12, fontFamily: 'Inter', fill: '#1e293b' },
      ]
    },
    dimensions: { width: 800, height: 1000 },
    paperSize: "letter",
  },
  {
    id: "swot-analysis",
    name: "SWOT Analysis",
    description: "Four-quadrant SWOT analysis template",
    category: "business",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjEyNSIgaGVpZ2h0PSI4MCIgZmlsbD0iI2UwZmZlMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIxNTUiIHk9IjIwIiB3aWR0aD0iMTI1IiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmZlMGUwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjIwIiB5PSIxMTAiIHdpZHRoPSIxMjUiIGhlaWdodD0iODAiIGZpbGw9IiNlMGU3ZmYiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTU1IiB5PSIxMTAiIHdpZHRoPSIxMjUiIGhlaWdodD0iODAiIGZpbGw9IiNmZmYwZTAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'textbox', left: 250, top: 30, width: 300, text: 'SWOT Analysis', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b', textAlign: 'center' },
        
        { type: 'rect', left: 100, top: 100, width: 300, height: 250, fill: '#D1FAE5', stroke: '#10B981', strokeWidth: 3, rx: 10, ry: 10 },
        { type: 'textbox', left: 120, top: 120, width: 260, text: 'Strengths', fontSize: 20, fontFamily: 'Inter', fontWeight: 'bold', fill: '#065f46' },
        { type: 'textbox', left: 120, top: 160, width: 260, text: '• Internal positive attributes\n• Competitive advantages\n• Core competencies', fontSize: 14, fontFamily: 'Inter', fill: '#1e293b' },
        
        { type: 'rect', left: 420, top: 100, width: 300, height: 250, fill: '#FEE2E2', stroke: '#EF4444', strokeWidth: 3, rx: 10, ry: 10 },
        { type: 'textbox', left: 440, top: 120, width: 260, text: 'Weaknesses', fontSize: 20, fontFamily: 'Inter', fontWeight: 'bold', fill: '#991b1b' },
        { type: 'textbox', left: 440, top: 160, width: 260, text: '• Internal limitations\n• Areas for improvement\n• Resource gaps', fontSize: 14, fontFamily: 'Inter', fill: '#1e293b' },
        
        { type: 'rect', left: 100, top: 370, width: 300, height: 250, fill: '#DBEAFE', stroke: '#3B82F6', strokeWidth: 3, rx: 10, ry: 10 },
        { type: 'textbox', left: 120, top: 390, width: 260, text: 'Opportunities', fontSize: 20, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e40af' },
        { type: 'textbox', left: 120, top: 430, width: 260, text: '• External favorable factors\n• Market trends\n• Growth potential', fontSize: 14, fontFamily: 'Inter', fill: '#1e293b' },
        
        { type: 'rect', left: 420, top: 370, width: 300, height: 250, fill: '#FEF3C7', stroke: '#F59E0B', strokeWidth: 3, rx: 10, ry: 10 },
        { type: 'textbox', left: 440, top: 390, width: 260, text: 'Threats', fontSize: 20, fontFamily: 'Inter', fontWeight: 'bold', fill: '#92400e' },
        { type: 'textbox', left: 440, top: 430, width: 260, text: '• External challenges\n• Competition\n• Risk factors', fontSize: 14, fontFamily: 'Inter', fill: '#1e293b' },
      ]
    },
    dimensions: { width: 800, height: 650 },
    paperSize: "letter",
  },
  {
    id: "venn-diagram",
    name: "Venn Diagram",
    description: "Two or three circle Venn diagram",
    category: "business",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiNlMGU3ZmYiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBvcGFjaXR5PSIwLjciLz48Y2lyY2xlIGN4PSIxODAiIGN5PSIxMDAiIHI9IjYwIiBmaWxsPSIjZmZlMGUwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC43Ii8+PC9zdmc+",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'textbox', left: 250, top: 30, width: 300, text: 'Venn Diagram', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e293b', textAlign: 'center' },
        
        { type: 'circle', left: 150, top: 150, radius: 120, fill: '#DBEAFE', stroke: '#3B82F6', strokeWidth: 3, opacity: 0.7 },
        { type: 'textbox', left: 180, top: 240, width: 100, text: 'Set A', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#1e40af', textAlign: 'center' },
        
        { type: 'circle', left: 430, top: 150, radius: 120, fill: '#FEF3C7', stroke: '#F59E0B', strokeWidth: 3, opacity: 0.7 },
        { type: 'textbox', left: 460, top: 240, width: 100, text: 'Set B', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#92400e', textAlign: 'center' },
        
        { type: 'circle', left: 290, top: 290, radius: 120, fill: '#D1FAE5', stroke: '#10B981', strokeWidth: 3, opacity: 0.7 },
        { type: 'textbox', left: 320, top: 420, width: 100, text: 'Set C', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#065f46', textAlign: 'center' },
        
        { type: 'textbox', left: 335, top: 270, width: 130, text: 'Intersection', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', fill: '#1e293b', fontWeight: 'bold' },
      ]
    },
    dimensions: { width: 800, height: 550 },
    paperSize: "letter",
  },
  {
    id: "mind-map",
    name: "Mind Map",
    description: "Central topic with branching ideas",
    category: "educational",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM0Mjg1RjQiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE1MCIgeTE9IjYwIiB4Mj0iMTUwIiB5Mj0iMjAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMjAiIHI9IjE1IiBmaWxsPSIjZTBlN2ZmIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxOTAiIHkxPSIxMDAiIHgyPSIyNDAiIHkyPSIxMDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMjQwIiBjeT0iMTAwIiByPSIxNSIgZmlsbD0iI2UwZTdmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
    canvasData: {
      version: "6.0.0",
      objects: [
        { type: 'circle', left: 340, top: 240, radius: 80, fill: '#8B5CF6', stroke: '#6d28d9', strokeWidth: 4 },
        { type: 'textbox', left: 360, top: 300, width: 120, text: 'Central\nTopic', fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#ffffff' },
        
        {
          type: 'group',
          left: 420,
          top: 200,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: -80, stroke: '#64748b', strokeWidth: 3 },
            { type: 'circle', left: -30, top: -110, radius: 30, fill: '#DBEAFE', stroke: '#3B82F6', strokeWidth: 3 }
          ]
        },
        { type: 'textbox', left: 390, top: 75, width: 60, text: 'Idea 1', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 500,
          top: 280,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 100, y2: 0, stroke: '#64748b', strokeWidth: 3 },
            { type: 'circle', left: 100, top: -30, radius: 30, fill: '#FEF3C7', stroke: '#F59E0B', strokeWidth: 3 }
          ]
        },
        { type: 'textbox', left: 600, top: 295, width: 60, text: 'Idea 2', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 420,
          top: 400,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 80, stroke: '#64748b', strokeWidth: 3 },
            { type: 'circle', left: -30, top: 80, radius: 30, fill: '#D1FAE5', stroke: '#10B981', strokeWidth: 3 }
          ]
        },
        { type: 'textbox', left: 390, top: 505, width: 60, text: 'Idea 3', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
        
        {
          type: 'group',
          left: 260,
          top: 280,
          objects: [
            { type: 'line', left: 0, top: 0, x1: 0, y1: 0, x2: -100, y2: 0, stroke: '#64748b', strokeWidth: 3 },
            { type: 'circle', left: -130, top: -30, radius: 30, fill: '#FCE7F3', stroke: '#EC4899', strokeWidth: 3 }
          ]
        },
        { type: 'textbox', left: 100, top: 295, width: 60, text: 'Idea 4', fontSize: 14, fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', fill: '#1e293b' },
      ]
    },
    dimensions: { width: 800, height: 600 },
    paperSize: "letter",
  },
];
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
          type: "line",
          left: 400,
          top: 180,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 30,
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "polygon",
          left: 400,
          top: 210,
          points: [{ x: 0, y: 0 }, { x: -5, y: -8 }, { x: 5, y: -8 }],
          fill: "#000000",
          originX: "center",
          originY: "center",
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
          type: "line",
          left: 400,
          top: 270,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 30,
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "polygon",
          left: 400,
          top: 300,
          points: [{ x: 0, y: 0 }, { x: -5, y: -8 }, { x: 5, y: -8 }],
          fill: "#000000",
          originX: "center",
          originY: "center",
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
          type: "line",
          left: 225,
          top: 430,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 30,
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "polygon",
          left: 225,
          top: 460,
          points: [{ x: 0, y: 0 }, { x: -5, y: -8 }, { x: 5, y: -8 }],
          fill: "#000000",
          originX: "center",
          originY: "center",
        },
        {
          type: "line",
          left: 575,
          top: 430,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 30,
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "polygon",
          left: 575,
          top: 460,
          points: [{ x: 0, y: 0 }, { x: -5, y: -8 }, { x: 5, y: -8 }],
          fill: "#000000",
          originX: "center",
          originY: "center",
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
          type: "line",
          left: 225,
          top: 580,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 30,
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "polygon",
          left: 225,
          top: 610,
          points: [{ x: 0, y: 0 }, { x: -5, y: -8 }, { x: 5, y: -8 }],
          fill: "#000000",
          originX: "center",
          originY: "center",
        },
        {
          type: "line",
          left: 575,
          top: 580,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 30,
          stroke: "#000000",
          strokeWidth: 2,
        },
        {
          type: "polygon",
          left: 575,
          top: 610,
          points: [{ x: 0, y: 0 }, { x: -5, y: -8 }, { x: 5, y: -8 }],
          fill: "#000000",
          originX: "center",
          originY: "center",
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
