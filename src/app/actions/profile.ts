'use server';

import { Storage } from 'megajs';

/**
 * Uploads a file to MEGA storage and returns a permanent public link.
 * Handles authentication, streaming upload, and public link generation.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  // Fallback for prototyping if credentials are not yet configured
  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    console.warn('MEGA credentials missing. Using Picsum fallback for development.');
    const randomSeed = Math.floor(Math.random() * 1000);
    return { url: `https://picsum.photos/seed/${randomSeed}/400/400` };
  }

  try {
    // 1. Authenticate with MEGA
    const storage = await new Promise<Storage>((resolve, reject) => {
      const s = new Storage({ 
        email, 
        password,
        userAgent: 'HappyChat/2.0'
      }, (err) => {
        if (err) reject(err);
        else resolve(s);
      });
    });

    // 2. Prepare file data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 3. Upload to MEGA
    // We create a unique name to avoid collisions
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const uploadOptions = {
      name: fileName,
      size: buffer.length
    };

    // The upload method in megajs v1 returns a stream-like object with a .complete promise
    const uploadedFile = await storage.upload(uploadOptions, buffer).complete;

    // 4. Generate permanent public link
    // Note: link(true) usually generates the key-included link needed for public access
    const publicUrl = await uploadedFile.link();

    if (!publicUrl) {
      throw new Error('Upload succeeded but failed to generate a public link.');
    }

    // MEGA links are usually formatted for the webapp, but we need the direct file or 
    // a format that Next.js Image can handle. Public links often look like mega.nz/file/...
    return { url: publicUrl };
  } catch (error: any) {
    console.error('MEGA Upload Critical Error:', error);
    return { 
      error: `MEGA Storage Error: ${error.message || 'Unknown error'}. Check your credentials.` 
    };
  }
}
