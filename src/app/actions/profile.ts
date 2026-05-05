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

  // Fallback for prototyping if credentials are not yet configured
  if (!email || !password || email === 'your-email@example.com') {
    console.warn('MEGA credentials missing. Using placeholder fallback for demo.');
    // Return a random high-quality placeholder URL from Picsum
    return { url: `https://picsum.photos/seed/${Date.now()}/400/400` };
  }

  try {
    // 1. Authenticate with MEGA
    const storage = await new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.0'
    }).ready;

    // 2. Prepare file data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
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
    return { error: `MEGA Upload Failed: ${error.message || 'Check your credentials in .env'}` };
  }
}
