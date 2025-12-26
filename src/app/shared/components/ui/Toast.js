import DOMPurify from 'dompurify';

export function showToast(message, type = 'info', duration = 4000) {
  const sanitizedMessage = DOMPurify.sanitize(message);
  const existingToast = document.getElementById('global-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'global-toast';
  toast.className = `fixed bottom-6 right-6 max-w-md bg-gray-900 border rounded-xl shadow-2xl z-[9999] p-4 flex items-start gap-3 animate-float`;

  const configs = {
    success: { icon: 'fa-check-circle', color: 'text-green-400', border: 'border-green-500/30' },
    error: { icon: 'fa-exclamation-circle', color: 'text-red-400', border: 'border-red-500/30' },
    warning: { icon: 'fa-exclamation-triangle', color: 'text-yellow-400', border: 'border-yellow-500/30' },
    info: { icon: 'fa-info-circle', color: 'text-indigo-400', border: 'border-indigo-500/30' }
  };

  const config = configs[type] || configs.info;
  toast.classList.add(config.border);

  toast.innerHTML = `
    <div class="${config.color} text-xl flex-shrink-0">
      <i class="fas ${config.icon}"></i>
    </div>
    <div class="flex-1">
      <p class="text-white text-sm leading-relaxed">${sanitizedMessage}</p>
    </div>
    <button class="text-gray-500 hover:text-white transition-colors ml-2" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

export function showSuccess(message, duration) {
  showToast(message, 'success', duration);
}

export function showError(message, duration) {
  showToast(message, 'error', duration);
}

export function showWarning(message, duration) {
  showToast(message, 'warning', duration);
}

export function showInfo(message, duration) {
  showToast(message, 'info', duration);
}
