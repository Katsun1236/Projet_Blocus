import {
  query,
  getDocs,
  limit,
  startAfter,
  orderBy,
  getCountFromServer
} from 'firebase/firestore';

export class PaginationHelper {
  constructor(collectionRef, pageSize = 10, orderByField = 'createdAt', orderDirection = 'desc') {
    this.collectionRef = collectionRef;
    this.pageSize = pageSize;
    this.orderByField = orderByField;
    this.orderDirection = orderDirection;
    this.lastDoc = null;
    this.hasMore = true;
    this.currentPage = 0;
  }

  async getFirstPage(additionalConstraints = []) {
    this.currentPage = 1;
    this.lastDoc = null;

    const q = query(
      this.collectionRef,
      ...additionalConstraints,
      orderBy(this.orderByField, this.orderDirection),
      limit(this.pageSize)
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    this.hasMore = snapshot.docs.length === this.pageSize;

    return {
      docs,
      hasMore: this.hasMore,
      page: this.currentPage
    };
  }

  async getNextPage(additionalConstraints = []) {
    if (!this.hasMore || !this.lastDoc) {
      return {
        docs: [],
        hasMore: false,
        page: this.currentPage
      };
    }

    this.currentPage++;

    const q = query(
      this.collectionRef,
      ...additionalConstraints,
      orderBy(this.orderByField, this.orderDirection),
      startAfter(this.lastDoc),
      limit(this.pageSize)
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    this.hasMore = snapshot.docs.length === this.pageSize;

    return {
      docs,
      hasMore: this.hasMore,
      page: this.currentPage
    };
  }

  async getTotalCount(additionalConstraints = []) {
    const q = query(
      this.collectionRef,
      ...additionalConstraints
    );

    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }

  reset() {
    this.lastDoc = null;
    this.hasMore = true;
    this.currentPage = 0;
  }
}

export function createPagination(collectionRef, options = {}) {
  const {
    pageSize = 10,
    orderByField = 'createdAt',
    orderDirection = 'desc'
  } = options;

  return new PaginationHelper(collectionRef, pageSize, orderByField, orderDirection);
}
