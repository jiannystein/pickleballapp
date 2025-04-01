import { join } from 'path';
import { unlink } from 'fs/promises';

// Extract the filename from the photoUrl
const photoUrl = photo.photoUrl;
const filename = photoUrl.split('/').pop();

if (filename) {
  try {
    // Attempt to delete the file from the server
    const filePath = join(process.cwd(), 'public', 'uploads', 'sessions', filename);
    await unlink(filePath);
    console.log(`Successfully deleted file: ${filePath}`);
  } catch (fileError) {
    // Log but don't fail if file deletion fails
    console.error('Could not delete file:', fileError);
  }
}