
import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Proxy route to serve MEGA images directly to the browser.
 * It fetches the file from MEGA, decrypts it, and streams the raw bytes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  try {
    console.log(`[AVATAR PROXY] Requesting avatar for UID: ${uid}`);
    
    // 1. Get User Profile from Firestore to find the MEGA link
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      console.warn(`[AVATAR PROXY] User ${uid} not found in Firestore.`);
      return NextResponse.redirect(`https://picsum.photos/seed/${uid}/200/200`);
    }

    const userData = userSnap.data();
    const megaUrl = userData.profileImageUrl;

    if (!megaUrl || !megaUrl.includes('mega.nz')) {
      console.log(`[AVATAR PROXY] No MEGA URL found for ${uid}, using fallback.`);
      return NextResponse.redirect(`https://picsum.photos/seed/${uid}/200/200`);
    }

    // 2. Fetch and Decrypt the file data from MEGA
    console.log(`[AVATAR PROXY] Fetching from MEGA: ${megaUrl.substring(0, 30)}...`);
    const file = MegaFile.fromURL(megaUrl);
    
    // Load attributes (essential for identifying the file)
    await file.loadAttributes();
    
    // Download the decrypted buffer
    const buffer = await file.downloadBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded buffer is empty.');
    }

    console.log(`[AVATAR PROXY] Successfully decrypted ${buffer.length} bytes for ${uid}`);

    // 3. Return the raw image data with correct headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('[AVATAR PROXY ERROR]:', error.message);
    // Return a generic fallback on error so the UI doesn't break
    return NextResponse.redirect(`https://picsum.photos/seed/${uid}/200/200`);
  }
}
