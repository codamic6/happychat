
import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const dynamic = 'force-dynamic';

/**
 * Avatar Proxy Route [uid]
 * Reconstructs the MEGA URL server-side from ID and KEY stored in Firestore.
 * This ensures the decryption key (#fragment) is never lost.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  if (!uid) return new NextResponse('Missing UID', { status: 400 });

  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return new NextResponse('User not found', { status: 404 });

    const userData = userSnap.data();
    const { megaId, megaKey, profileImageUrl } = userData;

    let finalUrl = '';

    // Reconstruct the link only on the server to keep the # fragment intact.
    if (megaId && megaKey) {
      finalUrl = `https://mega.nz/file/${megaId}#${megaKey}`;
    } 
    else if (profileImageUrl && profileImageUrl.includes('#')) {
      finalUrl = profileImageUrl;
    }

    if (!finalUrl) {
      console.error(`[AVATAR PROXY] No valid decryption data found for user: ${uid}`);
      return new NextResponse('No valid image data', { status: 404 });
    }

    console.log(`[AVATAR PROXY] Decrypting: ${finalUrl.split('#')[0]}...#PRESENT`);

    // Initialize MEGA file
    const file = MegaFile.fromURL(finalUrl);
    
    // CRITICAL STEP: Load attributes before downloading to ensure decryption context is initialized
    await file.loadAttributes();
    
    // Download the decrypted buffer
    const buffer = await file.downloadBuffer();

    if (!buffer || buffer.length === 0) throw new Error('Empty buffer downloaded');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error(`[AVATAR PROXY ERROR] UID ${uid}:`, error.message);
    return new NextResponse('Image processing failed', { status: 404 });
  }
}
