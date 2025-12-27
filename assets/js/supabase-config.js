/**
 * CONFIGURATION SUPABASE
 * Remplace Firebase pour Projet Blocus
 *
 * Instructions :
 * 1. Remplace SUPABASE_URL et SUPABASE_ANON_KEY par tes valeurs
 * 2. Remplace tous les imports de './config.js' par './supabase-config.js'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️ REMPLACE CES VALEURS PAR LES TIENNES
// Tu les trouveras dans : Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://vhtzudbcfyxnwmpyjyqw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_05DXIBdO1dVAZK02foL-bA_SzobNKZX' // Ta clé anon ici

// Créer le client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// =================================================================
// AUTH - Compatible avec Firebase Auth
// =================================================================
export const auth = {
    currentUser: null,

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
        // Récupérer l'utilisateur actuel au démarrage
        supabase.auth.getUser().then(({ data }) => {
            this.currentUser = data.user
            callback(data.user)
        })

        // Écouter les changements
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user ?? null
            callback(session?.user ?? null)
        })

        return authListener.subscription
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
                const { data: result, error } = await supabase
                    .from(tableName)
                    .insert({ ...data, user_id: userId })
                    .select()
                    .single()

                if (error) throw new Error(error.message)
                return { id: result.id, ...result }
            },

            // Récupérer tous les documents
            async getDocs() {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('user_id', userId)

                if (error) throw new Error(error.message)
                return data || []
            },

            // Query builder
            query() {
                let queryBuilder = supabase.from(tableName).select('*').eq('user_id', userId)
                let orderField = null
                let orderDirection = 'asc'
                let limitValue = null

                return {
                    where(field, operator, value) {
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
                        return data || []
                    }
                }
            }
        }
    },

    // Récupérer un document par ID
    doc(tableName, id) {
        return {
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

                return {
                    exists: () => !!data,
                    data: () => data,
                    id: data?.id
                }
            },

            async set(data, options = {}) {
                const userId = (await supabase.auth.getUser()).data.user?.id

                if (options.merge) {
                    const { error } = await supabase
                        .from(tableName)
                        .update({ ...data, user_id: userId })
                        .eq('id', id)
                    if (error) throw new Error(error.message)
                } else {
                    const { error } = await supabase
                        .from(tableName)
                        .upsert({ ...data, id, user_id: userId })
                    if (error) throw new Error(error.message)
                }
            },

            async update(data) {
                const { error } = await supabase
                    .from(tableName)
                    .update(data)
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
                const fileName = `${Date.now()}_${file.name}`
                const { data, error } = await supabase.storage
                    .from('courses')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (error) throw new Error(error.message)
                return {
                    ref: { fullPath: data.path },
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

export const onAuthStateChanged = auth.onAuthStateChanged.bind(auth)
export const signOut = auth.signOut.bind(auth)

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

export async function collection(dbRef, tableName) {
    return await db.collection(tableName)
}

export async function addDoc(collectionRef, data) {
    return await collectionRef.addDoc(data)
}

export async function getDocs(queryOrCollection) {
    if (queryOrCollection.get) {
        return await queryOrCollection.get()
    }
    return await queryOrCollection.getDocs()
}

export function query(collectionRef, ...constraints) {
    let q = collectionRef.query()
    constraints.forEach(constraint => {
        if (constraint.type === 'where') {
            q = q.where(constraint.field, constraint.operator, constraint.value)
        } else if (constraint.type === 'orderBy') {
            q = q.orderBy(constraint.field, constraint.direction)
        } else if (constraint.type === 'limit') {
            q = q.limit(constraint.value)
        }
    })
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

export function onSnapshot(queryOrDoc, callback) {
    console.warn('⚠️ onSnapshot: Realtime listeners not fully implemented in Supabase wrapper. Falling back to polling.')
    const tableName = queryOrDoc.tableName || 'unknown'

    const intervalId = setInterval(async () => {
        try {
            const data = await getDocs(queryOrDoc)
            const snapshot = {
                docs: data.map(d => ({ id: d.id, data: () => d })),
                empty: data.length === 0
            }
            callback(snapshot)
        } catch (err) {
            console.error('onSnapshot error:', err)
        }
    }, 3000)

    return () => clearInterval(intervalId)
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
            for (const op of operations) {
                if (op.type === 'update') {
                    await op.docRef.update(op.data)
                } else if (op.type === 'set') {
                    await op.docRef.set(op.data)
                } else if (op.type === 'delete') {
                    await op.docRef.delete()
                }
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

export const ref = (storage, path) => storage.ref(path)

export async function uploadBytesResumable(storageRef, file) {
    return await storageRef.put(file)
}

export async function getDownloadURL(storageRef) {
    return await storageRef.getDownloadURL()
}

// =================================================================
// EXPORTS
// =================================================================
export { supabase as default }

// Pour debug
console.log('✅ Supabase initialisé avec wrappers Firebase')
console.log('📍 URL:', SUPABASE_URL)
