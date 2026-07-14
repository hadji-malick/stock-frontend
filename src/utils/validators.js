// ==================== VALIDATION RÉUTILISABLE ====================
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_REGEX = /^\+?[0-9\s.-]{7,15}$/;

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value).trim());
export const isValidPhone = (value) => PHONE_REGEX.test(String(value).trim());

// Exécute un jeu de règles sur un objet formData et renvoie un objet d'erreurs { champ: message }
export function validate(formData, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, fieldRules]) => {
    const value = formData[field];
    for (const rule of fieldRules) {
      const error = rule(value, formData);
      if (error) { errors[field] = error; break; }
    }
  });
  return errors;
}

// ===== Règles disponibles =====
export const required = (label) => (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} est obligatoire`;
  }
  return null;
};

export const email = (label = 'L\'email') => (value) => {
  if (!value) return null; // champ optionnel
  return isValidEmail(value) ? null : `${label} n'est pas valide (ex: nom@gmail.com)`;
};

export const emailRequired = (label = 'L\'email') => (value) => {
  if (!value || String(value).trim() === '') return `${label} est obligatoire`;
  return isValidEmail(value) ? null : `${label} n'est pas valide (ex: nom@gmail.com)`;
};

export const phone = (label = 'Le téléphone') => (value) => {
  if (!value) return null; // champ optionnel
  return isValidPhone(value) ? null : `${label} n'est pas valide (ex: +221 77 123 45 67)`;
};

export const phoneRequired = (label = 'Le téléphone') => (value) => {
  if (!value || String(value).trim() === '') return `${label} est obligatoire`;
  return isValidPhone(value) ? null : `${label} n'est pas valide (ex: +221 77 123 45 67)`;
};

export const minLength = (n, label) => (value) => {
  if (!value) return null;
  return String(value).length >= n ? null : `${label} doit contenir au moins ${n} caractères`;
};

export const positiveNumber = (label) => (value) => {
  if (value === '' || value === undefined || value === null) return `${label} est obligatoire`;
  const n = parseFloat(value);
  if (isNaN(n)) return `${label} doit être un nombre valide`;
  if (n < 0) return `${label} ne peut pas être négatif`;
  return null;
};

export const positiveInteger = (label) => (value) => {
  if (value === '' || value === undefined || value === null) return `${label} est obligatoire`;
  const n = parseInt(value);
  if (isNaN(n)) return `${label} doit être un nombre entier`;
  if (n < 0) return `${label} ne peut pas être négatif`;
  return null;
};