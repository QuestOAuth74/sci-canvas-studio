import { useState, useEffect } from "react";
import { iconStorage } from "@/lib/iconStorage";
import { IconCategory } from "@/types/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const CategoryManager = () => {
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setCategories(iconStorage.getCategories());
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const id = newCategoryName.toLowerCase().replace(/\s+/g, "-");
    iconStorage.saveCategory({
      id,
      name: newCategoryName,
    });

    toast.success("Category added");
    setNewCategoryName("");
    loadCategories();
  };

  const handleDeleteCategory = (id: string) => {
    iconStorage.deleteCategory(id);
    toast.success("Category deleted");
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a new category for organizing icons</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              placeholder="e.g., Microscopy"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <Button onClick={handleAddCategory} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <CardDescription>Manage your icon categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <span className="font-medium">{category.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
