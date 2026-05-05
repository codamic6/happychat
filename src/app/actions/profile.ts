'use server';

import { Storage } from 'megajs';

/**
 * Initializes and returns a ready MEGA storage instance using a Promise.
 */
async function getMegaStorage(): Promise<Storage> {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    throw new Error('MEGA_EMAIL or MEGA_PASSWORD environment variables are missing.');
  }

  console.log('[DEBUG] MEGA: Attempting authentication for:', email);

  return new Promise((resolve, reject) => {
    const storage = new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.5',
      keepalive: true
    }, (err) => {
      if (err) {
        console.error('[DEBUG] MEGA: Authentication failed:', err.message);
        reject(err);
      } else {
        console.log('[DEBUG] MEGA: Authentication successful and ready');
        resolve(storage);
      }
    });
  });
}

/**
 * Uploads a profile image to MEGA storage and returns a permanent public link.
 * Uses .complete to ensure the file is committed to the cloud drive.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  console.log(`[DEBUG] UPLOAD: Received "${file.name}" - size: ${file.size} bytes`);

  try {
    // 1. Initialize Storage
    const storage = await getMegaStorage();

    // 2. Prepare Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length === 0) {
      throw new Error('Received an empty file buffer.');
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    console.log(`[DEBUG] UPLOAD: Starting upload for ${fileName}...`);

    // 3. Perform Upload and wait for COMPLETION
    // .complete is a promise that resolves only after the file is committed
    const uploadedFile = await storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer).complete;

    console.log('[DEBUG] UPLOAD: Successfully committed to MEGA drive');

    // 4. Generate Permanent Public Link (with decryption key)
    // We wrap .link in a promise to ensure it resolves correctly across different SDK versions
    const publicUrl = await new Promise<string>((resolve, reject) => {
      uploadedFile.link(true, (err, link) => {
        if (err) reject(err);
        else resolve(link);
      });
    });
    
    if (!publicUrl) {
      throw new Error('Upload succeeded but failed to generate a public link.');
    }

    console.log('[DEBUG] UPLOAD: Generated Public Link:', publicUrl);

    return { url: publicUrl };
  } catch (error: any) {
    console.error('[DEBUG] UPLOAD FAILURE:', error.message);
    
    // Fallback for development if credentials are valid but connection fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEBUG] Dev Fallback: Using picsum placeholder');
      return { url: `https://picsum.photos/seed/${Date.now()}/400/400` };
    }

    return { 
      error: `Cloud Sync Error: ${error.message || 'Check MEGA credentials and connectivity'}` 
    };
  }
}
