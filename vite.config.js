import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: 'assets',

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    target: 'esnext', // Supporter top-level await
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
        callback: resolve(__dirname, 'pages/auth/callback.html'),
        onboarding: resolve(__dirname, 'pages/auth/onboarding.html'),

        // App pages
        dashboard: resolve(__dirname, 'pages/app/dashboard.html'),
        courses: resolve(__dirname, 'pages/app/courses.html'),
        upload: resolve(__dirname, 'pages/app/upload.html'),
        quiz: resolve(__dirname, 'pages/app/quiz.html'),
        synthesize: resolve(__dirname, 'pages/app/synthesize.html'),
        spacedRepetition: resolve(__dirname, 'pages/app/spaced-repetition.html'),
        music: resolve(__dirname, 'pages/app/music.html'),
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
        roadmap: resolve(__dirname, 'pages/app/roadmap.html'),

        // Legal & Admin pages
        cgu: resolve(__dirname, 'pages/legal/cgu.html'),
        confidentialite: resolve(__dirname, 'pages/legal/confidentialite.html'),
        contact: resolve(__dirname, 'pages/legal/contact.html'),
        adminPanel: resolve(__dirname, 'pages/admin/panel.html'),
      },
      output: {
        // Pas de code splitting Firebase - complètement supprimé
        manualChunks: (id) => {
          if (id.includes('supabase')) {
            return 'vendors-supabase';
          }
          if (id.includes('node_modules')) {
            return 'vendors';
          }
        },
      },
    },
  },

  server: {
    port: 8000,
    open: true,
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:8000',
        'https://projet-blocus.vercel.app',
        'https://projet-blocus-dev.vercel.app'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      maxAge: 86400,
    },
    host: true,
  },

  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'assets'),
    },
  },

  optimizeDeps: {
    include: ['@supabase/supabase-js', 'dompurify'],
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  // Force Vercel rebuild - 2025-12-28
});
