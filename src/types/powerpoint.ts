export interface PowerPointGeneration {
  id: string;
  user_id: string;
  original_filename: string;
  generated_filename: string;
  template_name: string;
  storage_path: string;
  word_doc_path: string | null;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PowerPointTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
}

export const POWERPOINT_TEMPLATES: PowerPointTemplate[] = [
  {
    id: 'scientific-report',
    name: 'Scientific Report',
    description: 'Professional, clean design with blue theme for research presentations',
    preview: '📊',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      text: '#1e293b',
    },
  },
  {
    id: 'research-presentation',
    name: 'Research Presentation',
    description: 'Academic style with gray-green theme for formal presentations',
    preview: '🔬',
    colors: {
      primary: '#064e3b',
      secondary: '#047857',
      accent: '#10b981',
      text: '#1f2937',
    },
  },
  {
    id: 'medical-briefing',
    name: 'Medical Briefing',
    description: 'Clinical design with red-white theme for urgent clarity',
    preview: '⚕️',
    colors: {
      primary: '#991b1b',
      secondary: '#dc2626',
      accent: '#ef4444',
      text: '#111827',
    },
  },
  {
    id: 'educational-lecture',
    name: 'Educational Lecture',
    description: 'Friendly, engaging design with orange-blue theme for teaching',
    preview: '📚',
    colors: {
      primary: '#ea580c',
      secondary: '#2563eb',
      accent: '#fb923c',
      text: '#0f172a',
    },
  },
];
