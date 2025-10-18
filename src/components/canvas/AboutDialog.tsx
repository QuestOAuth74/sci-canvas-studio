import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>About BioSketch</DialogTitle>
          <DialogDescription>
            A free community-led project for scientists
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 text-sm">
            <p className="text-muted-foreground">
              This is a free community-led project for scientists, providing free access 
              without a paywall to researchers worldwide, including those in third world countries.
            </p>

            <div>
              <h3 className="font-semibold text-base mb-2">File Format</h3>
              <p className="text-muted-foreground">
                All icons are in SVG (Scalable Vector Graphics) format, which means they can be 
                scaled to any size without loss of quality.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">License Information</h3>
              <p className="text-muted-foreground mb-3">
                The icons in this collection are licensed under various open-source licenses. 
                Each icon file may have a different license. The main licenses used are:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>CC-0:</strong> Public domain dedication</li>
                <li><strong>CC-BY-3.0:</strong> Creative Commons Attribution 3.0</li>
                <li><strong>CC-BY-4.0:</strong> Creative Commons Attribution 4.0</li>
                <li><strong>CC-BY-SA-3.0:</strong> Creative Commons Attribution-ShareAlike 3.0</li>
                <li><strong>CC-BY-SA-4.0:</strong> Creative Commons Attribution-ShareAlike 4.0</li>
                <li><strong>MIT:</strong> MIT License</li>
                <li><strong>BSD:</strong> BSD License</li>
              </ul>
              <p className="text-muted-foreground mt-3 font-medium">
                Important: When using these icons, please check the license requirements. 
                Icons with CC-BY licenses require attribution to the original author.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Usage</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                <li>Extract the zip file for the category you need</li>
                <li className="mt-2">The SVG files can be used in:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Vector graphics software (Inkscape, Adobe Illustrator)</li>
                    <li>Web development (HTML/CSS)</li>
                    <li>Microsoft Office products</li>
                    <li>Scientific publications and presentations</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Credits</h3>
              <p className="text-muted-foreground mb-3">
                This icon library is maintained by the BioIcons project. Major contributors include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Database Center for Life Sciences (DBCLS/TogoTV)</li>
                <li>Servier Medical Art</li>
                <li>Individual contributors</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                For more information and to contribute, visit:{" "}
                <a 
                  href="https://github.com/duerrsimon/bioicons" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://github.com/duerrsimon/bioicons
                </a>
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
