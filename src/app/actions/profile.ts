'use server';

import { Storage } from 'megajs';

/**
 * Initializes and returns a ready MEGA storage instance.
 * Credentials are fetched from environment variables.
 */
async function getMegaStorage(): Promise<Storage> {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    throw new Error('MEGA_EMAIL or MEGA_PASSWORD environment variables are missing.');
  }

  console.log('[DEBUG] MEGA: Initializing Storage for:', email);

  return new Promise((resolve, reject) => {
    const storage = new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.5'
    }, (err) => {
      if (err) {
        console.error('[DEBUG] MEGA: Auth Error:', err);
        reject(err);
      } else {
        console.log('[DEBUG] MEGA: Auth Success');
        resolve(storage);
      }
    });
  });
}

/**
 * Uploads a profile image to MEGA storage and returns a permanent public link.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  console.log('[DEBUG] MEGA UPLOAD PIPELINE START');
  console.log('[DEBUG] File Name:', file.name);
  console.log('[DEBUG] File Size:', file.size);

  try {
    // 1. Initialize Storage
    const storage = await getMegaStorage();

    // 2. Prepare File Data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    console.log('[DEBUG] MEGA: Starting upload stream...');

    // 3. Perform Upload
    // .complete is a promise that resolves to the File object once finished
    const uploadStream = storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer);

    const uploadedFile = await uploadStream.complete;
    console.log('[DEBUG] MEGA: Upload completed successfully');

    // 4. Generate Permanent Public Link
    // .link(true) returns a link that includes the decryption key
    const publicUrl = await uploadedFile.link(true);
    
    if (!publicUrl) {
      console.error('[DEBUG] MEGA: Failed to generate public link');
      throw new Error('Upload successful but failed to generate public access link.');
    }

    console.log('[DEBUG] MEGA: Public Link Generated:', publicUrl);
    console.log('[DEBUG] MEGA UPLOAD PIPELINE SUCCESS');

    return { url: publicUrl };
  } catch (error: any) {
    console.error('[DEBUG] MEGA CORE FAILURE:', error);
    
    // Fallback for development if credentials are valid but connection fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEBUG] Using development placeholder due to error');
      return { url: `https://picsum.photos/seed/${Date.now()}/400/400` };
    }

    return { 
      error: `MEGA Sync Failed: ${error.message || 'Internal connection error'}` 
    };
  }
}
