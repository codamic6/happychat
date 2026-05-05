
import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase, getSdks } from '@/firebase';

/**
 * Proxy route to serve MEGA images directly to the browser.
 * This is necessary because MEGA public links are not direct image URLs.
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
      return new NextResponse('User not found', { status: 404 });
    }

    const userData = userSnap.data();
    const megaUrl = userData.profileImageUrl;

    if (!megaUrl || !megaUrl.includes('mega.nz')) {
      // Fallback to a default placeholder if no MEGA URL exists
      return NextResponse.redirect(`https://picsum.photos/seed/${uid}/200/200`);
    }

    // 2. Fetch the file data from MEGA
    // Using fromURL allows us to access public files without full account login
    const file = MegaFile.fromURL(megaUrl);
    const attributes = await file.loadAttributes();
    
    const buffer = await file.downloadBuffer();

    // 3. Return the raw image data with correct headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg', // Or dynamic based on attributes if needed
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error('[AVATAR PROXY ERROR]:', error.message);
    return new NextResponse('Error loading image', { status: 500 });
  }
}
