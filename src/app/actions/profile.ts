
'use server';

import { Storage } from 'megajs';

/**
 * Uploads a file to MEGA storage and returns a public link.
 * Credentials must be set in .env as MEGA_EMAIL and MEGA_PASSWORD.
 */
export async function uploadProfileImageToMega(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password) {
    console.error('MEGA credentials missing in environment variables.');
    return { error: 'Storage service configuration error' };
  }

  try {
    // 1. Authenticate with MEGA
    const storage = await new Storage({ email, password }).ready;

    // 2. Prepare file data
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 3. Upload to MEGA
    const uploadedFile = await storage.upload({
      name: `${Date.now()}-${file.name}`,
      size: buffer.length
    }, buffer).complete;

    // 4. Generate public link
    const publicUrl = await uploadedFile.link();

    return { url: publicUrl };
  } catch (error: any) {
    console.error('MEGA Upload Error:', error);
    return { error: error.message || 'Failed to upload image to MEGA' };
  }
}
