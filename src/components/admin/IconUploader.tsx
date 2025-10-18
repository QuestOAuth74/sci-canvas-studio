import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { iconStorage } from "@/lib/iconStorage";
import { IconCategory } from "@/types/icon";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const IconUploader = () => {
  const [categories] = useState<IconCategory[]>(iconStorage.getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [iconName, setIconName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedCategory || !iconName) {
      toast.error("Please fill all fields");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const svgData = e.target?.result as string;
      
      iconStorage.saveIcon({
        id: Date.now().toString(),
        name: iconName,
        category: selectedCategory,
        svgData,
        thumbnail: svgData,
        createdAt: Date.now(),
      });

      toast.success("Icon uploaded successfully!");
      setIconName("");
      setFile(null);
      setSelectedCategory("");
    };

    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Icon</CardTitle>
        <CardDescription>
          Upload SVG or ICO files to your icon library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="icon-name">Icon Name</Label>
          <Input
            id="icon-name"
            placeholder="e.g., Cell Membrane"
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Icon File (SVG/ICO)</Label>
          <Input
            id="file"
            type="file"
            accept=".svg,.ico"
            onChange={handleFileChange}
          />
        </div>

        <Button onClick={handleUpload} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Upload Icon
        </Button>
      </CardContent>
    </Card>
  );
};
