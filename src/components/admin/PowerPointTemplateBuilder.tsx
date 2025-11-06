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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    defaultPositions: z.object({
      'image-left': z.enum(['left', 'center', 'right']),
      'image-right': z.enum(['left', 'center', 'right']),
      'image-top': z.enum(['top', 'center', 'bottom']),
      'image-grid': z.enum(['left', 'center', 'right', 'justified']),
    }).optional(),
    borderStyle: z.object({
      width: z.number().min(1).max(10),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      style: z.enum(['solid', 'dashed', 'dotted'])
    }).optional(),
    cornerRadius: z.number().min(0).max(50).optional(),
    sizingMode: z.enum(['contain', 'cover', 'crop']).optional(),
    captions: z.object({
      enabled: z.boolean(),
      position: z.enum(['above', 'below', 'overlay-bottom', 'overlay-top']),
      fontSize: z.number().min(8).max(24),
      fontColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).optional(),
      alignment: z.enum(['left', 'center', 'right'])
    }).optional(),
    shadow: z.object({
      enabled: z.boolean(),
      blur: z.number().min(0).max(20),
      angle: z.number().min(0).max(360),
      distance: z.number().min(0).max(20),
      color: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/),
      opacity: z.number().min(0).max(100)
    }).optional()
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
      defaultPositions?: {
        'image-left'?: 'left' | 'center' | 'right';
        'image-right'?: 'left' | 'center' | 'right';
        'image-top'?: 'top' | 'center' | 'bottom';
        'image-grid'?: 'left' | 'center' | 'right' | 'justified';
      };
      borderStyle?: {
        width?: number;
        color?: string;
        style?: 'solid' | 'dashed' | 'dotted';
      };
      cornerRadius?: number;
      sizingMode?: 'contain' | 'cover' | 'crop';
      captions?: {
        enabled?: boolean;
        position?: 'above' | 'below' | 'overlay-bottom' | 'overlay-top';
        fontSize?: number;
        fontColor?: string;
        backgroundColor?: string;
        alignment?: 'left' | 'center' | 'right';
      };
      shadow?: {
        enabled?: boolean;
        blur?: number;
        angle?: number;
        distance?: number;
        color?: string;
        opacity?: number;
      };
    };
    enhancedBullets: {
      enabled: boolean;
      iconSet: 'default' | 'scientific' | 'medical' | 'educational';
      circleSize: number;
      circleColor: string;
      iconColor: string;
    };
    shadedBoxes: {
      enabled: boolean;
      opacity: number;
      backgroundColor: string;
      padding: number;
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
      defaultPositions: {
        'image-left': 'left',
        'image-right': 'right',
        'image-top': 'center',
        'image-grid': 'justified'
      },
      borderStyle: {
        width: 2,
        color: '#3b82f6',
        style: 'solid'
      },
      cornerRadius: 8,
      sizingMode: 'contain',
      captions: {
        enabled: false,
        position: 'below',
        fontSize: 14,
        fontColor: '#1e293b',
        backgroundColor: '#00000080',
        alignment: 'center'
      },
      shadow: {
        enabled: false,
        blur: 10,
        angle: 135,
        distance: 5,
        color: '#00000040',
        opacity: 30
      }
    },
    enhancedBullets: {
      enabled: true,
      iconSet: 'scientific',
      circleSize: 0.35,
      circleColor: '#3b82f6',
      iconColor: '#ffffff'
    },
    shadedBoxes: {
      enabled: true,
      opacity: 10,
      backgroundColor: '#e3f2fd',
      padding: 0.25
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
        defaultPositions: {
          'image-left': 'left',
          'image-right': 'right',
          'image-top': 'center',
          'image-grid': 'justified'
        },
        borderStyle: {
          width: 2,
          color: '#3b82f6',
          style: 'solid'
        },
        cornerRadius: 8,
        sizingMode: 'contain',
        captions: {
          enabled: false,
          position: 'below',
          fontSize: 14,
          fontColor: '#1e293b',
          backgroundColor: '#00000080',
          alignment: 'center'
        },
        shadow: {
          enabled: false,
          blur: 10,
          angle: 135,
          distance: 5,
          color: '#00000040',
          opacity: 30
        }
      },
      enhancedBullets: {
        enabled: true,
        iconSet: 'scientific',
        circleSize: 0.35,
        circleColor: '#3b82f6',
        iconColor: '#ffffff'
      },
      shadedBoxes: {
        enabled: true,
        opacity: 10,
        backgroundColor: '#e3f2fd',
        padding: 0.25
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
      imageLayouts: template.image_layouts ? {
        ...template.image_layouts,
        defaultPositions: template.image_layouts.defaultPositions || {
          'image-left': 'left',
          'image-right': 'right',
          'image-top': 'center',
          'image-grid': 'justified'
        },
        borderStyle: template.image_layouts.borderStyle || {
          width: 2,
          color: '#3b82f6',
          style: 'solid'
        },
        cornerRadius: template.image_layouts.cornerRadius ?? 8,
        sizingMode: template.image_layouts.sizingMode || 'contain',
        captions: template.image_layouts.captions || {
          enabled: false,
          position: 'below',
          fontSize: 14,
          fontColor: '#1e293b',
          backgroundColor: '#00000080',
          alignment: 'center'
        },
        shadow: template.image_layouts.shadow || {
          enabled: false,
          blur: 10,
          angle: 135,
          distance: 5,
          color: '#00000040',
          opacity: 30
        }
      } : {
        gridColumns: 2,
        imageSize: 'medium',
        imageBorder: true,
        imageRounded: false,
        imageSpacing: 'normal',
        defaultPositions: {
          'image-left': 'left',
          'image-right': 'right',
          'image-top': 'center',
          'image-grid': 'justified'
        },
        borderStyle: {
          width: 2,
          color: '#3b82f6',
          style: 'solid'
        },
        cornerRadius: 8,
        sizingMode: 'contain',
        captions: {
          enabled: false,
          position: 'below',
          fontSize: 14,
          fontColor: '#1e293b',
          backgroundColor: '#00000080',
          alignment: 'center'
        },
        shadow: {
          enabled: false,
          blur: 10,
          angle: 135,
          distance: 5,
          color: '#00000040',
          opacity: 30
        }
      },
      enhancedBullets: template.enhanced_bullets || {
        enabled: true,
        iconSet: 'scientific',
        circleSize: 0.35,
        circleColor: '#3b82f6',
        iconColor: '#ffffff'
      },
      shadedBoxes: template.shaded_boxes || {
        enabled: true,
        opacity: 10,
        backgroundColor: '#e3f2fd',
        padding: 0.25
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
          defaultPositions: validated.imageLayouts.defaultPositions,
          borderStyle: validated.imageLayouts.borderStyle,
          cornerRadius: validated.imageLayouts.cornerRadius,
          sizingMode: validated.imageLayouts.sizingMode,
          captions: validated.imageLayouts.captions,
          shadow: validated.imageLayouts.shadow,
        },
        enhanced_bullets: {
          enabled: formData.enhancedBullets.enabled,
          iconSet: formData.enhancedBullets.iconSet,
          circleSize: formData.enhancedBullets.circleSize,
          circleColor: formData.enhancedBullets.circleColor,
          iconColor: formData.enhancedBullets.iconColor,
        },
        shaded_boxes: {
          enabled: formData.shadedBoxes.enabled,
          opacity: formData.shadedBoxes.opacity,
          backgroundColor: formData.shadedBoxes.backgroundColor,
          padding: formData.shadedBoxes.padding,
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

              {/* Enhanced Bullets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary" />
                    Icon Bullets
                  </CardTitle>
                  <CardDescription>Circular icon bullets for professional presentations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="icon-bullets">Enable Icon Bullets</Label>
                    <Switch
                      id="icon-bullets"
                      checked={formData.enhancedBullets.enabled}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        enhancedBullets: { ...formData.enhancedBullets, enabled: checked }
                      })}
                    />
                  </div>
                  
                  {formData.enhancedBullets.enabled && (
                    <>
                      <div>
                        <Label htmlFor="icon-set">Icon Set</Label>
                        <Select
                          value={formData.enhancedBullets.iconSet}
                          onValueChange={(value: any) => setFormData({
                            ...formData,
                            enhancedBullets: { ...formData.enhancedBullets, iconSet: value }
                          })}
                        >
                          <SelectTrigger id="icon-set">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default (●■▲◆★)</SelectItem>
                            <SelectItem value="scientific">Scientific (🔬⚗️🧬🔭📊)</SelectItem>
                            <SelectItem value="medical">Medical (💊⚕️🏥💉🫀)</SelectItem>
                            <SelectItem value="educational">Educational (📚✏️🎓📖💡)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="circle-color">Circle Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="circle-color"
                              type="color"
                              value={formData.enhancedBullets.circleColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                enhancedBullets: { ...formData.enhancedBullets, circleColor: e.target.value }
                              })}
                              className="h-10 w-16 p-1 cursor-pointer"
                            />
                            <Input
                              value={formData.enhancedBullets.circleColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                enhancedBullets: { ...formData.enhancedBullets, circleColor: e.target.value }
                              })}
                              placeholder="#000000"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="icon-color">Icon Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="icon-color"
                              type="color"
                              value={formData.enhancedBullets.iconColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                enhancedBullets: { ...formData.enhancedBullets, iconColor: e.target.value }
                              })}
                              className="h-10 w-16 p-1 cursor-pointer"
                            />
                            <Input
                              value={formData.enhancedBullets.iconColor}
                              onChange={(e) => setFormData({
                                ...formData,
                                enhancedBullets: { ...formData.enhancedBullets, iconColor: e.target.value }
                              })}
                              placeholder="#FFFFFF"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="circle-size">Circle Size (inches): {formData.enhancedBullets.circleSize}</Label>
                        <Slider
                          id="circle-size"
                          min={0.2}
                          max={0.6}
                          step={0.05}
                          value={[formData.enhancedBullets.circleSize]}
                          onValueChange={([value]) => setFormData({
                            ...formData,
                            enhancedBullets: { ...formData.enhancedBullets, circleSize: value }
                          })}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Shaded Boxes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted border" />
                    Shaded Boxes
                  </CardTitle>
                  <CardDescription>Subtle background boxes for content highlighting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shaded-boxes">Enable Shaded Boxes</Label>
                    <Switch
                      id="shaded-boxes"
                      checked={formData.shadedBoxes.enabled}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        shadedBoxes: { ...formData.shadedBoxes, enabled: checked }
                      })}
                    />
                  </div>
                  
                  {formData.shadedBoxes.enabled && (
                    <>
                      <div>
                        <Label htmlFor="box-bg-color">Background Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="box-bg-color"
                            type="color"
                            value={formData.shadedBoxes.backgroundColor}
                            onChange={(e) => setFormData({
                              ...formData,
                              shadedBoxes: { ...formData.shadedBoxes, backgroundColor: e.target.value }
                            })}
                            className="h-10 w-16 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.shadedBoxes.backgroundColor}
                            onChange={(e) => setFormData({
                              ...formData,
                              shadedBoxes: { ...formData.shadedBoxes, backgroundColor: e.target.value }
                            })}
                            placeholder="#e3f2fd"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="box-opacity">Opacity (%): {formData.shadedBoxes.opacity}</Label>
                        <Slider
                          id="box-opacity"
                          min={5}
                          max={30}
                          step={5}
                          value={[formData.shadedBoxes.opacity]}
                          onValueChange={([value]) => setFormData({
                            ...formData,
                            shadedBoxes: { ...formData.shadedBoxes, opacity: value }
                          })}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="box-padding">Padding (inches): {formData.shadedBoxes.padding}</Label>
                        <Slider
                          id="box-padding"
                          min={0.1}
                          max={0.5}
                          step={0.05}
                          value={[formData.shadedBoxes.padding]}
                          onValueChange={([value]) => setFormData({
                            ...formData,
                            shadedBoxes: { ...formData.shadedBoxes, padding: value }
                          })}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Image Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Advanced Image Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Sizing Mode */}
                  <div>
                    <Label htmlFor="sizing-mode">Image Sizing Mode</Label>
                    <Select 
                      value={formData.imageLayouts.sizingMode || 'contain'}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        imageLayouts: { ...formData.imageLayouts, sizingMode: value }
                      })}
                    >
                      <SelectTrigger id="sizing-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contain">Contain (fit with margins)</SelectItem>
                        <SelectItem value="cover">Cover (fill area, may crop)</SelectItem>
                        <SelectItem value="crop">Crop (center crop)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How images should be sized within their containers
                    </p>
                  </div>

                  {/* Border Styling */}
                  {formData.imageLayouts.imageBorder && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm">
                        <span>Border Styling</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label>Width (points): {formData.imageLayouts.borderStyle?.width || 2}</Label>
                            <Slider
                              value={[formData.imageLayouts.borderStyle?.width || 2]}
                              onValueChange={([value]) => setFormData({
                                ...formData,
                                imageLayouts: {
                                  ...formData.imageLayouts,
                                  borderStyle: { ...formData.imageLayouts.borderStyle, width: value, color: formData.imageLayouts.borderStyle?.color || '#3b82f6', style: formData.imageLayouts.borderStyle?.style || 'solid' }
                                }
                              })}
                              min={1} max={10} step={1}
                            />
                          </div>
                          <div className="flex-1">
                            <Label>Color</Label>
                            <Input 
                              type="color" 
                              value={formData.imageLayouts.borderStyle?.color || '#3b82f6'}
                              onChange={(e) => setFormData({
                                ...formData,
                                imageLayouts: {
                                  ...formData.imageLayouts,
                                  borderStyle: { ...formData.imageLayouts.borderStyle, color: e.target.value, width: formData.imageLayouts.borderStyle?.width || 2, style: formData.imageLayouts.borderStyle?.style || 'solid' }
                                }
                              })}
                              className="h-10 w-full"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Style</Label>
                          <Select 
                            value={formData.imageLayouts.borderStyle?.style || 'solid'}
                            onValueChange={(value: any) => setFormData({
                              ...formData,
                              imageLayouts: {
                                ...formData.imageLayouts,
                                borderStyle: { ...formData.imageLayouts.borderStyle, style: value, width: formData.imageLayouts.borderStyle?.width || 2, color: formData.imageLayouts.borderStyle?.color || '#3b82f6' }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Corner Radius */}
                  {formData.imageLayouts.imageRounded && (
                    <div>
                      <Label>Corner Radius: {formData.imageLayouts.cornerRadius || 8}</Label>
                      <Slider
                        value={[formData.imageLayouts.cornerRadius || 8]}
                        onValueChange={([value]) => setFormData({
                          ...formData,
                          imageLayouts: { ...formData.imageLayouts, cornerRadius: value }
                        })}
                        min={0} max={50} step={1}
                      />
                    </div>
                  )}

                  {/* Default Positions */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm">
                      <span>Default Image Positions</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="grid grid-cols-2 gap-3 pt-3">
                      <div>
                        <Label>Image-Left Slides</Label>
                        <Select 
                          value={formData.imageLayouts.defaultPositions?.['image-left'] || 'left'}
                          onValueChange={(value: any) => setFormData({
                            ...formData,
                            imageLayouts: {
                              ...formData.imageLayouts,
                              defaultPositions: { ...formData.imageLayouts.defaultPositions, 'image-left': value }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left Aligned</SelectItem>
                            <SelectItem value="center">Centered</SelectItem>
                            <SelectItem value="right">Right Aligned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Image-Right Slides</Label>
                        <Select 
                          value={formData.imageLayouts.defaultPositions?.['image-right'] || 'right'}
                          onValueChange={(value: any) => setFormData({
                            ...formData,
                            imageLayouts: {
                              ...formData.imageLayouts,
                              defaultPositions: { ...formData.imageLayouts.defaultPositions, 'image-right': value }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left Aligned</SelectItem>
                            <SelectItem value="center">Centered</SelectItem>
                            <SelectItem value="right">Right Aligned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Image-Top Slides</Label>
                        <Select 
                          value={formData.imageLayouts.defaultPositions?.['image-top'] || 'center'}
                          onValueChange={(value: any) => setFormData({
                            ...formData,
                            imageLayouts: {
                              ...formData.imageLayouts,
                              defaultPositions: { ...formData.imageLayouts.defaultPositions, 'image-top': value }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Image-Grid Slides</Label>
                        <Select 
                          value={formData.imageLayouts.defaultPositions?.['image-grid'] || 'justified'}
                          onValueChange={(value: any) => setFormData({
                            ...formData,
                            imageLayouts: {
                              ...formData.imageLayouts,
                              defaultPositions: { ...formData.imageLayouts.defaultPositions, 'image-grid': value }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="justified">Justified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Caption Settings */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm">
                      <span>Image Captions</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="captions-enabled"
                          checked={formData.imageLayouts.captions?.enabled || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            imageLayouts: {
                              ...formData.imageLayouts,
                              captions: { ...formData.imageLayouts.captions, enabled: checked, position: formData.imageLayouts.captions?.position || 'below', fontSize: formData.imageLayouts.captions?.fontSize || 14, fontColor: formData.imageLayouts.captions?.fontColor || '#1e293b', backgroundColor: formData.imageLayouts.captions?.backgroundColor, alignment: formData.imageLayouts.captions?.alignment || 'center' }
                            }
                          })}
                        />
                        <Label htmlFor="captions-enabled">Enable Captions</Label>
                      </div>
                      
                      {formData.imageLayouts.captions?.enabled && (
                        <>
                          <div>
                            <Label>Caption Position</Label>
                            <Select 
                              value={formData.imageLayouts.captions.position || 'below'}
                              onValueChange={(value: any) => setFormData({
                                ...formData,
                                imageLayouts: {
                                  ...formData.imageLayouts,
                                  captions: { ...formData.imageLayouts.captions, position: value, enabled: true, fontSize: formData.imageLayouts.captions?.fontSize || 14, fontColor: formData.imageLayouts.captions?.fontColor || '#1e293b', alignment: formData.imageLayouts.captions?.alignment || 'center' }
                                }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="above">Above Image</SelectItem>
                                <SelectItem value="below">Below Image</SelectItem>
                                <SelectItem value="overlay-bottom">Overlay (Bottom)</SelectItem>
                                <SelectItem value="overlay-top">Overlay (Top)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Font Size</Label>
                              <Input 
                                type="number" 
                                min={8} 
                                max={24}
                                value={formData.imageLayouts.captions.fontSize || 14}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    captions: { ...formData.imageLayouts.captions, fontSize: parseInt(e.target.value) || 14, enabled: true, position: formData.imageLayouts.captions?.position || 'below', fontColor: formData.imageLayouts.captions?.fontColor || '#1e293b', alignment: formData.imageLayouts.captions?.alignment || 'center' }
                                  }
                                })}
                              />
                            </div>
                            <div>
                              <Label>Alignment</Label>
                              <Select 
                                value={formData.imageLayouts.captions.alignment || 'center'}
                                onValueChange={(value: any) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    captions: { ...formData.imageLayouts.captions, alignment: value, enabled: true, position: formData.imageLayouts.captions?.position || 'below', fontSize: formData.imageLayouts.captions?.fontSize || 14, fontColor: formData.imageLayouts.captions?.fontColor || '#1e293b' }
                                  }
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="center">Center</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Font Color</Label>
                              <Input 
                                type="color" 
                                value={formData.imageLayouts.captions.fontColor || '#1e293b'}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    captions: { ...formData.imageLayouts.captions, fontColor: e.target.value, enabled: true, position: formData.imageLayouts.captions?.position || 'below', fontSize: formData.imageLayouts.captions?.fontSize || 14, alignment: formData.imageLayouts.captions?.alignment || 'center' }
                                  }
                                })}
                              />
                            </div>
                            {formData.imageLayouts.captions.position?.startsWith('overlay') && (
                              <div>
                                <Label>Background (RGBA)</Label>
                                <Input 
                                  type="text" 
                                  value={formData.imageLayouts.captions.backgroundColor || '#00000080'}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    imageLayouts: {
                                      ...formData.imageLayouts,
                                      captions: { ...formData.imageLayouts.captions, backgroundColor: e.target.value, enabled: true, position: formData.imageLayouts.captions?.position || 'below', fontSize: formData.imageLayouts.captions?.fontSize || 14, fontColor: formData.imageLayouts.captions?.fontColor || '#1e293b', alignment: formData.imageLayouts.captions?.alignment || 'center' }
                                    }
                                  })}
                                  placeholder="#00000080"
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Shadow Effects */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm">
                      <span>Shadow Effects</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="shadow-enabled"
                          checked={formData.imageLayouts.shadow?.enabled || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            imageLayouts: {
                              ...formData.imageLayouts,
                              shadow: { ...formData.imageLayouts.shadow, enabled: checked, blur: formData.imageLayouts.shadow?.blur || 10, angle: formData.imageLayouts.shadow?.angle || 135, distance: formData.imageLayouts.shadow?.distance || 5, color: formData.imageLayouts.shadow?.color || '#00000040', opacity: formData.imageLayouts.shadow?.opacity || 30 }
                            }
                          })}
                        />
                        <Label htmlFor="shadow-enabled">Enable Shadow</Label>
                      </div>
                      
                      {formData.imageLayouts.shadow?.enabled && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Blur: {formData.imageLayouts.shadow.blur || 10}</Label>
                              <Slider 
                                value={[formData.imageLayouts.shadow.blur || 10]}
                                onValueChange={([value]) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    shadow: { ...formData.imageLayouts.shadow, blur: value, enabled: true, angle: formData.imageLayouts.shadow?.angle || 135, distance: formData.imageLayouts.shadow?.distance || 5, color: formData.imageLayouts.shadow?.color || '#00000040', opacity: formData.imageLayouts.shadow?.opacity || 30 }
                                  }
                                })}
                                min={0} max={20}
                              />
                            </div>
                            <div>
                              <Label>Distance: {formData.imageLayouts.shadow.distance || 5}</Label>
                              <Slider 
                                value={[formData.imageLayouts.shadow.distance || 5]}
                                onValueChange={([value]) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    shadow: { ...formData.imageLayouts.shadow, distance: value, enabled: true, blur: formData.imageLayouts.shadow?.blur || 10, angle: formData.imageLayouts.shadow?.angle || 135, color: formData.imageLayouts.shadow?.color || '#00000040', opacity: formData.imageLayouts.shadow?.opacity || 30 }
                                  }
                                })}
                                min={0} max={20}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Angle: {formData.imageLayouts.shadow.angle || 135}°</Label>
                              <Slider 
                                value={[formData.imageLayouts.shadow.angle || 135]}
                                onValueChange={([value]) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    shadow: { ...formData.imageLayouts.shadow, angle: value, enabled: true, blur: formData.imageLayouts.shadow?.blur || 10, distance: formData.imageLayouts.shadow?.distance || 5, color: formData.imageLayouts.shadow?.color || '#00000040', opacity: formData.imageLayouts.shadow?.opacity || 30 }
                                  }
                                })}
                                min={0} max={360}
                              />
                            </div>
                            <div>
                              <Label>Opacity: {formData.imageLayouts.shadow.opacity || 30}%</Label>
                              <Slider 
                                value={[formData.imageLayouts.shadow.opacity || 30]}
                                onValueChange={([value]) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    shadow: { ...formData.imageLayouts.shadow, opacity: value, enabled: true, blur: formData.imageLayouts.shadow?.blur || 10, angle: formData.imageLayouts.shadow?.angle || 135, distance: formData.imageLayouts.shadow?.distance || 5, color: formData.imageLayouts.shadow?.color || '#00000040' }
                                  }
                                })}
                                min={0} max={100}
                              />
                            </div>
                            <div>
                              <Label>Color</Label>
                              <Input 
                                type="color" 
                                value={(formData.imageLayouts.shadow.color || '#00000040').slice(0, 7)}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  imageLayouts: {
                                    ...formData.imageLayouts,
                                    shadow: { ...formData.imageLayouts.shadow, color: e.target.value, enabled: true, blur: formData.imageLayouts.shadow?.blur || 10, angle: formData.imageLayouts.shadow?.angle || 135, distance: formData.imageLayouts.shadow?.distance || 5, opacity: formData.imageLayouts.shadow?.opacity || 30 }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
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