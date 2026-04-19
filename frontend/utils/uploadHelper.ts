import { Platform } from 'react-native';

/**
 * Creates a FormData object for image uploads that is compatible with both
 * native (React Native) and modern web browsers (Vercel/Web).
 * 
 * @param uri The URI of the image to upload
 * @param fieldName The form field name (default: 'image')
 * @returns A Promise resolving to a FormData object
 */
export const createUploadFormData = async (uri: string, fieldName: string = 'image'): Promise<FormData> => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    // On Web, we fetch the URI and convert it to a Blob
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Extract filename from URI or use a default
      const filename = uri.split('/').pop()?.split('?')[0] || 'photo.png';
      
      formData.append(fieldName, blob, filename);
    } catch (error) {
      console.error('Error creating Blob for upload:', error);
      throw new Error('Could not prepare image for upload on Web.');
    }
  } else {
    // On Native, we use the standard React Native FormData object pattern
    const filename = uri.split('/').pop()?.split('?')[0] || 'photo.png';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/png';
    
    formData.append(fieldName, {
      uri,
      name: filename,
      type,
    } as any);
  }
  
  return formData;
};
