import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'public',
  publicDir: resolve(__dirname, 'src/assets/images'),

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
        main: resolve(__dirname, 'public/index.html'),
        dashboard: resolve(__dirname, 'public/pages/app/dashboard.html'),
        courses: resolve(__dirname, 'public/pages/app/courses.html'),
        quiz: resolve(__dirname, 'public/pages/app/quiz.html'),
        synthesize: resolve(__dirname, 'public/pages/app/synthesize.html'),
        planning: resolve(__dirname, 'public/pages/app/planning.html'),
        community: resolve(__dirname, 'public/pages/app/community.html'),
        forum: resolve(__dirname, 'public/pages/app/forum.html'),
        profile: resolve(__dirname, 'public/pages/app/profile.html'),
        viewProfile: resolve(__dirname, 'public/pages/app/view-profile.html'),
        chat: resolve(__dirname, 'public/pages/app/chat.html'),
        chatList: resolve(__dirname, 'public/pages/app/chat-list.html'),
        discussion: resolve(__dirname, 'public/pages/app/discussion.html'),
        friends: resolve(__dirname, 'public/pages/app/friends.html'),
        upload: resolve(__dirname, 'public/pages/app/upload.html'),
        bugReport: resolve(__dirname, 'public/pages/app/bug-report.html'),
        login: resolve(__dirname, 'public/pages/auth/login.html'),
        register: resolve(__dirname, 'public/pages/auth/register.html'),
        onboarding: resolve(__dirname, 'public/pages/auth/onboarding.html'),
        cgu: resolve(__dirname, 'public/pages/legal/cgu.html'),
        confidentialite: resolve(__dirname, 'public/pages/legal/confidentialite.html'),
        contact: resolve(__dirname, 'public/pages/legal/contact.html'),
        adminPanel: resolve(__dirname, 'public/pages/admin/panel.html'),
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
});
