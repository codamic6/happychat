'use server';

import { Storage } from 'megajs';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * MEGA Singleton Service
 * Reuses a single authenticated session to prevent MEGA security locks.
 */
declare global {
  var megaStorage: Storage | undefined;
  var megaAuthPromise: Promise<Storage> | undefined;
}

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

let isUploadingGlobal = false;

export async function uploadProfileImageToMega(formData: FormData, userId: string): Promise<{ url: string } | { error: string }> {
  if (isUploadingGlobal) return { error: 'An upload is already in progress.' };
  
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  isUploadingGlobal = true;

  try {
    const storage = await getMegaStorage();
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profile-${userId}-${Date.now()}`;

    console.log(`[DEBUG] UPLOAD: Starting for user ${userId}, size: ${buffer.length}`);

    // 1. Upload the file
    const uploadedFile = await storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer).complete;

    // 2. Generate the PERMANENT public link with decryption key (#)
    // We retry because MEGA API sometimes takes a second to generate the fragment
    let rawUrl = '';
    for (let i = 0; i < 5; i++) {
      rawUrl = await new Promise<string>((resolve) => {
        uploadedFile.link(true, (err, link) => {
          if (err) resolve('');
          else resolve(link || '');
        });
      });

      if (rawUrl && rawUrl.includes('#')) {
        console.log(`[DEBUG] MEGA: Success! Decryption key found in link.`);
        break;
      }
      
      console.log(`[DEBUG] MEGA: Link missing #, retrying in 1.5s... (Attempt ${i + 1})`);
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!rawUrl || !rawUrl.includes('#')) {
      throw new Error('MEGA Link generation failed to include the key fragment (#). Please try uploading again.');
    }

    console.log('[DEBUG] MEGA: Captured RAW URL with Key:', rawUrl);

    // 3. Save the RAW URL to Firestore
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      profileImageUrl: rawUrl,
      updatedAt: serverTimestamp()
    });

    return { url: rawUrl };
  } catch (error: any) {
    console.error('[DEBUG] UPLOAD FAILURE:', error.message);
    return { error: error.message || 'Cloud synchronization failed.' };
  } finally {
    isUploadingGlobal = false;
  }
}
