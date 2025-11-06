import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useCustomTemplates } from '@/hooks/useCustomTemplates';
import { CustomTemplate, QuoteStyles, ImageLayouts } from '@/types/powerpoint';
import { Plus, Palette, Type, Layout, Trash2, Edit, Eye, Quote, Image as ImageIcon } from 'lucide-react';
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
    contentSlide: z.enum(['bullets', 'two-column', 'image-text', 'image-left', 'image-right', 'image-grid', 'image-top', 'full-image', 'quote', 'split-content']),
    spacing: z.enum(['compact', 'normal', 'spacious']),
  }),
  quoteStyles: z.object({
    quoteSize: z.number().min(20).max(72),
    attributionSize: z.number().min(10).max(36),
    showQuoteMarks: z.boolean(),
    quoteColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
    alignment: z.enum(['left', 'center', 'right']),
  }),
  imageLayouts: z.object({
    gridColumns: z.number().min(2).max(4),
    imageSize: z.enum(['small', 'medium', 'large']),
    imageBorder: z.boolean(),
    imageRounded: z.boolean(),
    imageSpacing: z.enum(['tight', 'normal', 'wide']),
  }),
});

const GOOGLE_FONTS = [
  'Arial', 'Calibri', 'Times New Roman', 'Georgia', 'Verdana',
  'Montserrat', 'Open Sans', 'Roboto', 'Lato', 'Poppins',
  'Playfair Display', 'Merriweather', 'Raleway', 'Ubuntu'
];

const CONTENT_SLIDE_OPTIONS = [
  { value: 'bullets', label: 'Bullet Points', description: 'Simple list of points' },
  { value: 'two-column', label: 'Two Columns', description: 'Split content into two columns' },
  { value: 'image-text', label: 'Image + Text', description: 'Basic image with text' },
  { value: 'image-left', label: 'Image Left', description: 'Large image on left, text on right' },
  { value: 'image-right', label: 'Image Right', description: 'Text on left, large image on right' },
  { value: 'image-grid', label: 'Image Grid', description: 'Grid of images with text' },
  { value: 'image-top', label: 'Image Top', description: 'Image on top, text below' },
  { value: 'full-image', label: 'Full Image', description: 'Full slide image with title overlay' },
  { value: 'quote', label: 'Quote', description: 'Large centered quote with attribution' },
  { value: 'split-content', label: 'Split Content', description: '50/50 split layout' },
];

