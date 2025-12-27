# 📱 App Mobile Projet Blocus

## ✨ Vue d'ensemble

Projet Blocus est maintenant disponible en **app mobile native** Android et iOS grâce à **Capacitor**.

- 🌐 **Site Web** → Continue de fonctionner normalement sur Firebase Hosting
- 📱 **App Mobile** → Même code, packagé en app native pour Android & iOS

## 🚀 Commandes rapides

### Development rapide

```bash
# Synchroniser le code web vers les apps
npm run cap:sync

# Ouvrir Android Studio
npm run android

# Ouvrir Xcode (macOS uniquement)
npm run ios
```

### Build et run sur device

```bash
# Build + run sur Android
npm run cap:run:android

# Build + run sur iOS (macOS uniquement)
npm run cap:run:ios
```

### Mise à jour

```bash
# Mettre à jour Capacitor et les plugins
npm run cap:update
```

## 📦 Workflow de développement

### 1. Modifier le code web
Travaillez normalement sur les fichiers dans `/assets/js`, `/pages`, etc.

### 2. Builder le projet
```bash
npm run build
```

### 3. Synchroniser vers les apps
```bash
npx cap sync
# OU
npm run cap:sync
```

### 4. Tester sur device/émulateur

#### Android
```bash
npm run android
```
- Ouvre **Android Studio**
- Cliquez sur le bouton ▶️ **Run** pour lancer sur émulateur/device
- Ou `npm run cap:run:android` pour lancer directement

#### iOS (macOS seulement)
```bash
npm run ios
```
- Ouvre **Xcode**
- Sélectionnez un simulateur/device
- Cliquez sur ▶️ **Run**
- Ou `npm run cap:run:ios` pour lancer directement

## 🔧 Plugins installés

| Plugin | Description | Usage |
|--------|-------------|-------|
| `@capacitor/splash-screen` | Écran de démarrage | Affichage au lancement |
| `@capacitor/status-bar` | Barre de statut | Style dark mode |
| `@capacitor/keyboard` | Clavier natif | Resize automatique |
| `@capacitor/haptics` | Vibrations | Feedback tactile |
| `@capacitor/toast` | Notifications | Alerts natives |
| `@capacitor/push-notifications` | Push | Notifs (à configurer) |

## 📁 Structure des dossiers

```
Projet_Blocus/
├── android/              # Projet Android natif
│   ├── app/
│   │   └── src/main/assets/public/  # Code web copié ici
│   └── build.gradle
├── ios/                  # Projet iOS natif (Xcode)
│   └── App/
│       └── App/public/   # Code web copié ici
├── dist/                 # Build Vite (source pour les apps)
├── capacitor.config.ts   # Configuration Capacitor
└── package.json
```

## 🎨 Personnalisation

### Icône de l'app

**Android:**
1. Remplacez les icônes dans `android/app/src/main/res/`
2. Ou utilisez Android Image Asset Studio (clic droit sur `res/` dans Android Studio)

**iOS:**
1. Ouvrez Xcode
2. Allez dans `App` → `App` → `Assets.xcassets` → `AppIcon`
3. Glissez vos icônes

### Splash Screen

**Configuration** dans `capacitor.config.ts`:
```typescript
SplashScreen: {
  launchShowDuration: 2000,
  backgroundColor: "#1a1b1e",
  // ...
}
```

**Images:**
- Android: `android/app/src/main/res/drawable/splash.png`
- iOS: Via Xcode dans `Assets.xcassets`

### Nom de l'app

Modifier dans `capacitor.config.ts`:
```typescript
appName: 'Projet Blocus'
```

Puis `npm run cap:sync`

## 🔥 Firebase dans l'app mobile

L'app utilise la **même configuration Firebase** que le site web.

**Fichiers de config:**
- Android: `android/app/google-services.json` (à ajouter si notifs Push)
- iOS: `ios/App/App/GoogleService-Info.plist` (à ajouter si notifs Push)

Pour l'instant, Firebase fonctionne via le SDK web (authentification, Firestore, Storage).

## 🐛 Debug

### Android
```bash
# Logs en temps réel
adb logcat | grep -i capacitor

# Ou dans Android Studio → Logcat
```

### iOS
- Dans Xcode: View → Debug Area → Show Debug Area
- Logs Safari: Develop → [Device] → [App]

### Chrome DevTools (Android)
1. Ouvrez Chrome Desktop
2. Allez sur `chrome://inspect`
3. Connectez votre device Android
4. Cliquez sur "Inspect" sous votre app

## 📝 Notes importantes

### ⚠️ Première fois
- **Android:** Installer [Android Studio](https://developer.android.com/studio)
- **iOS:** Installer [Xcode](https://developer.apple.com/xcode/) (macOS seulement)

### 🔄 Après chaque modification web
```bash
npm run build
npx cap sync
```

### 🌐 Site web vs App
- **Site web:** Continue de fonctionner indépendamment
- **App:** Utilise le même code mais packagé en natif
- **Updates:** Les deux peuvent être mis à jour séparément

### 📲 Publication

**Android (Google Play):**
1. Build release: Android Studio → Build → Generate Signed Bundle/APK
2. Upload sur Google Play Console

**iOS (App Store):**
1. Archive: Xcode → Product → Archive
2. Upload sur App Store Connect

## 🎯 Prochaines étapes

- [ ] Ajouter une icône custom
- [ ] Configurer un splash screen custom
- [ ] Tester les permissions (Storage, Camera, etc.)
- [ ] Configurer Firebase Cloud Messaging pour les Push
- [ ] Build de production et signature
- [ ] Publication sur les stores

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Android Developer](https://developer.android.com/)
- [iOS Developer](https://developer.apple.com/)
- [Firebase for Mobile](https://firebase.google.com/docs/android/setup)

---

**Besoin d'aide ?** Consultez les issues GitHub du projet.
