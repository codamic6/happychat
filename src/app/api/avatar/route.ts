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
  const megaUrlParam = searchParams.get('url');

  if (!megaUrlParam) {
    console.error('[AVATAR PROXY] Error: Missing url parameter');
    return new Response(null, { status: 400 });
  }

  // URL may be double-encoded. We decode it once.
  const megaUrl = decodeURIComponent(megaUrlParam);

  if (!megaUrl.includes('mega.nz')) {
    console.error('[AVATAR PROXY] Error: Invalid domain in URL');
    return new Response(null, { status: 404 });
  }

  const hasKey = megaUrl.includes('#');
  console.log(`[AVATAR PROXY] Processing: ${megaUrl.split('#')[0]} | Contains Key (#): ${hasKey}`);

  if (!hasKey) {
    console.error('[AVATAR PROXY] Error: MEGA URL is missing decryption key fragment (#)');
    // We cannot proceed without the key
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
