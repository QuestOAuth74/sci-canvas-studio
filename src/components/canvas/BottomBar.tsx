import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";

export const BottomBar = () => {
  return (
    <div className="h-10 glass-effect border-t flex items-center px-4 gap-2">
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Plus className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          Page-1
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
};
