import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { POWERPOINT_TEMPLATES, PowerPointTemplate } from '@/types/powerpoint';
import { Check, Sparkles } from 'lucide-react';
import { useCustomTemplates } from '@/hooks/useCustomTemplates';
import { Skeleton } from '@/components/ui/skeleton';

interface PowerPointTemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export const PowerPointTemplateSelector = ({
  selectedTemplate,
  onSelectTemplate,
}: PowerPointTemplateSelectorProps) => {
  const { templates: customTemplates, isLoading } = useCustomTemplates();

  // Combine built-in and custom templates
  const allTemplates: PowerPointTemplate[] = [
    ...POWERPOINT_TEMPLATES,
    ...(customTemplates?.map(ct => ({
      id: `custom-${ct.id}`,
      name: ct.name,
      description: ct.description || '',
      preview: '⭐',
      colors: ct.colors,
      isCustom: true,
    })) || []),
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {allTemplates.map((template) => (
        <Card
          key={template.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedTemplate === template.id
              ? 'ring-2 ring-primary shadow-lg'
              : 'hover:border-primary/50'
          }`}
          onClick={() => onSelectTemplate(template.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{template.preview}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isCustom && (
                      <Sparkles className="h-4 w-4 text-primary" aria-label="Custom Template" />
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </div>
              </div>
              {selectedTemplate === template.id && (
                <Check className="h-6 w-6 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {Object.entries(template.colors).map(([key, color]) => (
                <div
                  key={key}
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ backgroundColor: color }}
                  title={key}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
