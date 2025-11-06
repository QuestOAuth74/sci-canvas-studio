import { Card } from '@/components/ui/card';
import { PowerPointTemplate, CustomTemplate } from '@/types/powerpoint';

interface PowerPointTemplatePreviewProps {
  template: PowerPointTemplate | CustomTemplate;
  compact?: boolean;
}

export const PowerPointTemplatePreview = ({ 
  template, 
  compact = false 
}: PowerPointTemplatePreviewProps) => {
  const isCustom = 'fonts' in template;
  
  const colors = template.colors;
  const fonts = isCustom ? (template as CustomTemplate).fonts : {
    title: 'Arial',
    body: 'Arial',
    titleSize: 44,
    bodySize: 18,
  };
  
  const layouts = isCustom ? (template as CustomTemplate).layouts : {
    titleSlide: 'centered' as const,
    contentSlide: 'bullets' as const,
    spacing: 'normal' as const,
  };

  const imageLayouts = isCustom && (template as CustomTemplate).image_layouts ? (template as CustomTemplate).image_layouts : {
    gridColumns: 2,
    imageSize: 'medium' as const,
    imageBorder: true,
    imageRounded: false,
    imageSpacing: 'normal' as const,
  };

  const quoteStyles = isCustom && (template as CustomTemplate).quote_styles ? (template as CustomTemplate).quote_styles : {
    quoteSize: 36,
    attributionSize: 20,
    showQuoteMarks: true,
    alignment: 'center' as const,
  };

  const getTitleAlignment = () => {
    switch (layouts.titleSlide) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  const getSpacingClass = () => {
    switch (layouts.spacing) {
      case 'compact': return 'space-y-1';
      case 'spacious': return 'space-y-4';
      default: return 'space-y-2';
    }
  };

  const scaleFont = (size: number) => {
    if (compact) return Math.round(size * 0.3);
    return Math.round(size * 0.5);
  };

  const renderContentSlide = () => {
    const bg = ('background' in colors && colors.background) || '#ffffff';
    
    switch (layouts.contentSlide) {
      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{ backgroundColor: bg }}>
            {quoteStyles?.showQuoteMarks && <span style={{ fontSize: `${scaleFont(48)}px`, color: colors.accent }}>"</span>}
            <p className="italic font-medium" style={{ color: colors.primary, fontSize: `${scaleFont(quoteStyles?.quoteSize || 36)}px`, fontFamily: fonts.title }}>
              Inspiring quote text here
            </p>
            <p className="mt-2" style={{ color: colors.text, fontSize: `${scaleFont(quoteStyles?.attributionSize || 20)}px`, fontFamily: fonts.body }}>
              — Author Name
            </p>
          </div>
        );
      
      case 'image-grid':
        return (
          <div className="grid grid-cols-2 gap-2 h-full p-4" style={{ backgroundColor: bg }}>
            <div className="grid grid-cols-2 gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className="border-2 rounded" style={{ borderColor: colors.secondary, backgroundColor: colors.accent + '20' }} />
              ))}
            </div>
            <div className={getSpacingClass()}>
              <h4 className="font-bold mb-2" style={{ color: colors.primary, fontSize: `${scaleFont(fonts.titleSize * 0.7)}px` }}>Content</h4>
              {['Point 1', 'Point 2'].map((p, i) => (
                <div key={i} className="flex gap-2">
                  <span style={{ color: colors.secondary }}>•</span>
                  <span style={{ color: colors.text, fontSize: `${scaleFont(fonts.bodySize)}px` }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'image-left':
      case 'image-right':
        const imageFirst = layouts.contentSlide === 'image-left';
        const borderStyle = imageLayouts?.borderStyle;
        const shadow = imageLayouts?.shadow;
        const cornerRadius = imageLayouts?.imageRounded ? (imageLayouts?.cornerRadius || 8) : 0;
        
        const imageStyles: React.CSSProperties = {
          borderColor: imageLayouts?.imageBorder && borderStyle?.color ? borderStyle.color : colors.secondary,
          backgroundColor: colors.accent + '20',
          borderWidth: imageLayouts?.imageBorder && borderStyle?.width ? `${borderStyle.width}px` : '2px',
          borderStyle: imageLayouts?.imageBorder && borderStyle?.style ? borderStyle.style : 'solid',
          borderRadius: `${cornerRadius}px`,
          boxShadow: shadow?.enabled 
            ? `${shadow.distance || 5}px ${shadow.distance || 5}px ${shadow.blur || 10}px ${shadow.color || '#00000040'}`
            : 'none'
        };
        
        return (
          <div className={`grid grid-cols-2 gap-2 h-full p-4 ${imageFirst ? '' : 'grid-flow-dense'}`} style={{ backgroundColor: bg }}>
            <div className="border-2 rounded flex items-center justify-center text-muted-foreground relative" style={imageStyles}>
              <span className="text-xs">Image</span>
              {imageLayouts?.captions?.enabled && (
                <div 
                  className="absolute text-[6px]"
                  style={{
                    bottom: imageLayouts.captions.position === 'overlay-bottom' ? 4 : undefined,
                    top: imageLayouts.captions.position === 'overlay-top' ? 4 : undefined,
                    left: imageLayouts.captions.alignment === 'left' ? 4 : undefined,
                    right: imageLayouts.captions.alignment === 'right' ? 4 : undefined,
                    textAlign: imageLayouts.captions.alignment || 'center',
                    backgroundColor: imageLayouts.captions.position?.startsWith('overlay') 
                      ? imageLayouts.captions.backgroundColor || '#00000080' 
                      : 'transparent',
                    color: imageLayouts.captions.fontColor || '#1e293b',
                    padding: '2px 4px',
                    width: '100%'
                  }}
                >
                  Caption
                </div>
              )}
            </div>
            <div className={getSpacingClass()}>
              <h4 className="font-bold mb-2" style={{ color: colors.primary, fontSize: `${scaleFont(fonts.titleSize * 0.7)}px` }}>Content</h4>
              {['Point 1', 'Point 2', 'Point 3'].map((p, i) => (
                <div key={i} className="flex gap-2">
                  <span style={{ color: colors.secondary }}>•</span>
                  <span style={{ color: colors.text, fontSize: `${scaleFont(fonts.bodySize)}px` }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full p-4" style={{ backgroundColor: bg }}>
            <h4 className="font-bold mb-2" style={{ color: colors.primary, fontSize: `${scaleFont(fonts.titleSize * 0.7)}px` }}>Slide Content</h4>
            <div className={getSpacingClass()}>
              {['Point 1', 'Point 2', 'Point 3'].map((p, i) => (
                <div key={i} className="flex gap-2">
                  <span style={{ color: colors.secondary }}>•</span>
                  <span style={{ color: colors.text, fontSize: `${scaleFont(fonts.bodySize)}px`, fontFamily: fonts.body }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
      <Card className="overflow-hidden">
        <div className={`${compact ? 'h-32' : 'h-64'} w-full flex items-center justify-center p-4`} style={{ backgroundColor: colors.primary }}>
          <div className={`w-full ${getTitleAlignment()}`}>
            <h3 className="font-bold text-white leading-tight" style={{ fontFamily: fonts.title, fontSize: `${scaleFont(fonts.titleSize)}px` }}>
              Presentation Title
            </h3>
            {!compact && <p className="mt-2 text-white/90" style={{ fontFamily: fonts.body, fontSize: `${scaleFont(fonts.bodySize)}px` }}>Subtitle</p>}
          </div>
        </div>
        {!compact && <div className="p-2 text-xs text-center text-muted-foreground bg-muted/50">Title Slide</div>}
      </Card>

      <Card className="overflow-hidden">
        <div className={`${compact ? 'h-32' : 'h-64'} w-full`}>
          {renderContentSlide()}
        </div>
        {!compact && <div className="p-2 text-xs text-center text-muted-foreground bg-muted/50">Content ({layouts.contentSlide})</div>}
      </Card>
    </div>
  );
};