
'use server';

import { Storage } from 'megajs';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * MEGA Singleton Service
 */
declare global {
  var megaStorage: Storage | undefined;
  var megaAuthPromise: Promise<Storage> | undefined;
}

let isUploading = false;

async function getMegaStorage(): Promise<Storage> {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password || email === 'your-email@example.com' || email.trim() === '') {
    throw new Error('MEGA_EMAIL or MEGA_PASSWORD environment variables are missing.');
  }

  if (global.megaStorage) return global.megaStorage;
  if (global.megaAuthPromise) return global.megaAuthPromise;

  console.log('[DEBUG] MEGA: Initializing single session');

  global.megaAuthPromise = new Promise((resolve, reject) => {
    const storage = new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.5',
      keepalive: true
    }, (err) => {
      if (err) {
        console.error('[DEBUG] MEGA: Auth failed:', err.message);
        global.megaAuthPromise = undefined;
        reject(new Error(`MEGA Auth Failed: ${err.message}`));
      } else {
        console.log('[DEBUG] MEGA: Session established');
        global.megaStorage = storage;
        resolve(storage);
      }
    });
  });

  return global.megaAuthPromise;
}

export async function uploadProfileImageToMega(formData: FormData, userId: string): Promise<{ url: string } | { error: string }> {
  if (isUploading) return { error: 'An upload is already in progress.' };
  
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  isUploading = true;

  try {
    const storage = await getMegaStorage();
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profile-${userId}-${Date.now()}`;

    const uploadedFile = await storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer).complete;

    await uploadedFile.loadAttributes();

    // file.link(true) is essential for including the decryption key (#fragment)
    const rawUrl = await new Promise<string>((resolve, reject) => {
      uploadedFile.link(true, (err, link) => {
        if (err) reject(err);
        else resolve(link);
      });
    });

    console.log('[DEBUG] MEGA: Generated Raw Link:', rawUrl);
    
    if (!rawUrl.includes('#')) {
      throw new Error('Generated MEGA link is missing decryption key.');
    }

    // Save to Firestore immediately
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      profileImageUrl: rawUrl,
      updatedAt: serverTimestamp()
    });

    // Verification step: Read it back to ensure it's saved correctly
    const snap = await getDoc(userRef);
    const savedUrl = snap.data()?.profileImageUrl;
    console.log('[DEBUG] FIRESTORE: Verified Stored Link:', savedUrl);

    return { url: rawUrl };
  } catch (error: any) {
    console.error('[DEBUG] UPLOAD FAILURE:', error.message);
    return { error: error.message || 'Cloud synchronization failed.' };
  } finally {
    isUploading = false;
  }
}
