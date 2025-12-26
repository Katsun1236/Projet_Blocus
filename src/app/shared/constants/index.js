export const ROUTES = {
  HOME: '/',
  LOGIN: '/pages/auth/login.html',
  REGISTER: '/pages/auth/register.html',
  ONBOARDING: '/pages/auth/onboarding.html',
  DASHBOARD: '/pages/app/dashboard.html',
  COURSES: '/pages/app/courses.html',
  QUIZ: '/pages/app/quiz.html',
  SYNTHESIZE: '/pages/app/synthesize.html',
  PLANNING: '/pages/app/planning.html',
  COMMUNITY: '/pages/app/community.html',
  PROFILE: '/pages/app/profile.html',
};

export const FILE_SIZE_LIMITS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  MAX_PDF_SIZE: 20 * 1024 * 1024,
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur réseau. Vérifiez votre connexion.',
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action.',
  FORBIDDEN: 'Vous n\'avez pas les droits nécessaires.',
  NOT_FOUND: 'Ressource introuvable.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  VALIDATION_ERROR: 'Les données fournies sont invalides.',
};

export const QUIZ_TYPES = {
  QCM: 'qcm',
  VRAI_FAUX: 'vrai-faux',
  OUVERTE: 'ouverte',
};

export const SYNTHESIS_FORMATS = {
  SUMMARY: 'summary',
  FLASHCARDS: 'flashcards',
  PLAN: 'plan',
  GLOSSARY: 'glossary',
};

export const POST_TAGS = {
  QUESTION: 'question',
  PARTAGE: 'partage',
  CONSEIL: 'conseil',
  ENTRAIDE: 'entraide',
};

export const BADGE_LEVELS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
};

export const XP_REWARDS = {
  QUIZ_COMPLETE: 10,
  SYNTHESIS_CREATED: 15,
  POST_CREATED: 5,
  COMMENT_CREATED: 2,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 20,
};
