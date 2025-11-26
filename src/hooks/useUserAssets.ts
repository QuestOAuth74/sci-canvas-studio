import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserAsset {
  id: string;
  user_id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  category: string;
  tags: string[] | null;
  description: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  is_shared: boolean;
  shared_at: string | null;
}

interface UploadAssetParams {
  file: File;
  category?: string;
  tags?: string[];
  description?: string;
  isShared?: boolean;
}

export function useUserAssets() {
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [sharedAssets, setSharedAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAssets = async (filters?: { category?: string; fileType?: string; search?: string }) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to view your assets');
        return;
      }

      let query = supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.fileType) {
        query = query.eq('file_type', filters.fileType);
      }

      if (filters?.search) {
        query = query.or(`file_name.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const uploadAsset = async ({ file, category = 'uncategorized', tags = [], description, isShared = false }: UploadAssetParams): Promise<UserAsset | null> => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to upload assets');
        return null;
      }

      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return null;
      }

      const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only SVG, PNG, and JPG files are allowed');
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const storagePath = `${user.id}/originals/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get dimensions for images
      let width: number | null = null;
      let height: number | null = null;

      if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }

      // Save metadata to database
      const { data: asset, error: dbError } = await supabase
        .from('user_assets')
        .insert({
          user_id: user.id,
          file_name: fileName,
          original_name: file.name,
          file_type: fileExt || 'unknown',
          mime_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          category,
          tags,
          description,
          width,
          height,
          is_shared: isShared,
          shared_at: isShared ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success(`${file.name} uploaded successfully`);
      await fetchAssets();
      return asset;
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload asset');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const asset = assets.find(a => a.id === id);
      if (!asset) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-assets')
        .remove([asset.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_assets')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success('Asset deleted');
      await fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const updateAsset = async (id: string, updates: Partial<Pick<UserAsset, 'category' | 'tags' | 'description' | 'original_name'>>) => {
    try {
      const { error } = await supabase
        .from('user_assets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Asset updated');
      await fetchAssets();
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    }
  };

  const markAssetUsed = async (id: string) => {
    try {
      await supabase
        .from('user_assets')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking asset as used:', error);
    }
  };

  const getAssetUrl = useCallback(async (asset: UserAsset): Promise<string | null> => {
    try {
      const { data } = supabase.storage
        .from('user-assets')
        .getPublicUrl(asset.storage_path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting asset URL:', error);
      return null;
    }
  }, []);

  const downloadAssetContent = async (asset: UserAsset): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('user-assets')
        .download(asset.storage_path);

      if (error) throw error;

      // For SVG files, return as text
      if (asset.mime_type === 'image/svg+xml') {
        return await data.text();
      }
      
      // For PNG/JPG images, convert to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => {
          console.error('FileReader error');
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(data);
      });
    } catch (error) {
      console.error('Error downloading asset:', error);
      toast.error('Failed to download asset');
      return null;
    }
  };

  const fetchSharedAssets = async (filters?: { category?: string; fileType?: string; search?: string }) => {
    try {
      setLoading(true);

      let query = supabase
        .from('user_assets')
        .select('*')
        .eq('is_shared', true)
        .order('shared_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.fileType) {
        query = query.eq('file_type', filters.fileType);
      }

      if (filters?.search) {
        query = query.or(`file_name.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSharedAssets(data || []);
    } catch (error) {
      console.error('Error fetching shared assets:', error);
      toast.error('Failed to load community assets');
    } finally {
      setLoading(false);
    }
  };

  const shareAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_assets')
        .update({ 
          is_shared: true,
          shared_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Asset shared with community!');
      await fetchAssets();
    } catch (error) {
      console.error('Error sharing asset:', error);
      toast.error('Failed to share asset');
    }
  };

  const unshareAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_assets')
        .update({ 
          is_shared: false,
          shared_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Asset unshared');
      await fetchAssets();
    } catch (error) {
      console.error('Error unsharing asset:', error);
      toast.error('Failed to unshare asset');
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return {
    assets,
    sharedAssets,
    loading,
    uploading,
    fetchAssets,
    fetchSharedAssets,
    uploadAsset,
    deleteAsset,
    updateAsset,
    markAssetUsed,
    shareAsset,
    unshareAsset,
    getAssetUrl,
    downloadAssetContent
  };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
}
