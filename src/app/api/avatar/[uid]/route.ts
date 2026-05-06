import { NextRequest, NextResponse } from 'next/server';

/**
 * Backward compatibility route that redirects to the new URL-based proxy.
 * This ensures any remaining UID-based calls don't crash but encourages migration.
 */
export async function GET(request: NextRequest) {
  return new NextResponse('Please use /api/avatar?url=... for decrypted MEGA images.', { status: 404 });
}
