export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  friendlyMessage?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

import { auth } from '../firebase';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let friendlyMessage = 'عذراً، حدث خطأ أثناء التعامل مع قاعدة البيانات.';
  if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('resource-exhausted')) {
    friendlyMessage = 'تم تجاوز حصة الاستخدام المجانية لليوم. يرجى المحاولة مرة أخرى لاحقاً.';
  } else if (errorMessage.toLowerCase().includes('permission-denied')) {
    friendlyMessage = 'ليس لديك الصلاحية للقيام بهذه العملية.';
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    friendlyMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
