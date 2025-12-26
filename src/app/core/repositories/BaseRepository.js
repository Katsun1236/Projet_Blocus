import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/firebase/firebaseFirestore.js';

export class BaseRepository {
  constructor(collectionName) {
    this.db = getFirebaseFirestore();
    this.collectionName = collectionName;
  }

  getCollectionRef() {
    return collection(this.db, this.collectionName);
  }

  getDocRef(id) {
    return doc(this.db, this.collectionName, id);
  }

  async findById(id) {
    const docRef = this.getDocRef(id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    return null;
  }

  async findAll(options = {}) {
    const { orderByField = 'createdAt', orderDirection = 'desc', limit = 50 } = options;

    const q = query(
      this.getCollectionRef(),
      orderBy(orderByField, orderDirection),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findWhere(field, operator, value, options = {}) {
    const { orderByField, orderDirection = 'desc', limit = 50 } = options;

    const constraints = [where(field, operator, value)];

    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    constraints.push(firestoreLimit(limit));

    const q = query(this.getCollectionRef(), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async create(data) {
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(this.getCollectionRef(), dataWithTimestamp);
    return docRef.id;
  }

  async update(id, data) {
    const docRef = this.getDocRef(id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
  }

  async delete(id) {
    const docRef = this.getDocRef(id);
    await deleteDoc(docRef);
  }

  async exists(id) {
    const docRef = this.getDocRef(id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }
}
