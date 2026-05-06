
import { NextRequest, NextResponse } from 'next/server';
import { File as MegaFile } from 'megajs';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const dynamic = 'force-dynamic';

/**
 * Avatar Proxy Route [uid]
 * Fetches the raw MEGA URL from Firestore server-side to ensure fragments (#key) are preserved.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  if (!uid) {
    return new NextResponse('Missing UID', { status: 400 });
  }

  try {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return new NextResponse('User not found', { status: 404 });
    }

    const megaUrl = userSnap.data()?.profileImageUrl;

    if (!megaUrl || !megaUrl.includes('mega.nz')) {
      return new NextResponse('No profile image URL', { status: 404 });
    }

    if (!megaUrl.includes('#')) {
      console.error(`[AVATAR PROXY] Error: Stored URL for ${uid} is missing decryption key: ${megaUrl}`);
      return new NextResponse('Missing decryption key in stored URL', { status: 404 });
    }

    // megajs handles the full URL with fragment internally
    const file = MegaFile.fromURL(megaUrl);
    await file.loadAttributes();
    const buffer = await file.downloadBuffer();

    if (!buffer || buffer.length === 0) {
      throw new Error('Empty buffer downloaded');
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
    console.error(`[AVATAR PROXY ERROR] for UID ${uid}:`, error.message);
    return new NextResponse('Failed to process image', { status: 404 });
  }
}
