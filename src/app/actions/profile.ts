'use server';

import { Storage } from 'megajs';

/**
 * Initializes and returns a ready MEGA storage instance.
 * No fallbacks - strictly authenticates with environment variables.
 */
async function getMegaStorage(): Promise<Storage> {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    throw new Error('MEGA_EMAIL or MEGA_PASSWORD environment variables are missing. Please add them to your project environment.');
  }

  console.log('[DEBUG] MEGA: Initializing connection for:', email);

  return new Promise((resolve, reject) => {
    const storage = new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.5',
      keepalive: true
    }, (err) => {
      if (err) {
        console.error('[DEBUG] MEGA: Auth failed:', err.message);
        reject(new Error(`MEGA Authentication Failed: ${err.message}`));
      } else {
        console.log('[DEBUG] MEGA: Connection established and ready');
        resolve(storage);
      }
    });
  });
}

/**
 * Securely uploads a profile image to MEGA storage and returns a permanent public link.
 * This function waits for the upload to COMPLETELY commit before generating the link.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  console.log(`[DEBUG] UPLOAD: Processing "${file.name}" (${file.size} bytes)`);

  try {
    // 1. Initialize Storage (Thows error if credentials missing)
    const storage = await getMegaStorage();

    // 2. Prepare Data Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length === 0) {
      throw new Error('File buffer is empty.');
    }

    const fileName = `profile-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    console.log(`[DEBUG] UPLOAD: Sending ${fileName} to Cloud Drive...`);

    // 3. Perform Upload and wait for full COMMITMENT
    const uploadedFile = await storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer).complete;

    console.log('[DEBUG] UPLOAD: Committed successfully');

    // 4. Generate Permanent Public Link (with decryption key)
    const publicUrl = await new Promise<string>((resolve, reject) => {
      uploadedFile.link(true, (err, link) => {
        if (err) {
          console.error('[DEBUG] LINK GEN FAILED:', err);
          reject(err);
        } else {
          resolve(link);
        }
      });
    });
    
    if (!publicUrl) {
      throw new Error('Upload finished but could not generate public link.');
    }

    console.log('[DEBUG] UPLOAD COMPLETE: URL:', publicUrl);

    return { url: publicUrl };
  } catch (error: any) {
    console.error('[DEBUG] MEGA PIPELINE FAILURE:', error.message);
    return { 
      error: error.message || 'An unexpected error occurred during cloud synchronization.'
    };
  }
}
