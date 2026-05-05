
import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Proxy route to serve MEGA images directly to the browser.
 * It fetches the file from MEGA, decrypts it, and streams the raw bytes.
 * Now strictly handles real images only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  try {
    console.log(`[AVATAR PROXY] Requesting real avatar for UID: ${uid}`);
    
    // 1. Get User Profile from Firestore to find the MEGA link
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      console.warn(`[AVATAR PROXY] User ${uid} not found in Firestore.`);
      return new NextResponse(null, { status: 404 });
    }

    const userData = userSnap.data();
    const megaUrl = userData.profileImageUrl;

    // No valid MEGA URL = No Image. No more picsum fallbacks here.
    if (!megaUrl || !megaUrl.includes('mega.nz')) {
      console.log(`[AVATAR PROXY] No real identity image found for ${uid}.`);
      return new NextResponse(null, { status: 404 });
    }

    // 2. Fetch and Decrypt the file data from MEGA
    console.log(`[AVATAR PROXY] Syncing from MEGA...`);
    const file = MegaFile.fromURL(megaUrl);
    
    // Load attributes (essential for identifying the file)
    await file.loadAttributes();
    
    // Download the decrypted buffer
    const buffer = await file.downloadBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded buffer is empty.');
    }

    console.log(`[AVATAR PROXY] Identity data synchronized: ${buffer.length} bytes`);

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
    // Return 404 so frontend can handle fallback to initials/icons
    return new NextResponse(null, { status: 404 });
  }
}
