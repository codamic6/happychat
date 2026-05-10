
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  console.log(`[Firestore DEBUG] TRACE: setDocumentNonBlocking. Path: ${docRef.path}`);
  console.log(`[Firestore DEBUG] Payload:`, data);
  
  setDoc(docRef, data, options).catch(error => {
    console.error(`[Firestore DEBUG] setDoc FAILED:`, error);
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      })
    )
  })
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  console.log(`[Firestore DEBUG] TRACE: addDocumentNonBlocking. Path: ${colRef.path}`);
  console.log(`[Firestore DEBUG] Payload:`, data);

  const promise = addDoc(colRef, data)
    .then((docRef) => {
      console.log(`[Firestore DEBUG] addDoc SUCCESS. New ID: ${docRef.id}`);
      return docRef;
    })
    .catch(error => {
      console.error(`[Firestore DEBUG] addDoc FAILED:`, error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      );
      throw error;
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  console.log(`[Firestore DEBUG] TRACE: updateDocumentNonBlocking. Path: ${docRef.path}`);
  console.log(`[Firestore DEBUG] Payload:`, data);

  updateDoc(docRef, data)
    .then(() => {
      console.log(`[Firestore DEBUG] updateDoc SUCCESS: ${docRef.id}`);
    })
    .catch(error => {
      console.error(`[Firestore DEBUG] updateDoc FAILED:`, error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      );
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  console.log(`[Firestore DEBUG] TRACE: deleteDocumentNonBlocking. Path: ${docRef.path}`);

  deleteDoc(docRef)
    .then(() => {
      console.log(`[Firestore DEBUG] deleteDoc SUCCESS: ${docRef.id}`);
    })
    .catch(error => {
      console.error(`[Firestore DEBUG] deleteDoc FAILED:`, error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      );
    });
}
