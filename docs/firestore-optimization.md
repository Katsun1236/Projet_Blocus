# Firestore Optimization Guide

## Index Configuration

### Composite Indexes
Les indexes composites sont configurés dans `firestore.indexes.json`. Pour les déployer :

```bash
firebase deploy --only firestore:indexes
```

### Indexes actuels
1. **community_posts** : Filtre par type + tri par date
2. **courses** : Filtre par parentId + tri par date
3. **quiz_results** : Filtre par userId + tri par date
4. **tutor_messages** : Filtre par userId + tri par date
5. **review_sessions** : Filtre par userId + tri par date
6. **review_cards** : Filtre par userId + tri par nextReviewDate
7. **groups** : Array contains members + tri par date

## Query Limits

### Limites implémentées
- **Community posts** : 20 par page (pagination avec `onSnapshot`)
- **Courses** : 100 max par dossier (ordonné par date)
- **Quiz results** : 8 derniers résultats
- **Tutor messages** : 50 messages (ordonné par date)
- **Review sessions** : 365 dernières sessions

## Pagination

### Utilisation de la pagination
```javascript
import { createLoadMoreButton } from './pagination.js';

let lastDoc = null;
const pageSize = 20;

async function loadMore() {
    let q = query(
        collection(db, 'collection_name'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
    );

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    // Traiter les documents...

    return !snapshot.empty && snapshot.docs.length === pageSize;
}

// Ajouter bouton "Charger plus"
createLoadMoreButton(loadMore, container);
```

## Best Practices

### 1. Toujours utiliser des limites
❌ Mauvais :
```javascript
const snapshot = await getDocs(collection(db, 'posts'));
```

✅ Bon :
```javascript
const q = query(collection(db, 'posts'), limit(20));
const snapshot = await getDocs(q);
```

### 2. Utiliser l'écoute en temps réel avec parcimonie
- `onSnapshot` coûte 1 lecture par document à chaque changement
- Utiliser uniquement pour les données qui doivent être en temps réel (chat, notifications)
- Préférer `getDocs` pour les données statiques

### 3. Structurer les données pour minimiser les lectures
❌ Mauvais :
```javascript
// 1 lecture pour le post + N lectures pour chaque auteur
posts.forEach(async post => {
    const author = await getDoc(doc(db, 'users', post.authorId));
});
```

✅ Bon :
```javascript
// Stocker authorName directement dans le post
post.authorName // Déjà disponible
```

### 4. Utiliser le cache offline
Le cache est activé par défaut mais peut être configuré :

```javascript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});
```

### 5. Limiter les where() multiples
Firebase limite à 10 filtres where() par requête. Privilégier les indexes composites.

## Monitoring

### Vérifier les lectures Firestore
Dans la console Firebase :
1. Firestore > Usage
2. Analyser les pics de lectures
3. Identifier les requêtes coûteuses

### Debug des requêtes lentes
```javascript
const startTime = Date.now();
const snapshot = await getDocs(q);
console.log(`Query took ${Date.now() - startTime}ms`);
console.log(`Read ${snapshot.size} documents`);
```

## Coûts estimés

### Firestore Pricing (gratuit jusqu'à)
- 50 000 lectures/jour
- 20 000 écritures/jour
- 20 000 suppressions/jour

### Optimisation pour rester gratuit
Avec les limites actuelles et ~100 utilisateurs actifs/jour :
- Community : ~2000 lectures/jour (20 posts × 10 rafraîchissements × 10 users)
- Courses : ~500 lectures/jour
- Quiz : ~400 lectures/jour
- **Total : ~3000 lectures/jour** → 🟢 Dans le quota gratuit

## Migration des anciennes données

Si des collections ont déjà beaucoup de documents :

```javascript
// Script de migration pour ajouter createdAt manquant
const batch = writeBatch(db);
const snapshot = await getDocs(collection(db, 'old_collection'));

snapshot.forEach(doc => {
    if (!doc.data().createdAt) {
        batch.update(doc.ref, {
            createdAt: serverTimestamp()
        });
    }
});

await batch.commit();
```

## Ressources

- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Query Performance](https://firebase.google.com/docs/firestore/query-data/query-performance)
- [Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
