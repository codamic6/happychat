import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Proxy route to serve MEGA images directly to the browser.
 * Decrypts the buffer and serves it with the correct content headers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  if (!uid || uid === 'undefined') {
    return new NextResponse(null, { status: 404 });
  }

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
    // megajs fromURL handles the decryption if the key is in the hash (#)
    const file = MegaFile.fromURL(megaUrl);
    
    // Attributes contain filename and size, essential for decryption process
    await file.loadAttributes();
    
    // Download the raw decrypted buffer
    const buffer = await file.downloadBuffer();
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Downloaded buffer is empty.');
    }

    // 3. Return the raw image data with appropriate cache and type headers
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error(`[AVATAR PROXY ERROR for ${uid}]:`, error.message);
    return new Response(null, { status: 404 });
  }
}
