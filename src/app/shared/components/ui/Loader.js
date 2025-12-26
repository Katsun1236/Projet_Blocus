export function showLoader(container = document.body, message = 'Chargement...') {
  const loaderId = 'global-loader';
  let loader = document.getElementById(loaderId);

  if (loader) return;

  loader = document.createElement('div');
  loader.id = loaderId;
  loader.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center';

  loader.innerHTML = `
    <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-4">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      <p class="text-white text-sm">${message}</p>
    </div>
  `;

  container.appendChild(loader);
}

export function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.remove();
  }
}

export function createInlineLoader(size = 'md') {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  const spinner = document.createElement('div');
  spinner.className = `animate-spin rounded-full ${sizes[size]} border-indigo-600 border-t-transparent`;

  return spinner;
}
