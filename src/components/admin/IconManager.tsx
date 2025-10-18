import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Icon {
  id: string;
  name: string;
  category: string;
  svg_content: string;
}

export const IconManager = () => {
  const [icons, setIcons] = useState<Icon[]>([]);

  useEffect(() => {
    loadIcons();
  }, []);

  const loadIcons = async () => {
    const { data, error } = await supabase
      .from('icons')
      .select('*')
      .order('name');

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
      loadIcons();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Icons</CardTitle>
        <CardDescription>View and delete uploaded icons</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {icons.map((icon) => (
            <div key={icon.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="aspect-square border border-border rounded-lg p-2">
                <div dangerouslySetInnerHTML={{ __html: icon.svg_content }} className="w-full h-full" />
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
      </CardContent>
    </Card>
  );
};
