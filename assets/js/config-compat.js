export { auth, db, storage, functions, googleProvider } from '../../src/app/core/services/firebase/index.js';
export { requireAuth } from '../../src/app/core/middleware/authGuard.js';
import { showToast } from '../../src/app/shared/components/ui/Toast.js';
export { formatDate } from '../../src/app/shared/utils/formatters.js';
export { Validators, validateField, validateForm, setupRealTimeValidation } from '../../src/app/shared/utils/validators.js';

export function showMessage(message, type = 'info') {
  const typeMap = {
    'success': 'success',
    'error': 'error',
    'info': 'info',
    'warning': 'warning'
  };
  showToast(message, typeMap[type] || 'info');
}
