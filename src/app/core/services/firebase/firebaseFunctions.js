import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirebaseApp } from './firebaseApp.js';
import { env } from '../../config/env.js';

let functions = null;

export function getFirebaseFunctions() {
  if (!functions) {
    const app = getFirebaseApp();
    functions = getFunctions(app);

    if (env.app.env === 'development' && env.features.debug) {
      console.log('[Firebase] Functions initialized');
    }
  }

  return functions;
}

export function connectToFunctionsEmulator(host = 'localhost', port = 5001) {
  const functions = getFirebaseFunctions();
  connectFunctionsEmulator(functions, host, port);
  console.log(`[Firebase] Functions emulator connected at ${host}:${port}`);
}

export { functions };
