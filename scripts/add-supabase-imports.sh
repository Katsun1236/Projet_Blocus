#!/bin/bash

# Script pour ajouter les imports Supabase

echo "🔄 Ajout des imports Supabase..."

# Fichier dashboard.html
sed -i "s|import { auth, db, supabase } from '../../assets/js/supabase-config.js';|import { auth, db, supabase, onAuthStateChanged, signOut, doc, getDoc, collection, query, orderBy, limit, where, getDocs, updateDoc, deleteDoc, writeBatch } from '../../assets/js/supabase-config.js';|" pages/app/dashboard.html

# Pour tous les autres fichiers app
for file in pages/app/courses.html pages/app/upload.html pages/app/bug-report.html pages/app/chat.html pages/app/chat-list.html pages/app/discussion.html pages/app/forum.html pages/app/friends.html; do
    if [ -f "$file" ]; then
        # Trouver la ligne avec import et ajouter toutes les fonctions
        sed -i "/import.*from.*supabase-config.js/d" "$file"
        sed -i "/<script type=\"module\">/a\\        import { auth, db, supabase, storage, onAuthStateChanged, signOut, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, deleteField, ref, uploadBytesResumable, getDownloadURL } from '../../assets/js/supabase-config.js';" "$file"
    fi
done

echo "✅ Imports Supabase ajoutés"
