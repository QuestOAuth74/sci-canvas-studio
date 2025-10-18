import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Icon {
  id: string;
  name: string;
  category: string;
  svg_content: string;
}

export const IconManager = () => {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIcons, setTotalIcons] = useState(0);
  
  const ITEMS_PER_PAGE = 100;

  useEffect(() => {
    loadIcons(currentPage);
  }, [currentPage]);

  const loadIcons = async (page: number) => {
    // Get total count
    const { count } = await supabase
      .from('icons')
      .select('*', { count: 'exact', head: true });

    if (count) {
      setTotalIcons(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    }

    // Get paginated data
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('icons')
      .select('*')
      .order('name')
      .range(from, to);

    if (!error && data) {
      setIcons(data);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('icons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete icon");
    } else {
      toast.success("Icon deleted");
      loadIcons(currentPage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Icons</CardTitle>
        <CardDescription>
          View and delete uploaded icons - Showing {icons.length} of {totalIcons} icons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {icons.map((icon) => (
            <div key={icon.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="aspect-square border border-border rounded-lg p-2 flex items-center justify-center">
                <div 
                  dangerouslySetInnerHTML={{ __html: icon.svg_content }} 
                  className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                />
              </div>
              <p className="text-sm font-medium truncate">{icon.name}</p>
              <p className="text-xs text-muted-foreground truncate">{icon.category}</p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => handleDelete(icon.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          ))}
        </div>
        
        {icons.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No icons uploaded yet
          </p>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-12 px-6 font-bold uppercase border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-12 px-6 font-bold uppercase border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
