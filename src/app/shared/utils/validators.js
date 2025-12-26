export const Validators = {
  email: (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value) ? null : 'Email invalide';
  },

  password: (value) => {
    if (value.length < 8) return 'Minimum 8 caractères';
    if (!/[A-Z]/.test(value)) return 'Au moins une majuscule';
    if (!/[a-z]/.test(value)) return 'Au moins une minuscule';
    if (!/[0-9]/.test(value)) return 'Au moins un chiffre';
    return null;
  },

  required: (value) => {
    return value && value.trim() ? null : 'Champ requis';
  },

  minLength: (min) => (value) => {
    return value.length >= min ? null : `Minimum ${min} caractères`;
  },

  maxLength: (max) => (value) => {
    return value.length <= max ? null : `Maximum ${max} caractères`;
  },

  match: (fieldName, otherValue) => (value) => {
    return value === otherValue ? null : `Les ${fieldName} ne correspondent pas`;
  },

  url: (value) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL invalide';
    }
  },

  fileSize: (maxSize) => (file) => {
    if (!file) return 'Fichier requis';
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `Taille maximum: ${maxSizeMB}MB`;
    }
    return null;
  },

  fileType: (allowedTypes) => (file) => {
    if (!file) return 'Fichier requis';
    if (!allowedTypes.includes(file.type)) {
      return `Types autorisés: ${allowedTypes.join(', ')}`;
    }
    return null;
  },
};

export function validateField(input, validators) {
  const value = input.value.trim();
  const errors = [];

  for (const validator of validators) {
    const error = validator(value);
    if (error) errors.push(error);
  }

  return errors;
}

export function showFieldErrors(input, errors) {
  const container = input.closest('.form-field') || input.parentElement;

  const existingError = container.querySelector('.field-error');
  if (existingError) existingError.remove();

  input.classList.toggle('border-red-500', errors.length > 0);
  input.classList.toggle('border-gray-700', errors.length === 0);

  if (errors.length > 0) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-500 text-sm mt-1';
    errorDiv.textContent = errors[0];
    container.appendChild(errorDiv);
  }
}

export function validateForm(form, validationRules) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, validators] of Object.entries(validationRules)) {
    const input = form.querySelector(`[name="${fieldName}"]`);
    if (!input) continue;

    const fieldErrors = validateField(input, validators);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
      showFieldErrors(input, fieldErrors);
    } else {
      showFieldErrors(input, []);
    }
  }

  return { isValid, errors };
}

export function setupRealTimeValidation(form, validationRules) {
  for (const [fieldName, validators] of Object.entries(validationRules)) {
    const input = form.querySelector(`[name="${fieldName}"]`);
    if (!input) continue;

    input.addEventListener('blur', () => {
      const errors = validateField(input, validators);
      showFieldErrors(input, errors);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('border-red-500')) {
        const errors = validateField(input, validators);
        if (errors.length === 0) {
          showFieldErrors(input, []);
        }
      }
    });
  }
}
