export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  });

  return element;
}

export function getElement(selector) {
  return document.querySelector(selector);
}

export function getElements(selector) {
  return Array.from(document.querySelectorAll(selector));
}

export function toggleClass(element, className, force) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  return element?.classList.toggle(className, force);
}

export function addClass(element, ...classNames) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  element?.classList.add(...classNames);
}

export function removeClass(element, ...classNames) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  element?.classList.remove(...classNames);
}

export function show(element) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  element?.classList.remove('hidden');
}

export function hide(element) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  element?.classList.add('hidden');
}

export function toggle(element) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  element?.classList.toggle('hidden');
}

export function empty(element) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  if (element) {
    element.innerHTML = '';
  }
}

export function remove(element) {
  if (typeof element === 'string') {
    element = getElement(element);
  }
  element?.remove();
}

export function insertAfter(newElement, referenceElement) {
  if (typeof referenceElement === 'string') {
    referenceElement = getElement(referenceElement);
  }
  referenceElement?.parentNode?.insertBefore(newElement, referenceElement.nextSibling);
}

export function insertBefore(newElement, referenceElement) {
  if (typeof referenceElement === 'string') {
    referenceElement = getElement(referenceElement);
  }
  referenceElement?.parentNode?.insertBefore(newElement, referenceElement);
}

export function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
