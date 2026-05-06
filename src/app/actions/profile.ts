'use server';

import { Storage } from 'megajs';

/**
 * MEGA Singleton Service
 * We store the storage instance globally to reuse the authenticated session
 * and avoid repeated logins that cause MEGA account locking.
 */
declare global {
  var megaStorage: Storage | undefined;
  var megaAuthPromise: Promise<Storage> | undefined;
}

let isUploading = false;

/**
 * Securely retrieves the authenticated MEGA storage instance.
 * Reuses existing session if available.
 */
async function getMegaStorage(): Promise<Storage> {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    throw new Error('MEGA_EMAIL or MEGA_PASSWORD environment variables are missing.');
  }

  // If already authenticated, return instance
  if (global.megaStorage) return global.megaStorage;

  // If authentication is already in progress, wait for it
  if (global.megaAuthPromise) return global.megaAuthPromise;

  console.log('[DEBUG] MEGA: Initializing single session for:', email);

  global.megaAuthPromise = new Promise((resolve, reject) => {
    const storage = new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.5',
      keepalive: true
    }, (err) => {
      if (err) {
        console.error('[DEBUG] MEGA: Auth failed:', err.message);
        global.megaAuthPromise = undefined; // Reset so we can try again
        reject(new Error(`MEGA Authentication Failed: ${err.message}`));
      } else {
        console.log('[DEBUG] MEGA: Session established successfully');
        global.megaStorage = storage;
        resolve(storage);
      }
    });
  });

  return global.megaAuthPromise;
}

/**
 * Securely uploads a profile image to MEGA storage and returns a permanent public link.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  if (isUploading) return { error: 'An upload is already in progress. Please wait.' };
  
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  isUploading = true;
  console.log(`[DEBUG] UPLOAD: Starting upload for "${file.name}"`);

  try {
    const storage = await getMegaStorage();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length === 0) throw new Error('File buffer is empty.');

    const fileName = `profile-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    // Perform Upload
    const uploadedFile = await storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer).complete;

    console.log('[DEBUG] UPLOAD: File committed to MEGA');

    // Generate Permanent Public Link (with decryption key)
    const publicUrl = await new Promise<string>((resolve, reject) => {
      uploadedFile.link(true, (err, link) => {
        if (err) reject(err);
        else resolve(link);
      });
    });
    
    if (!publicUrl) throw new Error('Could not generate public link.');

    return { url: publicUrl };
  } catch (error: any) {
    console.error('[DEBUG] MEGA UPLOAD FAILURE:', error.message);
    return { 
      error: error.message || 'Cloud synchronization failed.'
    };
  } finally {
    isUploading = false;
  }
}
