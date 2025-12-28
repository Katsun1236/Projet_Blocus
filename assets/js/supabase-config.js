/**
 * CONFIGURATION SUPABASE
 * Remplace Firebase pour Projet Blocus
 *
 * Instructions :
 * 1. Remplace SUPABASE_URL et SUPABASE_ANON_KEY par tes valeurs
 * 2. Remplace tous les imports de './config.js' par './supabase-config.js'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ✅ Configuration Supabase avec fallback hardcodé
// Les clés sont directement hardcodées pour éviter les problèmes de build Vite
const SUPABASE_URL = 'https://vhtzudbcfyxnwmpyjyqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodHp1ZGJjZnl4bndtcHlqeXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDY2NDgsImV4cCI6MjA4MjQyMjY0OH0.6tHA5qpktIqoLNh1RN620lSVhn6FRu3qtRI2O0j7mGU';

// Debug: Vérifier les valeurs
console.log('🔑 Supabase Config:', {
    url: SUPABASE_URL,
    keyLength: SUPABASE_ANON_KEY?.length,
    urlValid: SUPABASE_URL?.startsWith('https://')
});

// Créer le client Supabase avec persistence de session
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        // ✅ PERSISTENCE: Reste connecté même après fermeture du navigateur
        persistSession: true,
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
})

// =================================================================
// UTILITAIRES - Conversion camelCase <-> snake_case
// =================================================================

function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
}

function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function mapKeysToCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(mapKeysToCamelCase)

    const result = {}
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = toCamelCase(key)
        result[camelKey] = typeof value === 'object' && value !== null
            ? mapKeysToCamelCase(value)
            : value
    }
    return result
}

function mapKeysToSnakeCase(obj) {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(mapKeysToSnakeCase)

    const result = {}
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = toSnakeCase(key)
        result[snakeKey] = typeof value === 'object' && value !== null
            ? mapKeysToSnakeCase(value)
            : value
    }
    return result
}

// Helpers spécifiques pour users (rétro-compatibilité)
function mapUserFields(userData) {
    if (!userData) return null
    return {
        ...userData,
        firstName: userData.first_name || userData.firstName,
        lastName: userData.last_name || userData.lastName,
        photoURL: userData.photo_url || userData.photoURL,
        first_name: userData.first_name,
        last_name: userData.last_name,
        photo_url: userData.photo_url
    }
}

function unmapUserFields(userData) {
    if (!userData) return null
    const mapped = { ...userData }

    if (mapped.firstName) {
        mapped.first_name = mapped.firstName
        delete mapped.firstName
    }
    if (mapped.lastName) {
        mapped.last_name = mapped.lastName
        delete mapped.lastName
    }
    if (mapped.photoURL) {
        mapped.photo_url = mapped.photoURL
        delete mapped.photoURL
    }

    return mapped
}

// Export des helpers de conversion
export { mapKeysToCamelCase, mapKeysToSnakeCase, toCamelCase, toSnakeCase }

// =================================================================
// AUTH - Compatible avec Firebase Auth
// =================================================================
export const auth = {
    currentUser: null,
    _initialized: false,

    // Initialiser auth.currentUser au démarrage
    async init() {
        if (this._initialized) return this.currentUser

        // ✅ Utiliser getSession() pour une restauration rapide depuis localStorage
        const { data } = await supabase.auth.getSession()
        this.currentUser = data.session?.user ? mapKeysToCamelCase(data.session.user) : null
        this._initialized = true
        return this.currentUser
    },

    // Sign in avec email/password
    async signInWithEmailAndPassword(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw new Error(error.message)
        this.currentUser = data.user
        return { user: data.user }
    },

    // Créer un compte
    async createUserWithEmailAndPassword(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/pages/app/dashboard.html`
            }
        })
        if (error) throw new Error(error.message)
        this.currentUser = data.user
        return { user: data.user }
    },

    // Sign in avec Google
    async signInWithPopup(provider) {
        const { data, error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/pages/app/dashboard.html`
            }
        })
        if (error) throw new Error(error.message)
        return { user: data.user }
    },

    // Déconnexion
    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(error.message)
        this.currentUser = null
    },

    // Réinitialiser le mot de passe
    async sendPasswordResetEmail(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/pages/auth/reset-password.html`
        })
        if (error) throw new Error(error.message)
    },

    // Écouter les changements d'auth (comme Firebase)
    onAuthStateChanged(callback) {
        // ✅ IMPORTANT: Utiliser getSession() au lieu de getUser()
        // getSession() vérifie d'abord le localStorage (rapide) avant de faire un appel réseau
        // Cela évite les déconnexions lors de l'actualisation de la page
        supabase.auth.getSession().then(({ data }) => {
            const user = data.session?.user ? mapKeysToCamelCase(data.session.user) : null
            this.currentUser = user
            if (callback && typeof callback === 'function') {
                callback(user)
            }
        }).catch(error => {
            console.error('Error getting session:', error);
            if (callback && typeof callback === 'function') {
                callback(null);
            }
        })

        // Écouter les changements
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            const user = session?.user ? mapKeysToCamelCase(session.user) : null
            this.currentUser = user
            if (callback && typeof callback === 'function') {
                callback(user)
            }
        })

        // Retourner une fonction d'unsubscribe comme Firebase
        return () => {
            if (data && data.subscription) {
                data.subscription.unsubscribe()
            }
        }
    },

    // Récupérer l'utilisateur actuel
    async getCurrentUser() {
        const { data } = await supabase.auth.getUser()
        this.currentUser = data.user
        return data.user
    }
}

// =================================================================
// DATABASE - Compatible avec Firestore
// =================================================================
export const db = {
    // Récupérer une collection
    async collection(tableName) {
        const userId = (await supabase.auth.getUser()).data.user?.id

        return {
            // Ajouter un document
            async addDoc(data) {
                // ✅ Convertir camelCase → snake_case pour Supabase
                const snakeCaseData = mapKeysToSnakeCase(data)

                const { data: result, error } = await supabase
                    .from(tableName)
                    .insert({ ...snakeCaseData, user_id: userId })
                    .select()
                    .single()

                if (error) throw new Error(error.message)

                // ✅ Retourner en camelCase pour le code JavaScript
                return mapKeysToCamelCase({ id: result.id, ...result })
            },

            // Récupérer tous les documents
            async getDocs() {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', userId)

                if (error) throw new Error(error.message)

                // ✅ Convertir snake_case → camelCase
                return (data || []).map(mapKeysToCamelCase)
            },

            // Query builder
            query() {
                let queryBuilder = supabase.from(tableName).select('*')

                // Ajouter user_id filter seulement si userId existe (pas pour tables publiques comme community_groups)
                if (userId && tableName !== 'users' && tableName !== 'community_groups' && tableName !== 'community_posts') {
                    queryBuilder = queryBuilder.eq('user_id', userId)
                }

                let orderField = null
                let orderDirection = 'asc'
                let limitValue = null
                const whereFilters = []

                return {
                    tableName,
                    _whereFilters: whereFilters,

                    where(field, operator, value) {
                        whereFilters.push({ field, operator, value })
                        if (operator === '==') queryBuilder = queryBuilder.eq(field, value)
                        else if (operator === '!=') queryBuilder = queryBuilder.neq(field, value)
                        else if (operator === '<') queryBuilder = queryBuilder.lt(field, value)
                        else if (operator === '<=') queryBuilder = queryBuilder.lte(field, value)
                        else if (operator === '>') queryBuilder = queryBuilder.gt(field, value)
                        else if (operator === '>=') queryBuilder = queryBuilder.gte(field, value)
                        return this
                    },

                    orderBy(field, direction = 'asc') {
                        orderField = field
                        orderDirection = direction
                        return this
                    },

                    limit(n) {
                        limitValue = n
                        return this
                    },

                    async get() {
                        if (orderField) {
                            queryBuilder = queryBuilder.order(orderField, {
                                ascending: orderDirection === 'asc'
                            })
                        }
                        if (limitValue) {
                            queryBuilder = queryBuilder.limit(limitValue)
                        }

                        const { data, error } = await queryBuilder
                        if (error) throw new Error(error.message)

                        // Mapper snake_case → camelCase pour users table
                        if (tableName === 'users') {
                            return (data || []).map(mapUserFields)
                        }

                        return data || []
                    }
                }
            }
        }
    },

    // Récupérer un document par ID
    doc(tableName, id) {
        return {
            tableName,
            id,
            async get() {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) {
                    if (error.code === 'PGRST116') {
                        return { exists: () => false, data: () => null }
                    }
                    throw new Error(error.message)
                }

                // Mapper pour users table
                const mappedData = tableName === 'users' ? mapUserFields(data) : data

                return {
                    exists: () => !!data,
                    data: () => mappedData,
                    id: data?.id
                }
            },

            async set(data, options = {}) {
                const userId = (await supabase.auth.getUser()).data.user?.id

                // Mapper camelCase → snake_case pour users
                const mappedData = tableName === 'users' ? unmapUserFields(data) : data

                if (options.merge) {
                    const { error } = await supabase
                        .from(tableName)
                        .update({ ...mappedData, user_id: userId })
                        .eq('id', id)
                    if (error) throw new Error(error.message)
                } else {
                    const { error } = await supabase
                        .from(tableName)
                        .upsert({ ...mappedData, id, user_id: userId })
                    if (error) throw new Error(error.message)
                }
            },

            async update(data) {
                // Mapper camelCase → snake_case pour users
                let mappedData = tableName === 'users' ? unmapUserFields(data) : data

                // Gérer arrayUnion et arrayRemove pour Postgres arrays
                const processedData = {}
                for (const [key, value] of Object.entries(mappedData)) {
                    if (value && typeof value === 'object' && value._type === 'arrayUnion') {
                        // Pour arrayUnion: utiliser array_append
                        const current = await this.get()
                        const currentArray = current.data()?.[key] || []
                        processedData[key] = [...new Set([...currentArray, ...value.elements])]
                    } else if (value && typeof value === 'object' && value._type === 'arrayRemove') {
                        // Pour arrayRemove: filtrer les éléments
                        const current = await this.get()
                        const currentArray = current.data()?.[key] || []
                        processedData[key] = currentArray.filter(item => !value.elements.includes(item))
                    } else {
                        processedData[key] = value
                    }
                }

                const { error } = await supabase
                    .from(tableName)
                    .update(processedData)
                    .eq('id', id)
                if (error) throw new Error(error.message)
            },

            async delete() {
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq('id', id)
                if (error) throw new Error(error.message)
            }
        }
    }
}

// =================================================================
// STORAGE - Compatible avec Firebase Storage
// =================================================================
export const storage = {
    ref(path) {
        return {
            async put(file) {
                // Récupérer l'utilisateur actuel
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('User not authenticated')

                // Nettoyer le nom de fichier pour Supabase (pas d'espaces ni caractères spéciaux)
                const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')

                // Créer le chemin avec userId : users/{userId}/{timestamp}_{filename}
                const filePath = `${user.id}/${Date.now()}_${cleanFileName}`

                const { data, error } = await supabase.storage
                    .from('courses')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (error) throw new Error(error.message)

                return {
                    ref: {
                        fullPath: data.path,
                        getDownloadURL: async () => {
                            const { data: urlData } = supabase.storage
                                .from('courses')
                                .getPublicUrl(data.path)
                            return urlData.publicUrl
                        }
                    },
                    metadata: { fullPath: data.path }
                }
            },

            async getDownloadURL() {
                const { data } = supabase.storage
                    .from('courses')
                    .getPublicUrl(path)

                return data.publicUrl
            },

            async delete() {
                const { error } = await supabase.storage
                    .from('courses')
                    .remove([path])

                if (error) throw new Error(error.message)
            }
        }
    }
}

// Fonction pour obtenir l'objet storage (compatible Firebase)
export function getStorage() {
    return storage
}

// =================================================================
// HELPERS - Compatible avec Firestore
// =================================================================

// Timestamp (comme Firestore)
export const Timestamp = {
    now() {
        return new Date()
    },
    fromDate(date) {
        return date
    },
    toDate() {
        return new Date(this)
    }
}

// ServerTimestamp
export const serverTimestamp = () => new Date().toISOString()

// =================================================================
// CLOUD FUNCTIONS - Remplacé par Supabase Edge Functions
// =================================================================
export const functions = {
    // Appeler une Edge Function
    async httpsCallable(functionName) {
        return async (data) => {
            const { data: result, error } = await supabase.functions.invoke(functionName, {
                body: data
            })

            if (error) throw new Error(error.message)
            return { data: result }
        }
    }
}

// =================================================================
// FIREBASE-COMPATIBLE EXPORTS (pour migration facile)
// =================================================================

export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback)
}

export async function signOut() {
    return await auth.signOut()
}

export function doc(collectionOrDb, ...args) {
    const tableName = typeof collectionOrDb === 'string' ? collectionOrDb : args[0]
    const id = typeof collectionOrDb === 'string' ? args[0] : args[1]
    return db.doc(tableName, id)
}

export async function getDoc(docRef) {
    return await docRef.get()
}

export async function setDoc(docRef, data, options) {
    return await docRef.set(data, options)
}

export async function updateDoc(docRef, data) {
    return await docRef.update(data)
}

export async function deleteDoc(docRef) {
    return await docRef.delete()
}

export async function collection(dbRef, tableName, ...args) {
    // Support syntaxe Firestore imbriquée: collection(db, 'users', userId, 'courses')
    // → Mappe vers table Supabase 'courses' avec filtre user_id
    if (args.length >= 2) {
        const userId = args[0]
        const subCollection = args[1]

        // Mapping des sous-collections Firestore vers tables Supabase
        const SUBCOLLECTION_MAP = {
            'courses': 'courses',
            'syntheses': 'syntheses',
            'quizzes': 'quiz_results', // quizzes → quiz_results
            'quiz_results': 'quiz_results',
            'folders': 'folders',
            'tutor_messages': 'tutor_messages',
            'review_cards': 'review_cards',
            'planning': 'planning_events', // planning → planning_events
            'planning_events': 'planning_events',
            'notifications': 'notifications'
        }

        const targetTable = SUBCOLLECTION_MAP[subCollection] || subCollection
        const coll = await db.collection(targetTable)

        // Pré-filtrer par user_id
        coll._prefilters = [{ field: 'user_id', operator: '==', value: userId }]
        coll.tableName = targetTable

        return coll
    }

    // Syntaxe simple: collection(db, 'users')
    const coll = await db.collection(tableName)
    coll.tableName = tableName
    return coll
}

export async function addDoc(collectionRef, data) {
    return await collectionRef.addDoc(data)
}

export async function getDocs(queryOrCollection) {
    if (queryOrCollection.get) {
        const data = await queryOrCollection.get()

        // Si c'est un tableau simple (résultat de get()), le retourner
        if (Array.isArray(data)) {
            // Format Firestore-compatible
            return data.map(d => ({
                id: d.id,
                data: () => d,
                exists: true
            }))
        }

        return data
    }

    // Appliquer les préfiltres si présents (pour collections imbriquées)
    if (queryOrCollection._prefilters && queryOrCollection._prefilters.length > 0) {
        let q = queryOrCollection.query()
        queryOrCollection._prefilters.forEach(filter => {
            q = q.where(filter.field, filter.operator, filter.value)
        })
        const data = await q.get()
        return data.map(d => ({
            id: d.id,
            data: () => d,
            exists: true
        }))
    }

    const data = await queryOrCollection.getDocs()
    return data.map(d => ({
        id: d.id,
        data: () => d,
        exists: true
    }))
}

export function query(collectionRef, ...constraints) {
    let q = collectionRef.query()

    // Appliquer les préfiltres (pour collections imbriquées)
    if (collectionRef._prefilters) {
        collectionRef._prefilters.forEach(filter => {
            q = q.where(filter.field, filter.operator, filter.value)
        })
    }

    // Appliquer les contraintes
    constraints.forEach(constraint => {
        if (constraint.type === 'where') {
            q = q.where(constraint.field, constraint.operator, constraint.value)
        } else if (constraint.type === 'orderBy') {
            q = q.orderBy(constraint.field, constraint.direction)
        } else if (constraint.type === 'limit') {
            q = q.limit(constraint.value)
        }
    })

    // Préserver les métadonnées
    q.tableName = collectionRef.tableName
    q._whereFilters = q._whereFilters || []

    return q
}

export function where(field, operator, value) {
    return { type: 'where', field, operator, value }
}

export function orderBy(field, direction = 'asc') {
    return { type: 'orderBy', field, direction }
}

export function limit(value) {
    return { type: 'limit', value }
}

export function onSnapshot(queryOrDoc, callback, errorCallback) {
    const tableName = queryOrDoc.tableName || 'unknown'

    // Fonction pour charger et envoyer les données
    const loadAndCallback = async () => {
        try {
            const data = await getDocs(queryOrDoc)
            const snapshot = {
                docs: Array.isArray(data) ? data : data.map(d => ({
                    id: d.id,
                    data: () => d,
                    exists: true
                })),
                empty: !data || data.length === 0
            }
            callback(snapshot)
        } catch (err) {
            console.error('onSnapshot error:', err)
            if (errorCallback) errorCallback(err)
        }
    }

    // Charger les données initiales immédiatement
    loadAndCallback()

    // Utiliser Supabase Realtime si possible
    let channel = null
    let useRealtime = false

    // Liste des tables avec Realtime activé
    const REALTIME_TABLES = ['courses', 'quiz_results', 'tutor_messages', 'review_cards',
                              'community_posts', 'community_groups', 'notifications',
                              'planning_events', 'pomodoro_stats']

    if (REALTIME_TABLES.includes(tableName)) {
        try {
            useRealtime = true
            const channelName = `realtime:${tableName}:${Date.now()}`

            channel = supabase
                .channel(channelName)
                .on('postgres_changes',
                    {
                        event: '*', // INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: tableName
                    },
                    (payload) => {
                        // Recharger les données quand il y a un changement
                        loadAndCallback()
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        // ✅ LOW: Removed console.log for production
                        // console.log(`✅ Realtime activé pour ${tableName}`)
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.warn(`⚠️ Realtime échoué pour ${tableName}, fallback polling`)
                        useRealtime = false
                    }
                })
        } catch (err) {
            console.warn('⚠️ Erreur Realtime, fallback polling:', err)
            useRealtime = false
        }
    }

    // Fallback polling si Realtime pas disponible
    let intervalId = null
    if (!useRealtime) {
        // ✅ LOW: Removed console.log for production
        // console.log(`⏱️ Polling activé pour ${tableName} (refresh 5s)`)
        intervalId = setInterval(loadAndCallback, 5000) // 5 secondes
    }

    // Fonction d'unsubscribe
    return () => {
        if (channel) {
            supabase.removeChannel(channel)
        }
        if (intervalId) {
            clearInterval(intervalId)
        }
    }
}

export function writeBatch(dbRef) {
    const operations = []

    return {
        update(docRef, data) {
            operations.push({ type: 'update', docRef, data })
        },
        set(docRef, data) {
            operations.push({ type: 'set', docRef, data })
        },
        delete(docRef) {
            operations.push({ type: 'delete', docRef })
        },
        async commit() {
            // ✅ BUG FIX: Add rollback logic for failed batch operations
            const originalStates = []
            let successCount = 0

            try {
                // Execute operations sequentially and track state
                for (let i = 0; i < operations.length; i++) {
                    const op = operations[i]

                    // Save original state before modification (for rollback)
                    if (op.type === 'update' || op.type === 'delete') {
                        try {
                            const original = await op.docRef.get()
                            originalStates.push({
                                index: i,
                                docRef: op.docRef,
                                existed: original.exists(),
                                data: original.exists() ? original.data() : null
                            })
                        } catch (e) {
                            // Document doesn't exist yet, skip state saving
                            originalStates.push({ index: i, docRef: op.docRef, existed: false, data: null })
                        }
                    }

                    // Execute operation
                    if (op.type === 'update') {
                        await op.docRef.update(op.data)
                    } else if (op.type === 'set') {
                        await op.docRef.set(op.data)
                    } else if (op.type === 'delete') {
                        await op.docRef.delete()
                    }

                    successCount++
                }
            } catch (error) {
                console.error(`❌ Batch operation failed at ${successCount}/${operations.length}:`, error)

                // ✅ ROLLBACK: Attempt to restore original states
                if (originalStates.length > 0) {
                    console.warn('🔄 Attempting rollback of successful operations...')

                    for (const state of originalStates.reverse()) {
                        try {
                            if (state.existed && state.data) {
                                // Restore original data
                                await state.docRef.set(state.data)
                            } else if (!state.existed && operations[state.index].type !== 'delete') {
                                // Delete newly created document
                                await state.docRef.delete().catch(() => {}) // Ignore if already deleted
                            }
                        } catch (rollbackError) {
                            console.error(`⚠️ Rollback failed for operation ${state.index}:`, rollbackError)
                        }
                    }
                }

                throw new Error(`Batch commit failed at operation ${successCount}/${operations.length}: ${error.message}. Rollback attempted.`)
            }
        }
    }
}

export function increment(value) {
    return { _type: 'increment', value }
}

export function deleteField() {
    return null
}

export const ref = (storageObj, path) => storageObj.ref(path)

// Array helpers pour Firestore compatibility
export function arrayUnion(...elements) {
    return { _type: 'arrayUnion', elements }
}

export function arrayRemove(...elements) {
    return { _type: 'arrayRemove', elements }
}

// Upload helpers
export async function uploadBytes(storageRef, file) {
    return await storageRef.put(file)
}

// Server helpers
export async function getCountFromServer(queryRef) {
    const data = await getDocs(queryRef)
    return { data: () => ({ count: data.length }) }
}

export function uploadBytesResumable(storageRef, file) {
    // Émule le comportement Firebase uploadTask avec .on()
    let progressCallback = null
    let errorCallback = null
    let completeCallback = null

    const uploadTask = {
        snapshot: null, // Sera défini après l'upload

        on(event, onProgress, onError, onComplete) {
            progressCallback = onProgress
            errorCallback = onError
            completeCallback = onComplete

            // Lancer l'upload
            storageRef.put(file)
                .then((result) => {
                    // Simuler la progression à 100%
                    if (progressCallback) {
                        progressCallback({
                            bytesTransferred: file.size,
                            totalBytes: file.size,
                            state: 'success'
                        })
                    }

                    // ✅ Créer le snapshot avec la référence (comme Firebase)
                    this.snapshot = {
                        ref: storageRef,
                        bytesTransferred: file.size,
                        totalBytes: file.size,
                        state: 'success'
                    }

                    if (completeCallback) {
                        completeCallback(result)
                    }
                })
                .catch((err) => {
                    if (errorCallback) {
                        errorCallback(err)
                    }
                })

            return this
        }
    }

    return uploadTask
}

export async function getDownloadURL(storageRef) {
    if (typeof storageRef.getDownloadURL === 'function') {
        return await storageRef.getDownloadURL()
    }
    // Si c'est un result d'upload
    if (storageRef.ref && typeof storageRef.ref.getDownloadURL === 'function') {
        return await storageRef.ref.getDownloadURL()
    }
    throw new Error('Invalid storage reference')
}

// =================================================================
// EXPORTS
// =================================================================
export { supabase as default }

// Initialiser auth.currentUser automatiquement au démarrage
auth.init().catch(err => console.warn('Auth init failed:', err))

// ✅ LOW: Removed console.log for production (dev: décommenter si besoin)
// console.log('✅ Supabase initialisé avec wrappers Firebase')
// console.log('📍 URL:', SUPABASE_URL)
