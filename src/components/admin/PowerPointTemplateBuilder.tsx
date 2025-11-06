import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomTemplates } from '@/hooks/useCustomTemplates';
import { CustomTemplate } from '@/types/powerpoint';
import { Plus, Palette, Type, Layout, Trash2, Edit, Eye } from 'lucide-react';
import { z } from 'zod';
import { PowerPointTemplatePreview } from './PowerPointTemplatePreview';

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().trim().max(500, 'Description too long').optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  }),
  fonts: z.object({
    title: z.string().min(1, 'Title font is required'),
    body: z.string().min(1, 'Body font is required'),
    titleSize: z.number().min(20).max(72),
    bodySize: z.number().min(10).max(36),
  }),
  layouts: z.object({
    titleSlide: z.enum(['centered', 'left', 'right']),
    contentSlide: z.enum(['bullets', 'two-column', 'image-text']),
    spacing: z.enum(['compact', 'normal', 'spacious']),
  }),
});

const GOOGLE_FONTS = [
  'Arial', 'Calibri', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Playfair Display', 'Raleway'
];

export const PowerPointTemplateBuilder = () => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useCustomTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CustomTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      background: string;
    };
    fonts: {
      title: string;
      body: string;
      titleSize: number;
      bodySize: number;
    };
    layouts: {
      titleSlide: 'centered' | 'left' | 'right';
      contentSlide: 'bullets' | 'two-column' | 'image-text';
      spacing: 'compact' | 'normal' | 'spacious';
    };
  }>({
    name: '',
    description: '',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      text: '#1e293b',
      background: '#ffffff',
    },
    fonts: {
      title: 'Arial',
      body: 'Arial',
      titleSize: 44,
      bodySize: 18,
    },
    layouts: {
      titleSlide: 'centered',
      contentSlide: 'bullets',
      spacing: 'normal',
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      colors: {
        primary: '#1e3a8a',
        secondary: '#3b82f6',
        accent: '#60a5fa',
        text: '#1e293b',
        background: '#ffffff',
      },
      fonts: {
        title: 'Arial',
        body: 'Arial',
        titleSize: 44,
        bodySize: 18,
      },
      layouts: {
        titleSlide: 'centered',
        contentSlide: 'bullets',
        spacing: 'normal',
      },
    });
    setEditingTemplate(null);
    setErrors({});
  };

  const handleEditTemplate = (template: CustomTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      colors: {
        ...template.colors,
        background: template.colors.background || '#ffffff',
      },
      fonts: template.fonts,
      layouts: template.layouts,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const validated = templateSchema.parse(formData);
      setErrors({});

      const templateData: Omit<CustomTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
        name: validated.name,
        description: validated.description || null,
        colors: {
          primary: validated.colors.primary,
          secondary: validated.colors.secondary,
          accent: validated.colors.accent,
          text: validated.colors.text,
          background: validated.colors.background,
        },
        fonts: {
          title: validated.fonts.title,
          body: validated.fonts.body,
          titleSize: validated.fonts.titleSize,
          bodySize: validated.fonts.bodySize,
        },
        layouts: {
          titleSlide: validated.layouts.titleSlide,
          contentSlide: validated.layouts.contentSlide,
          spacing: validated.layouts.spacing,
        },
        is_default: false,
      };

      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          template: templateData,
        });
      } else {
        await createTemplate.mutateAsync(templateData);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Templates</h3>
          <p className="text-sm text-muted-foreground">Create and manage custom PowerPoint templates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Modern Research"
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this template"
                    rows={2}
                  />
                  {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                </div>
              </div>

              {/* Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(formData.colors).map(([key, value]) => (
                    <div key={key}>
                      <Label htmlFor={`color-${key}`} className="capitalize">{key}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id={`color-${key}`}
                          type="color"
                          value={value}
                          onChange={(e) => setFormData({
                            ...formData,
                            colors: { ...formData.colors, [key]: e.target.value }
                          })}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Input
                          value={value}
                          onChange={(e) => setFormData({
                            ...formData,
                            colors: { ...formData.colors, [key]: e.target.value }
                          })}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                      {errors[`colors.${key}`] && <p className="text-sm text-destructive mt-1">{errors[`colors.${key}`]}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Fonts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title-font">Title Font</Label>
                    <Select
                      value={formData.fonts.title}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        fonts: { ...formData.fonts, title: value }
                      })}
                    >
                      <SelectTrigger id="title-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOOGLE_FONTS.map((font) => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div>
                     <Label htmlFor="title-size">Title Size (pt)</Label>
                     <Input
                       id="title-size"
                       type="number"
                       min={20}
                       max={72}
                       value={formData.fonts.titleSize.toString()}
                       onChange={(e) => setFormData({
                         ...formData,
                         fonts: { ...formData.fonts, titleSize: parseInt(e.target.value) || 44 }
                       })}
                     />
                   </div>
                  <div>
                    <Label htmlFor="body-font">Body Font</Label>
                    <Select
                      value={formData.fonts.body}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        fonts: { ...formData.fonts, body: value }
                      })}
                    >
                      <SelectTrigger id="body-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOOGLE_FONTS.map((font) => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div>
                     <Label htmlFor="body-size">Body Size (pt)</Label>
                     <Input
                       id="body-size"
                       type="number"
                       min={10}
                       max={36}
                       value={formData.fonts.bodySize.toString()}
                       onChange={(e) => setFormData({
                         ...formData,
                         fonts: { ...formData.fonts, bodySize: parseInt(e.target.value) || 18 }
                       })}
                     />
                   </div>
                </CardContent>
              </Card>

              {/* Layouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Layout Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="title-slide">Title Slide</Label>
                    <Select
                      value={formData.layouts.titleSlide}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        layouts: { ...formData.layouts, titleSlide: value }
                      })}
                    >
                      <SelectTrigger id="title-slide">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centered">Centered</SelectItem>
                        <SelectItem value="left">Left Aligned</SelectItem>
                        <SelectItem value="right">Right Aligned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content-slide">Content Slide</Label>
                    <Select
                      value={formData.layouts.contentSlide}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        layouts: { ...formData.layouts, contentSlide: value }
                      })}
                    >
                      <SelectTrigger id="content-slide">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bullets">Bullet Points</SelectItem>
                        <SelectItem value="two-column">Two Column</SelectItem>
                        <SelectItem value="image-text">Image + Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="spacing">Spacing</Label>
                    <Select
                      value={formData.layouts.spacing}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        layouts: { ...formData.layouts, spacing: value }
                      })}
                    >
                      <SelectTrigger id="spacing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Live Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PowerPointTemplatePreview 
                    template={{
                      id: 'preview',
                      name: formData.name || 'Preview',
                      description: formData.description,
                      colors: formData.colors,
                      fonts: formData.fonts,
                      layouts: formData.layouts,
                      is_default: false,
                      created_by: '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name} - Preview</DialogTitle>
            <DialogDescription>
              See how your template will look in the final presentation
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="py-4">
              <PowerPointTemplatePreview template={previewTemplate} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading templates...</p>
        ) : templates && templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  {Object.entries(template.colors).slice(0, 4).map(([key, color]) => (
                    <div
                      key={key}
                      className="h-8 w-8 rounded border"
                      style={{ backgroundColor: color }}
                      title={key}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Title: {template.fonts.title} ({template.fonts.titleSize}pt)</p>
                  <p>Body: {template.fonts.body} ({template.fonts.bodySize}pt)</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewTemplate(template);
                      setIsPreviewOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No custom templates yet. Create your first one!
          </p>
        )}
      </div>
    </div>
  );
};
