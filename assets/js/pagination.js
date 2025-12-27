/**
 * Pagination utility for Firestore queries
 */

export class PaginatedQuery {
    constructor(queryFn, pageSize = 20) {
        this.queryFn = queryFn;
        this.pageSize = pageSize;
        this.lastDoc = null;
        this.hasMore = true;
        this.allDocs = [];
    }

    async loadNext() {
        if (!this.hasMore) return [];

        const queryRef = this.queryFn(this.pageSize, this.lastDoc);
        const snapshot = await queryRef.get();

        if (snapshot.empty) {
            this.hasMore = false;
            return [];
        }

        const docs = [];
        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
            this.allDocs.push({ id: doc.id, ...doc.data() });
        });

        if (docs.length < this.pageSize) {
            this.hasMore = false;
        } else {
            this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
        }

        return docs;
    }

    reset() {
        this.lastDoc = null;
        this.hasMore = true;
        this.allDocs = [];
    }

    getAll() {
        return this.allDocs;
    }
}

/**
 * Simple load more button handler
 */
export function createLoadMoreButton(onLoad, container) {
    const btn = document.createElement('button');
    btn.className = 'w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-400 hover:text-white transition-all';
    btn.innerHTML = '<i class="fas fa-chevron-down mr-2"></i>Charger plus';

    btn.onclick = async () => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i>Chargement...';

        try {
            const hasMore = await onLoad();
            if (!hasMore) {
                btn.remove();
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-chevron-down mr-2"></i>Charger plus';
            }
        } catch (e) {
            console.error('Error loading more:', e);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Erreur - Réessayer';
        }
    };

    if (container) {
        container.appendChild(btn);
    }

    return btn;
}

/**
 * Infinite scroll observer
 */
export function createInfiniteScroll(onLoad, sentinel) {
    const observer = new IntersectionObserver(
        async (entries) => {
            if (entries[0].isIntersecting) {
                await onLoad();
            }
        },
        {
            rootMargin: '100px'
        }
    );

    if (sentinel) {
        observer.observe(sentinel);
    }

    return observer;
}
