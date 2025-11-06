import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { POWERPOINT_TEMPLATES, PowerPointTemplate } from '@/types/powerpoint';
import { Check } from 'lucide-react';

interface PowerPointTemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export const PowerPointTemplateSelector = ({
  selectedTemplate,
  onSelectTemplate,
}: PowerPointTemplateSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {POWERPOINT_TEMPLATES.map((template) => (
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
                  <CardTitle className="text-lg">{template.name}</CardTitle>
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
