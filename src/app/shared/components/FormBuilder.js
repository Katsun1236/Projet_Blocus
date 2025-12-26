import DOMPurify from 'dompurify';
import { Validators, showFieldErrors } from '../utils/validators.js';

export class FormBuilder {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.fields = new Map();
    this.submitHandler = null;
  }

  addField(name, validators = []) {
    const input = this.form?.querySelector(`[name="${name}"]`);
    if (input) {
      this.fields.set(name, {
        input,
        validators,
      });

      input.addEventListener('blur', () => this.validateField(name));
      input.addEventListener('input', () => {
        if (input.classList.contains('border-red-500')) {
          this.validateField(name);
        }
      });
    }
    return this;
  }

  validateField(name) {
    const field = this.fields.get(name);
    if (!field) return true;

    const errors = [];
    const value = field.input.value.trim();

    for (const validator of field.validators) {
      const error = validator(value);
      if (error) errors.push(error);
    }

    showFieldErrors(field.input, errors);
    return errors.length === 0;
  }

  validateAll() {
    let isValid = true;

    for (const [name] of this.fields) {
      if (!this.validateField(name)) {
        isValid = false;
      }
    }

    return isValid;
  }

  getValues() {
    const values = {};

    for (const [name, field] of this.fields) {
      values[name] = DOMPurify.sanitize(field.input.value.trim());
    }

    return values;
  }

  reset() {
    this.form?.reset();

    for (const [, field] of this.fields) {
      showFieldErrors(field.input, []);
    }
  }

  onSubmit(handler) {
    this.submitHandler = handler;

    this.form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.validateAll()) {
        return;
      }

      const values = this.getValues();
      await this.submitHandler(values);
    });

    return this;
  }

  setLoading(isLoading) {
    const submitBtn = this.form?.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('opacity-50', isLoading);
      submitBtn.classList.toggle('cursor-not-allowed', isLoading);
    }

    for (const [, field] of this.fields) {
      field.input.disabled = isLoading;
    }
  }
}

export function createForm(formId) {
  return new FormBuilder(formId);
}
