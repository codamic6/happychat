
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

  global.megaAuthPromise = new Promise((resolve, reject) => {
    const storage = new Storage({ 
      email, 
      password,
      userAgent: 'HappyChat/2.5',
      keepalive: true
    }, (err) => {
      if (err) {
        global.megaAuthPromise = undefined;
        reject(new Error(`MEGA Auth Failed: ${err.message}`));
      } else {
        global.megaStorage = storage;
        resolve(storage);
      }
    });
  });

  return global.megaAuthPromise;
}

export async function uploadProfileImageToMega(formData: FormData, userId: string): Promise<{ success: boolean } | { error: string }> {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  try {
    const storage = await getMegaStorage();
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `avatar-${userId}-${Date.now()}`;

    // 1. Upload the file
    const uploadedFile = await storage.upload({
      name: fileName,
      size: buffer.length
    }, buffer).complete;

    // 2. CRITICAL: Load attributes to ensure internal metadata (like handle/key) is ready
    await uploadedFile.loadAttributes();

    // 3. Extract ID and Key directly from the file object
    // This is the most stable way to get the components without browser URL issues.
    let megaId = '';
    let megaKey = '';
    let fullUrl = '';

    // Retry loop to ensure MEGA internal indexing has finished and returned the hash (#)
    for (let i = 0; i < 5; i++) {
      fullUrl = await new Promise<string>((resolve) => {
        uploadedFile.link(true, (err, link) => {
          if (err) resolve('');
          else resolve(link || '');
        });
      });

      console.log(`[MEGA UPLOAD ATTEMPT ${i}] Generated URL: ${fullUrl} | Has #: ${fullUrl.includes('#')}`);

      if (fullUrl && fullUrl.includes('#')) {
        const parts = fullUrl.split('#');
        megaKey = parts[1];
        megaId = parts[0].split('/').pop() || '';
        break;
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!megaId || !megaKey) {
      throw new Error('MEGA failed to generate a decryption key fragment (#). Please try again.');
    }

    console.log(`[MEGA UPLOAD SUCCESS] UID: ${userId} | ID: ${megaId} | Key length: ${megaKey.length}`);

    // 4. Save components to Firestore
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      megaId,
      megaKey,
      profileImageUrl: fullUrl, // Keep for legacy if needed, but proxy will use Id/Key
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    console.error('[MEGA UPLOAD ERROR]:', error.message);
    return { error: error.message || 'Cloud synchronization failed.' };
  }
}
