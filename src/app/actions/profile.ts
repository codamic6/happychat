'use server';

import { Storage } from 'megajs';

/**
 * Uploads a file to MEGA storage and returns a public link.
 * Falls back to a high-quality placeholder if credentials are missing for prototyping.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  // Fallback for prototyping if credentials are not yet configured or are placeholders
  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    console.warn('MEGA credentials missing or default. Using Picsum fallback for development.');
    // Return a random high-quality placeholder URL from Picsum
    // We use the timestamp and a random number to ensure a fresh "upload-like" behavior
    const randomSeed = Math.floor(Math.random() * 1000);
    return { url: `https://picsum.photos/seed/${randomSeed}/400/400` };
  }

  try {
    // 1. Authenticate with MEGA
    // We wrap this in a promise to handle the 'ready' state properly
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
    // The upload method returns a stream-like object with a .complete promise in newer versions
    const uploadOptions = {
      name: `${Date.now()}-${file.name.replace(/\s+/g, '_')}`,
      size: buffer.length
    };

    const uploadedFile = await storage.upload(uploadOptions, buffer).complete;

    // 4. Generate public link
    // Note: Link generation might take a moment to be available on some MEGA nodes
    const publicUrl = await uploadedFile.link();

    if (!publicUrl) {
      throw new Error('Failed to generate a public link for the uploaded file.');
    }

    return { url: publicUrl };
  } catch (error: any) {
    console.error('MEGA Upload Error Detailed:', error);
    return { 
      error: `MEGA Storage Error: ${error.message || 'Connection failed'}. Please verify MEGA_EMAIL and MEGA_PASSWORD.` 
    };
  }
}
