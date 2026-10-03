import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence non-critical backend connection warnings in sandbox environments
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalForceLongPolling: true,
  },
  (firebaseConfig as any).firestoreDatabaseId || '(default)'
);

