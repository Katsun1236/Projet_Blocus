// Protection anti-XSS avec DOMPurify
// DOMPurify est chargé via CDN dans index.html
// window.DOMPurify est disponible globalement

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Potentially unsafe HTML string
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} Safe HTML string
 */
export function sanitizeHTML(dirty, options = {}) {
    if (!dirty) return '';

    // Vérifier si DOMPurify est disponible
    if (typeof window.DOMPurify === 'undefined') {
        console.warn('DOMPurify not loaded, using fallback');
        return escapeHTML(dirty);
    }

    const defaultConfig = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'title', 'target'],
        ALLOW_DATA_ATTR: false,
        SAFE_FOR_JQUERY: true
    };

    return window.DOMPurify.sanitize(dirty, { ...defaultConfig, ...options });
}

/**
 * Sanitize plain text (strip all HTML)
 * @param {string} text - Text to sanitize
 * @returns {string} Plain text without HTML
 */
export function sanitizeText(text) {
    if (!text) return '';

    // Vérifier si DOMPurify est disponible
    if (typeof window.DOMPurify === 'undefined') {
        return escapeHTML(text);
    }

    return window.DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Escape HTML entities
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or empty string
 */
export function sanitizeURL(url) {
    if (!url) return '';

    // Block dangerous protocols
    const dangerous = /^(javascript|data|vbscript):/i;
    if (dangerous.test(url)) {
        return '';
    }

    // Vérifier si DOMPurify est disponible
    if (typeof window.DOMPurify === 'undefined') {
        return escapeHTML(url);
    }

    return window.DOMPurify.sanitize(url, { ALLOWED_TAGS: [] });
}
