
import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const dynamic = 'force-dynamic';

/**
 * Avatar Proxy Route [uid]
 * Reconstructs the MEGA URL server-side using stored ID and Key components.
 * This ensures the decryption fragment (#) is never lost to the browser.
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

    // Priority 1: Use separated components (Modern)
    if (megaId && megaKey) {
      finalUrl = `https://mega.nz/file/${megaId}#${megaKey}`;
    } 
    // Priority 2: Use legacy profileImageUrl if it has the key
    else if (profileImageUrl && profileImageUrl.includes('#')) {
      finalUrl = profileImageUrl;
    }

    if (!finalUrl) {
      console.error(`[AVATAR PROXY] No valid decryption key found for user: ${uid}`);
      return new NextResponse('No valid image data', { status: 404 });
    }

    console.log(`[AVATAR PROXY] Reconstructing stream for ${uid} from internal components.`);

    // Initialize MEGA file using the raw reconstructed string
    const file = MegaFile.fromURL(finalUrl);
    
    // Download the raw decrypted buffer
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
