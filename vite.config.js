import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'assets',

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        // Pages principales
        main: resolve(__dirname, 'index.html'),

        // Auth pages
        login: resolve(__dirname, 'pages/auth/login.html'),
        register: resolve(__dirname, 'pages/auth/register.html'),

        // App pages
        dashboard: resolve(__dirname, 'pages/app/dashboard.html'),
        courses: resolve(__dirname, 'pages/app/courses.html'),
        upload: resolve(__dirname, 'pages/app/upload.html'),
        quiz: resolve(__dirname, 'pages/app/quiz.html'),
        synthesize: resolve(__dirname, 'pages/app/synthesize.html'),
        tutor: resolve(__dirname, 'pages/app/tutor.html'),
        spacedRepetition: resolve(__dirname, 'pages/app/spaced-repetition.html'),
        pomodoro: resolve(__dirname, 'pages/app/pomodoro.html'),
        planning: resolve(__dirname, 'pages/app/planning.html'),
        profile: resolve(__dirname, 'pages/app/profile.html'),
        viewProfile: resolve(__dirname, 'pages/app/view-profile.html'),
        community: resolve(__dirname, 'pages/app/community.html'),
        discussion: resolve(__dirname, 'pages/app/discussion.html'),
        forum: resolve(__dirname, 'pages/app/forum.html'),
        friends: resolve(__dirname, 'pages/app/friends.html'),
        chat: resolve(__dirname, 'pages/app/chat.html'),
        chatList: resolve(__dirname, 'pages/app/chat-list.html'),
        bugReport: resolve(__dirname, 'pages/app/bug-report.html'),
      },
      output: {
        manualChunks: {
          'firebase-core': ['firebase/app', 'firebase/auth'],
          'firebase-data': ['firebase/firestore', 'firebase/storage', 'firebase/functions'],
        },
      },
    },
  },

  server: {
    port: 8000,
    open: true,
    cors: true,
    host: true,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/app'),
      '@core': resolve(__dirname, 'src/app/core'),
      '@features': resolve(__dirname, 'src/app/features'),
      '@shared': resolve(__dirname, 'src/app/shared'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },

  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  // Force Vercel rebuild - 2025-12-28
});
