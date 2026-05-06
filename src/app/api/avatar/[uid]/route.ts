import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Proxy route to serve MEGA images directly to the browser.
 * Reuses session logic implicitly by leveraging initializeFirebase.
 * Provides raw decrypted data with appropriate headers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  try {
    // 1. Get User Profile from Firestore to find the MEGA link
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return new NextResponse(null, { status: 404 });
    }

    const userData = userSnap.data();
    const megaUrl = userData.profileImageUrl;

    if (!megaUrl || !megaUrl.includes('mega.nz')) {
      return new NextResponse(null, { status: 404 });
    }

    // 2. Fetch and Decrypt the file data from MEGA
    const file = MegaFile.fromURL(megaUrl);
    
    // Load attributes (essential for identifying the file)
    await file.loadAttributes();
    
    // Download the decrypted buffer
    const buffer = await file.downloadBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded buffer is empty.');
    }

    // 3. Return the raw image data with correct headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error(`[AVATAR PROXY ERROR for ${uid}]:`, error.message);
    return new NextResponse(null, { status: 404 });
  }
}
