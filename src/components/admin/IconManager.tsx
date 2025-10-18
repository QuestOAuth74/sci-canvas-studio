import { useState, useEffect } from "react";
import { iconStorage } from "@/lib/iconStorage";
import { IconItem } from "@/types/icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const IconManager = () => {
  const [icons, setIcons] = useState<IconItem[]>([]);

  useEffect(() => {
    loadIcons();
  }, []);

  const loadIcons = () => {
    setIcons(iconStorage.getIcons());
  };

  const handleDelete = (id: string) => {
    iconStorage.deleteIcon(id);
    toast.success("Icon deleted");
    loadIcons();
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
                <img
                  src={icon.thumbnail}
                  alt={icon.name}
                  className="w-full h-full object-contain"
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
      </CardContent>
    </Card>
  );
};
