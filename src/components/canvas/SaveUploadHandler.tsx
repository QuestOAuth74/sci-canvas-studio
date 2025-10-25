import { useEffect } from 'react';
import { useUserAssets } from '@/hooks/useUserAssets';
import { toast } from 'sonner';

export function SaveUploadHandler() {
  const { uploadAsset } = useUserAssets();

  useEffect(() => {
    const handleSaveUpload = async (event: CustomEvent) => {
      const { file } = event.detail;
      if (!file) return;

      try {
        const result = await uploadAsset({
          file,
          category: 'uncategorized',
        });

        if (result) {
          toast.success('Image added to canvas and saved to your assets');
        }
      } catch (error) {
        console.error('Error saving upload to library:', error);
        toast.error('Failed to save to library');
      }
    };

    window.addEventListener('saveUploadToLibrary', handleSaveUpload as EventListener);

    return () => {
      window.removeEventListener('saveUploadToLibrary', handleSaveUpload as EventListener);
    };
  }, [uploadAsset]);

  return null;
}