export const PowerPointTemplateBuilder = () => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useCustomTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CustomTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  type FormDataType = {
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
      contentSlide: 'bullets' | 'two-column' | 'image-text' | 'image-left' | 'image-right' | 'image-grid' | 'image-top' | 'full-image' | 'quote' | 'split-content';
      spacing: 'compact' | 'normal' | 'spacious';
    };
    quoteStyles: {
      quoteSize: number;
      attributionSize: number;
      showQuoteMarks: boolean;
      alignment: 'left' | 'center' | 'right';
    };
    imageLayouts: {
      gridColumns: number;
      imageSize: 'small' | 'medium' | 'large';
      imageBorder: boolean;
      imageRounded: boolean;
      imageSpacing: 'tight' | 'normal' | 'wide';
    };
  };

  const [formData, setFormData] = useState<FormDataType>({
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
      title: 'Montserrat',
      body: 'Open Sans',
      titleSize: 44,
      bodySize: 18,
    },
    layouts: {
      titleSlide: 'centered',
      contentSlide: 'bullets',
      spacing: 'normal',
    },
    quoteStyles: {
      quoteSize: 36,
      attributionSize: 20,
      showQuoteMarks: true,
      alignment: 'center',
    },
    imageLayouts: {
      gridColumns: 2,
      imageSize: 'medium',
      imageBorder: true,
      imageRounded: false,
      imageSpacing: 'normal',
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
        title: 'Montserrat',
        body: 'Open Sans',
        titleSize: 44,
        bodySize: 18,
      },
      layouts: {
        titleSlide: 'centered',
        contentSlide: 'bullets',
        spacing: 'normal',
      },
      quoteStyles: {
        quoteSize: 36,
        attributionSize: 20,
        showQuoteMarks: true,
        alignment: 'center',
      },
      imageLayouts: {
        gridColumns: 2,
        imageSize: 'medium',
        imageBorder: true,
        imageRounded: false,
        imageSpacing: 'normal',
      },
    });
    setEditingTemplate(null);
    setErrors({});
  };

  const handleEditTemplate = (template: CustomTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      colors: {
        ...template.colors,
        background: template.colors.background || '#ffffff',
      },
      fonts: template.fonts,
      layouts: template.layouts,
      quoteStyles: template.quote_styles || {
        quoteSize: 36,
        attributionSize: 20,
        showQuoteMarks: true,
        alignment: 'center',
      },
      imageLayouts: template.image_layouts || {
        gridColumns: 2,
        imageSize: 'medium',
        imageBorder: true,
        imageRounded: false,
        imageSpacing: 'normal',
      },
    });
    setEditingTemplate(template);
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
        quote_styles: {
          quoteSize: validated.quoteStyles.quoteSize,
          attributionSize: validated.quoteStyles.attributionSize,
          showQuoteMarks: validated.quoteStyles.showQuoteMarks,
          quoteColor: validated.quoteStyles.quoteColor,
          alignment: validated.quoteStyles.alignment,
        },
        image_layouts: {
          gridColumns: validated.imageLayouts.gridColumns,
          imageSize: validated.imageLayouts.imageSize,
          imageBorder: validated.imageLayouts.imageBorder,
          imageRounded: validated.imageLayouts.imageRounded,
          imageSpacing: validated.imageLayouts.imageSpacing,
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                Create custom templates with colors, fonts, layouts, and styling options
              </DialogDescription>
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
                      value={formData.fonts.titleSize}
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
                      value={formData.fonts.bodySize}
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
                  <div className="md:col-span-2">
                    <Label htmlFor="content-slide">Content Slide Layout</Label>
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
                        {CONTENT_SLIDE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
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

              {/* Quote Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Quote className="h-4 w-4" />
                    Quote Slide Settings
                  </CardTitle>
                  <CardDescription>Configure styling for quote slides</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quote-size">Quote Font Size (pt)</Label>
                      <Input
                        id="quote-size"
                        type="number"
                        min={20}
                        max={72}
                        value={formData.quoteStyles.quoteSize}
                        onChange={(e) => setFormData({
                          ...formData,
                          quoteStyles: { ...formData.quoteStyles, quoteSize: parseInt(e.target.value) || 36 }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="attribution-size">Attribution Font Size (pt)</Label>
                      <Input
                        id="attribution-size"
                        type="number"
                        min={10}
                        max={36}
                        value={formData.quoteStyles.attributionSize}
                        onChange={(e) => setFormData({
                          ...formData,
                          quoteStyles: { ...formData.quoteStyles, attributionSize: parseInt(e.target.value) || 20 }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quote-alignment">Quote Alignment</Label>
                      <Select
                        value={formData.quoteStyles.alignment}
                        onValueChange={(value: any) => setFormData({
                          ...formData,
                          quoteStyles: { ...formData.quoteStyles, alignment: value }
                        })}
                      >
                        <SelectTrigger id="quote-alignment">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quote-marks">Show Quotation Marks</Label>
                      <Switch
                        id="quote-marks"
                        checked={formData.quoteStyles.showQuoteMarks}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          quoteStyles: { ...formData.quoteStyles, showQuoteMarks: checked }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Image Layout Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image Layout Settings
                  </CardTitle>
                  <CardDescription>Configure image-based slide layouts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="grid-columns">Grid Columns</Label>
                      <Select
                        value={formData.imageLayouts.gridColumns.toString()}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          imageLayouts: { ...formData.imageLayouts, gridColumns: parseInt(value) }
                        })}
                      >
                        <SelectTrigger id="grid-columns">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="image-size">Image Size</Label>
                      <Select
                        value={formData.imageLayouts.imageSize}
                        onValueChange={(value: any) => setFormData({
                          ...formData,
                          imageLayouts: { ...formData.imageLayouts, imageSize: value }
                        })}
                      >
                        <SelectTrigger id="image-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="image-spacing">Image Spacing</Label>
                      <Select
                        value={formData.imageLayouts.imageSpacing}
                        onValueChange={(value: any) => setFormData({
                          ...formData,
                          imageLayouts: { ...formData.imageLayouts, imageSpacing: value }
                        })}
                      >
                        <SelectTrigger id="image-spacing">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tight">Tight</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="wide">Wide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="image-border"
                        checked={formData.imageLayouts.imageBorder}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          imageLayouts: { ...formData.imageLayouts, imageBorder: checked }
                        })}
                      />
                      <Label htmlFor="image-border">Show Border</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="image-rounded"
                        checked={formData.imageLayouts.imageRounded}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          imageLayouts: { ...formData.imageLayouts, imageRounded: checked }
                        })}
                      />
                      <Label htmlFor="image-rounded">Rounded Corners</Label>
                    </div>
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
                      quote_styles: formData.quoteStyles,
                      image_layouts: formData.imageLayouts,
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
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading templates...</div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <PowerPointTemplatePreview template={template} compact />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No custom templates yet. Create one to get started!</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            {previewTemplate?.description && (
              <DialogDescription>{previewTemplate.description}</DialogDescription>
            )}
          </DialogHeader>
          {previewTemplate && (
            <PowerPointTemplatePreview template={previewTemplate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};