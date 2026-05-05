'use server';

import { Storage } from 'megajs';

/**
 * Initializes and returns a ready MEGA storage instance.
 * Credentials are fetched from environment variables for security.
 */
async function getMegaStorage(): Promise<Storage> {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    throw new Error('MEGA_EMAIL or MEGA_PASSWORD environment variables are missing.');
  }

  return new Promise((resolve, reject) => {
    const storage = new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.1'
    }, (err) => {
      if (err) reject(err);
      else resolve(storage);
    });
  });
}

/**
 * Uploads a profile image to MEGA storage and returns a permanent public link.
 * Handles the stream-based upload process and public link generation.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  try {
    // 1. Initialize Storage
    const storage = await getMegaStorage();

    // 2. Prepare File Data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    // 3. Perform Upload
    // The 'complete' property on the upload stream is a promise that resolves to the file object
    const uploadedFile = await storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer).complete;

    // 4. Generate Permanent Public Link
    // link(true) ensures the link is public and includes the key for decryption
    const publicUrl = await uploadedFile.link(true);

    if (!publicUrl) {
      throw new Error('Upload successful but failed to generate public access link.');
    }

    // MEGA links often need a slight delay or specific formatting for direct embedding, 
    // but the .link() method provides the base shareable URL.
    return { url: publicUrl };
  } catch (error: any) {
    console.error('MEGA Core Service Error:', error);
    
    // Fallback for development if credentials are valid but connection fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('MEGA Upload failed, using development placeholder.');
      return { url: `https://picsum.photos/seed/${Date.now()}/400/400` };
    }

    return { 
      error: `MEGA Storage Sync Failed: ${error.message || 'Internal connection error'}` 
    };
  }
}
