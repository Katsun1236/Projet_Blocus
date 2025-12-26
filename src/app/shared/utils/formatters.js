export function formatDate(dateObj) {
  if (!dateObj) return '';
  const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatDateShort(dateObj) {
  if (!dateObj) return '';
  const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatTimeAgo(dateObj) {
  if (!dateObj) return '';
  const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  return formatDateShort(date);
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num);
}

export function formatPercentage(value, total) {
  if (total === 0) return '0%';
  return Math.round((value / total) * 100) + '%';
}

export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
}
