/**
 * 🧩 COMPONENTS - Reusable UI component factory
 * Modern, accessible, animated components
 */

import { theme, createClassName } from './design-system.js';
import { logger } from './logger.js';

// ✨ Base component class
export class Component {
  constructor(selector, options = {}) {
    this.el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!this.el) {
      logger.warn(`Component not found: ${selector}`);
      return null;
    }
    this.options = options;
    this.listeners = [];
  }

  on(event, handler) {
    this.el.addEventListener(event, handler);
    this.listeners.push({ event, handler });
    return this;
  }

  off(event, handler) {
    this.el.removeEventListener(event, handler);
    this.listeners = this.listeners.filter(l => !(l.event === event && l.handler === handler));
    return this;
  }

  addClass(className) {
    this.el.classList.add(className);
    return this;
  }

  removeClass(className) {
    this.el.classList.remove(className);
    return this;
  }

  toggleClass(className) {
    this.el.classList.toggle(className);
    return this;
  }

  hasClass(className) {
    return this.el.classList.contains(className);
  }

  setText(text) {
    this.el.textContent = text;
    return this;
  }

  setHTML(html) {
    this.el.innerHTML = html;
    return this;
  }

  setAttr(key, value) {
    if (value === null) {
      this.el.removeAttribute(key);
    } else {
      this.el.setAttribute(key, value);
    }
    return this;
  }

  getAttr(key) {
    return this.el.getAttribute(key);
  }

  show() {
    this.el.style.display = '';
    return this;
  }

  hide() {
    this.el.style.display = 'none';
    return this;
  }

  destroy() {
    this.listeners.forEach(({ event, handler }) => {
      this.el.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

// 🔘 Button with states
export class Button extends Component {
  constructor(selector, options = {}) {
    super(selector, options);
    this.isLoading = false;
    this.isDisabled = false;
    this.originalText = this.el?.textContent;
  }

  setLoading(loading = true) {
    this.isLoading = loading;
    if (loading) {
      this.el.disabled = true;
      this.el.classList.add('is-loading');
      this.el.innerHTML = '<span class="spinner"></span> Loading...';
    } else {
      this.el.disabled = false;
      this.el.classList.remove('is-loading');
      this.el.textContent = this.originalText;
    }
    return this;
  }

  setDisabled(disabled = true) {
    this.isDisabled = disabled;
    this.el.disabled = disabled;
    this.el.classList.toggle('is-disabled', disabled);
    return this;
  }
}

// 📝 Input with validation
export class Input extends Component {
  constructor(selector, options = {}) {
    super(selector, options);
    this.validator = options.validator || (() => true);
    this.errorEl = null;
  }

  validate() {
    const value = this.el.value.trim();
    const isValid = this.validator(value);

    if (!isValid) {
      this.showError(this.options.errorMessage || 'Invalid input');
    } else {
      this.clearError();
    }

    return isValid;
  }

  showError(message) {
    this.el.classList.add('is-error');
    if (!this.errorEl) {
      this.errorEl = document.createElement('span');
      this.errorEl.className = 'input-error-text';
      this.el.parentNode.insertBefore(this.errorEl, this.el.nextSibling);
    }
    this.errorEl.textContent = message;
    return this;
  }

  clearError() {
    this.el.classList.remove('is-error');
    if (this.errorEl) {
      this.errorEl.textContent = '';
    }
    return this;
  }

  getValue() {
    return this.el.value.trim();
  }

  setValue(value) {
    this.el.value = value;
    return this;
  }
}

// 🔔 Alert/Toast
export class Alert extends Component {
  static create(message, type = 'info', duration = 5000) {
    const container = document.getElementById('alerts') || (() => {
      const div = document.createElement('div');
      div.id = 'alerts';
      div.className = 'fixed top-4 right-4 z-[9999] space-y-2';
      document.body.appendChild(div);
      return div;
    })();

    const alert = document.createElement('div');
    alert.className = `alert alert--${type} animate-slideIn`;
    alert.innerHTML = `
      <div class="flex items-center gap-3 p-4 rounded-lg bg-${type}-900/20 border border-${type}-500/30">
        <i class="fas fa-exclamation-circle text-${type}-400"></i>
        <p class="text-sm text-white">${message}</p>
        <button class="ml-auto hover:opacity-70 transition" aria-label="Close">✕</button>
      </div>
    `;

    const closeBtn = alert.querySelector('button');
    const remove = () => {
      alert.classList.add('animate-fadeOut');
      setTimeout(() => alert.remove(), 200);
    };

    closeBtn.addEventListener('click', remove);
    if (duration > 0) setTimeout(remove, duration);

    container.appendChild(alert);
    return alert;
  }
}

// 📊 Modal/Dialog
export class Modal extends Component {
  constructor(selector, options = {}) {
    super(selector, options);
    this.backdrop = null;
    this.isOpen = false;
    this.setupBackdrop();
  }

  setupBackdrop() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] hidden';
    document.body.appendChild(this.backdrop);
  }

  open() {
    if (this.isOpen) return this;
    this.isOpen = true;
    this.backdrop.classList.remove('hidden');
    this.el.classList.add('is-open');
    this.el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    return this;
  }

  close() {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this.backdrop.classList.add('hidden');
    this.el.classList.remove('is-open');
    document.body.style.overflow = '';
    return this;
  }

  destroy() {
    super.destroy();
    this.backdrop?.remove();
  }
}

// 🌀 Loading Spinner
export class Spinner extends Component {
  static create(size = 'md') {
    const spinner = document.createElement('div');
    spinner.className = `spinner spinner--${size}`;
    spinner.innerHTML = `<i class="fas fa-spinner animate-spin"></i>`;
    return spinner;
  }
}

// 🎯 Drawer/Sidebar
export class Drawer extends Component {
  constructor(selector, options = {}) {
    super(selector, options);
    this.isOpen = false;
    this.position = options.position || 'left';
  }

  open() {
    this.isOpen = true;
    this.el.classList.add('is-open');
    document.body.classList.add('drawer-open');
    return this;
  }

  close() {
    this.isOpen = false;
    this.el.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    return this;
  }

  toggle() {
    return this.isOpen ? this.close() : this.open();
  }
}

// 📑 Tabs
export class Tabs extends Component {
  constructor(selector, options = {}) {
    super(selector, options);
    this.tabs = Array.from(this.el.querySelectorAll('[role="tab"]'));
    this.panels = Array.from(this.el.querySelectorAll('[role="tabpanel"]'));
    this.activeIndex = 0;
    this.init();
  }

  init() {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.activate(index));
      tab.addEventListener('keydown', (e) => this.handleKeydown(e, index));
    });
  }

  activate(index) {
    this.tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
    this.panels.forEach(p => p.classList.add('hidden'));

    this.tabs[index].setAttribute('aria-selected', 'true');
    this.panels[index].classList.remove('hidden');
    this.activeIndex = index;
  }

  handleKeydown(e, index) {
    if (e.key === 'ArrowRight') this.activate((index + 1) % this.tabs.length);
    if (e.key === 'ArrowLeft') this.activate((index - 1 + this.tabs.length) % this.tabs.length);
  }
}

// 📋 Dropdown/Select
export class Dropdown extends Component {
  constructor(selector, options = {}) {
    super(selector, options);
    this.isOpen = false;
    this.menu = this.el.querySelector('[role="menu"]');
    this.trigger = this.el.querySelector('[role="button"]');
    this.init();
  }

  init() {
    this.trigger?.addEventListener('click', () => this.toggle());
    document.addEventListener('click', (e) => {
      if (!this.el.contains(e.target)) this.close();
    });
  }

  open() {
    this.isOpen = true;
    this.menu.classList.remove('hidden');
    return this;
  }

  close() {
    this.isOpen = false;
    this.menu.classList.add('hidden');
    return this;
  }

  toggle() {
    return this.isOpen ? this.close() : this.open();
  }
}

export default {
  Component,
  Button,
  Input,
  Alert,
  Modal,
  Spinner,
  Drawer,
  Tabs,
  Dropdown,
};
