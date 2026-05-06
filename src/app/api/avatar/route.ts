
import { NextRequest } from 'next/server';
import { File as MegaFile } from 'megajs';

export const dynamic = 'force-dynamic';

/**
 * Optimized Proxy Route
 * Directly decrypts MEGA buffers based on a URL parameter.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const megaUrlParam = searchParams.get('url');

  if (!megaUrlParam) {
    console.error('[AVATAR PROXY] Error: Missing url parameter');
    return new Response(null, { status: 400 });
  }

  // URL may be encoded. Decode to ensure fragments are handled correctly.
  const megaUrl = decodeURIComponent(megaUrlParam);

  if (!megaUrl.includes('mega.nz')) {
    console.error('[AVATAR PROXY] Error: Invalid domain in URL');
    return new Response(null, { status: 404 });
  }

  const hasKey = megaUrl.includes('#');
  console.log(`[AVATAR PROXY] Processing: ${megaUrl.split('#')[0]} | Contains Key (#): ${hasKey}`);

  if (!hasKey) {
    console.error('[AVATAR PROXY] Error: MEGA URL is missing decryption key fragment (#). Decoding attempt:', megaUrl);
    return new Response(null, { status: 404 });
  }

  try {
    const file = MegaFile.fromURL(megaUrl);
    
    // CRITICAL: Load attributes before downloading to ensure decryption context is initialized
    await file.loadAttributes();
    
    // Download the raw decrypted buffer
    const buffer = await file.downloadBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded buffer is empty.');
    }

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
