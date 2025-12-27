/**
 * Animation utilities for Projet Blocus
 * Handles scroll reveals, stagger animations, and interactive effects
 */

/**
 * Initialize scroll reveal animations
 */
export function initScrollReveal() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Optionally unobserve after revealing
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });

    return observer;
}

/**
 * Add stagger animation to children
 */
export function addStaggerAnimation(container, delay = 0.1) {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }

    if (!container) return;

    const children = Array.from(container.children);
    children.forEach((child, index) => {
        child.style.opacity = '0';
        child.style.animation = `fadeIn 0.5s ease-out forwards`;
        child.style.animationDelay = `${index * delay}s`;
    });
}

/**
 * Add ripple effect to buttons
 */
export function addRippleEffect(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    if (!element) return;

    element.classList.add('ripple');

    element.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();

        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.width = ripple.style.height = '0';
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        ripple.style.pointerEvents = 'none';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        ripple.animate([
            { width: '0', height: '0', opacity: 1 },
            { width: '500px', height: '500px', opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => ripple.remove();
    });
}

/**
 * Add ripple to all buttons with a specific class
 */
export function addRippleToButtons(selector = '.btn-press') {
    document.querySelectorAll(selector).forEach(btn => {
        addRippleEffect(btn);
    });
}

/**
 * Animate number counting
 */
export function animateCounter(element, start, end, duration = 1000) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);

    return timer;
}

/**
 * Add entrance animation to cards
 */
export function animateCardEntrance(cards, stagger = true) {
    if (typeof cards === 'string') {
        cards = document.querySelectorAll(cards);
    }

    cards.forEach((card, index) => {
        card.classList.add('card-entrance');
        if (stagger) {
            card.style.animationDelay = `${index * 0.05}s`;
        }
    });
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(element, offset = 0) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    if (!element) return;

    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Add hover lift effect to elements
 */
export function addHoverLift(selector) {
    document.querySelectorAll(selector).forEach(el => {
        el.classList.add('hover-lift');
    });
}

/**
 * Show notification with animation
 */
export function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification-enter fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg z-50 max-w-md`;

    const colors = {
        success: 'bg-emerald-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-yellow-600 text-white',
        info: 'bg-indigo-600 text-white'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    notification.className += ` ${colors[type] || colors.info}`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${icons[type] || icons.info} text-xl"></i>
            <p class="font-medium">${message}</p>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('notification-enter');
        notification.classList.add('notification-exit');
        setTimeout(() => notification.remove(), 300);
    }, duration);

    return notification;
}

/**
 * Add loading shimmer to element
 */
export function addLoadingShimmer(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    if (!element) return;

    element.classList.add('animate-shimmer', 'skeleton-loading');
}

/**
 * Remove loading shimmer
 */
export function removeLoadingShimmer(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }

    if (!element) return;

    element.classList.remove('animate-shimmer', 'skeleton-loading');
}

/**
 * Parallax scroll effect
 */
export function initParallax(selector, speed = 0.5) {
    const elements = document.querySelectorAll(selector);

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;

        elements.forEach(el => {
            const offset = el.offsetTop;
            const distance = scrolled - offset;
            el.style.transform = `translateY(${distance * speed}px)`;
        });
    });
}

/**
 * Auto-initialize common animations on page load
 */
export function autoInit() {
    // Initialize scroll reveal
    initScrollReveal();

    // Add ripple to buttons
    addRippleToButtons('.btn-press, button:not(.no-ripple)');

    // Add hover lift to cards
    addHoverLift('.content-glass:not(.no-lift)');

    // Animate cards on page
    setTimeout(() => {
        animateCardEntrance('.content-glass', true);
    }, 100);
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
} else {
    autoInit();
}
