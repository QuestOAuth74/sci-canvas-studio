import { cn } from "@/lib/utils";
import { MoveRight, Star } from "lucide-react";

interface GridItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  views?: number;
  readTime?: string;
  rating?: number;
  className?: string;
}

interface GridSectionProps {
  title: string;
  description: string;
  backgroundLabel?: string;
  backgroundPosition?: "left" | "right";
  items?: GridItem[];
  className?: string;
  onItemClick?: (item: GridItem) => void;
  renderActions?: (item: GridItem) => React.ReactNode;
}

export const GridSection = ({
  title,
  description,
  backgroundLabel,
  backgroundPosition = "left",
  items = [],
  className,
  onItemClick,
  renderActions,
}: GridSectionProps) => {
  return (
    <section className={cn("relative py-8", className)}>
      {/* Header */}
      <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground tracking-tight mb-2">
        {title}
      </h2>
      
      {/* Background Label */}
      {backgroundLabel && (
        <div
          className={cn(
            "pointer-events-none absolute top-0 text-[8rem] md:text-[12rem] font-bold text-muted/5 select-none leading-none -z-10",
            backgroundPosition === "left" ? "left-0" : "right-0"
          )}
        >
          {backgroundLabel}
        </div>
      )}
      
      <p className="text-muted-foreground text-lg max-w-2xl mb-8">
        {description}
      </p>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => {
          const {
            id,
            title: itemTitle,
            category,
            imageUrl,
            views,
            readTime,
            rating = 4,
            className: itemClassName
          } = item;
          
          const isPrimary = index === 0;

          return (
            <div
              key={id}
              onClick={() => onItemClick?.(item)}
              className={cn(
                "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500",
                "bg-card border border-border/50 hover:border-primary/30",
                "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                isPrimary && "md:col-span-2 md:row-span-2",
                itemClassName
              )}
            >
              {/* Image Container */}
              <div className={cn(
                "relative overflow-hidden",
                isPrimary ? "aspect-[16/9]" : "aspect-[4/3]"
              )}>
                <img
                  src={imageUrl}
                  alt={itemTitle}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              </div>
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <div className="space-y-3">
                  {/* Title */}
                  <h3 className={cn(
                    "font-semibold text-white leading-tight",
                    isPrimary ? "text-2xl md:text-3xl" : "text-lg"
                  )}>
                    {itemTitle}
                  </h3>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                      {category}
                    </span>
                    
                    {/* Rating Stars */}
                    {rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={cn(
                              "w-3.5 h-3.5",
                              idx < rating ? "fill-amber-400 text-amber-400" : "text-white/30"
                            )}
                          />
                        ))}
                      </div>
                    )}
                    
                    {views !== undefined && (
                      <span className="text-white/60">
                        {views.toLocaleString()} views
                      </span>
                    )}
                    
                    {readTime && (
                      <span className="text-white/60">
                        {readTime}
                      </span>
                    )}
                  </div>
                  
                  {/* Custom Actions */}
                  {renderActions && (
                    <div className="pt-2">
                      {renderActions(item)}
                    </div>
                  )}
                </div>
                
                {/* Hover Arrow Indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MoveRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
