import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Uploads a file to the specified directory and returns the URL path
 */
export async function uploadFile(
  file: File, 
  directory: string, 
  prefix: string = '',
  customFilename?: string
): Promise<string> {
  try {
    // Create unique filename if not provided
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = customFilename || `${prefix}-${timestamp}.${extension}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', directory);
    await mkdir(uploadDir, { recursive: true });

    // Write file to disk
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Return the public URL
    return `/${directory}/${filename}`;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Deletes a file from the public directory if it exists
 */
export async function deleteFile(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  
  try {
    // Only process URLs that are relative to our public directory
    if (url.startsWith('/')) {
      // Convert URL to filesystem path
      const filePath = join(process.cwd(), 'public', url.substring(1));
      
      // Check if file exists
      if (existsSync(filePath)) {
        // Delete the file
        await unlink(filePath);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
}

/**
 * Parses form data for file upload
 */
export async function parseFormWithFile(formData: FormData, fieldName: string = 'file') {
  const file = formData.get(fieldName) as File | null;
  
  // Remove the file field from formData to get the rest of the data
  const data: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key !== fieldName) {
      data[key] = value;
    }
  });
  
  return { file, data };
} 