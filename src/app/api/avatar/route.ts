import { NextRequest } from 'next/server';
import { File as MegaFile } from 'megajs';

export const dynamic = 'force-dynamic';

/**
 * Optimized Proxy Route
 * Directly decrypts MEGA buffers based on a URL parameter.
 * This avoids Firestore permission issues on the server.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const megaUrl = searchParams.get('url');

  if (!megaUrl || !megaUrl.includes('mega.nz')) {
    return new Response(null, { status: 404 });
  }

  try {
    // megajs fromURL handles decryption via the URL fragment (#key)
    const file = MegaFile.fromURL(megaUrl);
    
    // Load attributes to verify the file and prepare for download
    await file.loadAttributes();
    
    // Download the raw decrypted buffer
    const buffer = await file.downloadBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded buffer is empty.');
    }

    // Return the raw image data with appropriate cache and type headers
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error(`[AVATAR PROXY ERROR]:`, error.message);
    return new Response(null, { status: 404 });
  }
}
