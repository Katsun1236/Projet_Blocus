export class Modal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.isOpen = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.modal) return;

    const closeButtons = this.modal.querySelectorAll('[data-modal-close]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  setContent(content) {
    if (!this.modal) return;
    const contentArea = this.modal.querySelector('[data-modal-content]');
    if (contentArea) {
      contentArea.innerHTML = content;
    }
  }
}

export function createModal(options = {}) {
  const {
    title = '',
    content = '',
    showClose = true,
    onConfirm = null,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    size = 'md'
  } = options;

  const modalId = `modal-${Date.now()}`;
  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = `fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden`;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  modal.innerHTML = `
    <div class="bg-gray-800 rounded-xl shadow-2xl ${sizeClasses[size]} w-full mx-4">
      ${title ? `
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 class="text-xl font-bold text-white">${title}</h3>
          ${showClose ? `
            <button data-modal-close class="text-gray-400 hover:text-white">
              <i class="fas fa-times"></i>
            </button>
          ` : ''}
        </div>
      ` : ''}
      <div class="p-6" data-modal-content>
        ${content}
      </div>
      ${onConfirm ? `
        <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button data-modal-close class="px-4 py-2 text-gray-400 hover:text-white">
            ${cancelText}
          </button>
          <button data-modal-confirm class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            ${confirmText}
          </button>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(modal);

  const modalInstance = new Modal(modalId);

  if (onConfirm) {
    const confirmBtn = modal.querySelector('[data-modal-confirm]');
    confirmBtn?.addEventListener('click', () => {
      onConfirm();
      modalInstance.close();
    });
  }

  return modalInstance;
}
