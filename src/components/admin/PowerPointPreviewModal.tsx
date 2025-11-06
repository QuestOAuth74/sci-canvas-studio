import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, List, Hash, Type } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PreviewData {
  estimatedSlides: number;
  imageCount: number;
  images: Array<{ filename: string; thumbnail?: string }>;
  formatting: {
    headings: number;
    bullets: number;
    numberedLists: number;
    boldText: boolean;
    italicText: boolean;
    underlineText: boolean;
  };
  contentPreview: string;
}

interface PowerPointPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: PreviewData | null;
  onConfirm: () => void;
  isGenerating: boolean;
}

export const PowerPointPreviewModal = ({
  open,
  onOpenChange,
  previewData,
  onConfirm,
  isGenerating,
}: PowerPointPreviewModalProps) => {
  if (!previewData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generation Preview</DialogTitle>
          <DialogDescription>
            Review the estimated presentation structure before generating
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Slide Count */}
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Slides</p>
                <p className="text-2xl font-bold">{previewData.estimatedSlides}</p>
              </div>
            </div>

            {/* Images Section */}
            {previewData.imageCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Images Found</h3>
                  <Badge variant="secondary">{previewData.imageCount}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {previewData.images.slice(0, 8).map((img, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-muted rounded-md flex items-center justify-center border"
                    >
                      {img.thumbnail ? (
                        <img
                          src={img.thumbnail}
                          alt={img.filename}
                          className="w-full h-full object-contain rounded-md"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <Image className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground truncate">
                            {img.filename}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {previewData.images.length > 8 && (
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center border">
                      <p className="text-sm text-muted-foreground">
                        +{previewData.images.length - 8} more
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Formatting Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Formatting Detected</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Headings</p>
                    <p className="font-semibold">{previewData.formatting.headings}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <List className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bullet Points</p>
                    <p className="font-semibold">{previewData.formatting.bullets}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Numbered Lists</p>
                    <p className="font-semibold">{previewData.formatting.numberedLists}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Text Styling</p>
                    <div className="flex gap-1">
                      {previewData.formatting.boldText && (
                        <Badge variant="outline" className="text-xs">B</Badge>
                      )}
                      {previewData.formatting.italicText && (
                        <Badge variant="outline" className="text-xs">I</Badge>
                      )}
                      {previewData.formatting.underlineText && (
                        <Badge variant="outline" className="text-xs">U</Badge>
                      )}
                      {!previewData.formatting.boldText &&
                        !previewData.formatting.italicText &&
                        !previewData.formatting.underlineText && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Preview */}
            <div className="space-y-3">
              <h3 className="font-semibold">Content Preview</h3>
              <div className="p-3 bg-muted rounded-lg">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {previewData.contentPreview}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate PowerPoint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
