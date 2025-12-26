import { env } from './env.js';

export const firebaseConfig = env.firebase;

export const firestoreCollections = {
  USERS: 'users',
  COURSES: 'courses',
  QUIZZES: 'quizzes',
  SYNTHESES: 'syntheses',
  COMMUNITY_POSTS: 'community_posts',
  GROUPS: 'groups',
  EVENTS: 'events',
  QUIZ_RESULTS: 'quiz_results',
  FORUM: 'forum',
  FRIENDSHIPS: 'friendships',
  CHATS: 'chats',
  SHARED_CONTENT: 'sharedContent',
  REPORTS: 'reports',
};

export const storageRefs = {
  AVATARS: 'avatars',
  COURSE_FILES: 'courses',
  POST_IMAGES: 'posts',
  GROUP_FILES: 'groups',
  GROUP_ICONS: 'group-icons',
};

export const authProviders = {
  EMAIL: 'password',
  GOOGLE: 'google.com',
};

export const firestoreSettings = {
  cacheSizeBytes: 100 * 1024 * 1024,
  experimentalForceLongPolling: false,
  experimentalAutoDetectLongPolling: true,
};
