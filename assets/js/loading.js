/**
 * Module de composants de chargement (spinners, skeletons)
 */

/**
 * Spinner simple avec texte optionnel
 */
export function spinner(text = 'Chargement...', size = 'md') {
    const sizes = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl'
    };

    return `
        <div class="flex flex-col items-center justify-center py-10 opacity-70">
            <i class="fas fa-circle-notch fa-spin ${sizes[size]} mb-3 text-indigo-400"></i>
            ${text ? `<p class="text-sm text-gray-400">${text}</p>` : ''}
        </div>
    `;
}

/**
 * Skeleton pour card de cours
 */
export function skeletonCourseCard() {
    return `
        <div class="content-glass rounded-2xl p-6 animate-pulse">
            <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 bg-gray-700 rounded-xl"></div>
                <div class="flex-1">
                    <div class="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div class="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
            <div class="space-y-2">
                <div class="h-3 bg-gray-700 rounded w-full"></div>
                <div class="h-3 bg-gray-700 rounded w-5/6"></div>
            </div>
        </div>
    `;
}

/**
 * Skeleton pour post communauté
 */
export function skeletonPost() {
    return `
        <div class="content-glass rounded-2xl p-6 animate-pulse">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div class="flex-1">
                    <div class="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div class="h-3 bg-gray-700 rounded w-1/3"></div>
                </div>
            </div>
            <div class="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
            <div class="space-y-2">
                <div class="h-3 bg-gray-700 rounded w-full"></div>
                <div class="h-3 bg-gray-700 rounded w-full"></div>
                <div class="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
        </div>
    `;
}

/**
 * Skeleton pour quiz question
 */
export function skeletonQuizQuestion() {
    return `
        <div class="content-glass rounded-2xl p-8 animate-pulse">
            <div class="h-6 bg-gray-700 rounded w-3/4 mb-6"></div>
            <div class="space-y-3">
                ${Array(4).fill(0).map(() => `
                    <div class="h-12 bg-gray-700 rounded-xl"></div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Skeleton pour liste d'items
 */
export function skeletonList(count = 5) {
    return Array(count).fill(0).map(() => `
        <div class="flex items-center gap-3 p-4 bg-gray-800/30 rounded-xl animate-pulse">
            <div class="w-10 h-10 bg-gray-700 rounded-full"></div>
            <div class="flex-1">
                <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
        </div>
    `).join('');
}

/**
 * Skeleton générique
 */
export function skeleton(lines = 3) {
    return `
        <div class="space-y-3 animate-pulse">
            ${Array(lines).fill(0).map((_, i) => {
                const width = i === lines - 1 ? 'w-2/3' : 'w-full';
                return `<div class="h-4 bg-gray-700 rounded ${width}"></div>`;
            }).join('')}
        </div>
    `;
}

/**
 * Progress bar indéterminée
 */
export function progressBar(text = '') {
    return `
        <div class="w-full">
            ${text ? `<p class="text-sm text-gray-400 mb-2">${text}</p>` : ''}
            <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-progress"></div>
            </div>
        </div>
    `;
}

/**
 * Button avec loading state
 */
export function loadingButton(text = 'Chargement...') {
    return `
        <button disabled class="px-6 py-3 bg-gray-700 rounded-xl cursor-not-allowed opacity-70">
            <i class="fas fa-circle-notch fa-spin mr-2"></i>${text}
        </button>
    `;
}

/**
 * Show spinner dans un container
 */
export function showSpinner(container, text = 'Chargement...') {
    if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
    }
    if (container) {
        container.innerHTML = spinner(text);
    }
}

/**
 * Show skeleton dans un container
 */
export function showSkeleton(container, type = 'list', count = 3) {
    if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
    }
    if (!container) return;

    const skeletons = {
        'course': skeletonCourseCard,
        'post': skeletonPost,
        'quiz': skeletonQuizQuestion,
        'list': () => skeletonList(count),
        'generic': () => skeleton(count)
    };

    const skeletonFn = skeletons[type] || skeletons.generic;

    if (type === 'course' || type === 'post' || type === 'quiz') {
        container.innerHTML = Array(count).fill(0).map(() => skeletonFn()).join('');
    } else {
        container.innerHTML = skeletonFn();
    }
}
