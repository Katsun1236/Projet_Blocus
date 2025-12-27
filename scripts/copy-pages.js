#!/usr/bin/env node
import { cpSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('📦 Copying assets folder to dist/...');
if (existsSync('assets')) {
  cpSync('assets', 'dist/assets', { recursive: true });
  console.log('  ✓ assets/ copied');
}

const pagesToCopy = [
  'pages/auth/onboarding.html',
  'pages/app/dashboard.html',
  'pages/app/courses.html',
  'pages/app/quiz.html',
  'pages/app/synthesize.html',
  'pages/app/planning.html',
  'pages/app/community.html',
  'pages/app/forum.html',
  'pages/app/profile.html',
  'pages/app/view-profile.html',
  'pages/app/chat.html',
  'pages/app/chat-list.html',
  'pages/app/discussion.html',
  'pages/app/friends.html',
  'pages/app/upload.html',
  'pages/app/bug-report.html',
  'pages/legal/cgu.html',
  'pages/legal/confidentialite.html',
  'pages/legal/contact.html',
  'pages/admin/panel.html',
];

console.log('📋 Copying non-migrated pages to dist/...');

pagesToCopy.forEach(page => {
  const destDir = join('dist', page.substring(0, page.lastIndexOf('/')));
  mkdirSync(destDir, { recursive: true });
  cpSync(page, join('dist', page));
  console.log(`  ✓ ${page}`);
});

console.log('✅ Done copying pages');
