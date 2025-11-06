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
  
  // Get colors
  const colors = template.colors;
  
  // Get fonts and layouts (with defaults for built-in templates)
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

  return (
    <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
      {/* Title Slide Preview */}
      <Card className="overflow-hidden">
        <div 
          className={`${compact ? 'h-32' : 'h-64'} w-full flex items-center justify-center p-4 md:p-6`}
          style={{ backgroundColor: colors.primary }}
        >
          <div className={`w-full ${getTitleAlignment()}`}>
            <h3 
              className="font-bold text-white leading-tight"
              style={{ 
                fontFamily: fonts.title,
                fontSize: `${scaleFont(fonts.titleSize)}px`,
              }}
            >
              Presentation Title
            </h3>
            {!compact && (
              <p 
                className="mt-2 text-white/90"
                style={{ 
                  fontFamily: fonts.body,
                  fontSize: `${scaleFont(fonts.bodySize)}px`,
                }}
              >
                Subtitle or Author Name
              </p>
            )}
          </div>
        </div>
        {!compact && (
          <div className="p-2 text-xs text-center text-muted-foreground bg-muted/50">
            Title Slide
          </div>
        )}
      </Card>

      {/* Content Slide Preview */}
      <Card className="overflow-hidden">
        <div 
          className={`${compact ? 'h-32' : 'h-64'} w-full p-4 md:p-6`}
          style={{ backgroundColor: ('background' in colors && colors.background) || '#ffffff' }}
        >
          <h4 
            className="font-bold leading-tight mb-2 md:mb-3"
            style={{ 
              color: colors.primary,
              fontFamily: fonts.title,
              fontSize: `${scaleFont(fonts.titleSize * 0.7)}px`,
            }}
          >
            Slide Content
          </h4>
          
          {layouts.contentSlide === 'two-column' ? (
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className={getSpacingClass()}>
                {['Point 1', 'Point 2'].map((point, i) => (
                  <div key={i} className="flex items-start gap-1 md:gap-2">
                    <span 
                      className="mt-0.5 md:mt-1"
                      style={{ 
                        color: colors.secondary,
                        fontSize: `${scaleFont(fonts.bodySize * 0.8)}px`,
                      }}
                    >
                      •
                    </span>
                    <span 
                      style={{ 
                        color: colors.text,
                        fontFamily: fonts.body,
                        fontSize: `${scaleFont(fonts.bodySize)}px`,
                      }}
                    >
                      {point}
                    </span>
                  </div>
                ))}
              </div>
              <div className={getSpacingClass()}>
                {['Point 3', 'Point 4'].map((point, i) => (
                  <div key={i} className="flex items-start gap-1 md:gap-2">
                    <span 
                      className="mt-0.5 md:mt-1"
                      style={{ 
                        color: colors.secondary,
                        fontSize: `${scaleFont(fonts.bodySize * 0.8)}px`,
                      }}
                    >
                      •
                    </span>
                    <span 
                      style={{ 
                        color: colors.text,
                        fontFamily: fonts.body,
                        fontSize: `${scaleFont(fonts.bodySize)}px`,
                      }}
                    >
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : layouts.contentSlide === 'image-text' ? (
            <div className="grid grid-cols-2 gap-2 md:gap-4 h-[calc(100%-2rem)]">
              <div 
                className="rounded border-2 border-dashed flex items-center justify-center text-muted-foreground text-xs md:text-sm"
                style={{ borderColor: colors.secondary }}
              >
                Image
              </div>
              <div className={getSpacingClass()}>
                {['Point 1', 'Point 2', 'Point 3'].map((point, i) => (
                  <div key={i} className="flex items-start gap-1 md:gap-2">
                    <span 
                      className="mt-0.5 md:mt-1"
                      style={{ 
                        color: colors.secondary,
                        fontSize: `${scaleFont(fonts.bodySize * 0.8)}px`,
                      }}
                    >
                      •
                    </span>
                    <span 
                      style={{ 
                        color: colors.text,
                        fontFamily: fonts.body,
                        fontSize: `${scaleFont(fonts.bodySize)}px`,
                      }}
                    >
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={getSpacingClass()}>
              {compact 
                ? ['Point 1', 'Point 2'].map((point, i) => (
                    <div key={i} className="flex items-start gap-1 md:gap-2">
                      <span 
                        className="mt-0.5 md:mt-1"
                        style={{ 
                          color: colors.secondary,
                          fontSize: `${scaleFont(fonts.bodySize * 0.8)}px`,
                        }}
                      >
                        •
                      </span>
                      <span 
                        style={{ 
                          color: colors.text,
                          fontFamily: fonts.body,
                          fontSize: `${scaleFont(fonts.bodySize)}px`,
                        }}
                      >
                        {point}
                      </span>
                    </div>
                  ))
                : ['Point 1', 'Point 2', 'Point 3', 'Point 4'].map((point, i) => (
                    <div key={i} className="flex items-start gap-1 md:gap-2">
                      <span 
                        className="mt-0.5 md:mt-1"
                        style={{ 
                          color: colors.secondary,
                          fontSize: `${scaleFont(fonts.bodySize * 0.8)}px`,
                        }}
                      >
                        •
                      </span>
                      <span 
                        style={{ 
                          color: colors.text,
                          fontFamily: fonts.body,
                          fontSize: `${scaleFont(fonts.bodySize)}px`,
                        }}
                      >
                        {point}
                      </span>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
        {!compact && (
          <div className="p-2 text-xs text-center text-muted-foreground bg-muted/50">
            Content Slide ({layouts.contentSlide})
          </div>
        )}
      </Card>
    </div>
  );
};
