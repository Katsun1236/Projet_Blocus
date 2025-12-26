export class LoadingState {
  constructor() {
    this.activeLoaders = new Map();
  }

  start(key = 'default') {
    this.activeLoaders.set(key, true);
    this.emit('loading-start', key);
    return () => this.stop(key);
  }

  stop(key = 'default') {
    this.activeLoaders.delete(key);
    this.emit('loading-stop', key);
  }

  isLoading(key = 'default') {
    return this.activeLoaders.has(key);
  }

  isAnyLoading() {
    return this.activeLoaders.size > 0;
  }

  emit(eventName, key) {
    const event = new CustomEvent(eventName, { detail: { key } });
    window.dispatchEvent(event);
  }

  onLoadingStart(callback) {
    window.addEventListener('loading-start', (e) => callback(e.detail.key));
  }

  onLoadingStop(callback) {
    window.addEventListener('loading-stop', (e) => callback(e.detail.key));
  }
}

export const globalLoadingState = new LoadingState();

export function withLoading(asyncFn, key = 'default') {
  return async (...args) => {
    const stopLoading = globalLoadingState.start(key);
    try {
      return await asyncFn(...args);
    } finally {
      stopLoading();
    }
  };
}

export function useLoading(key = 'default') {
  return {
    start: () => globalLoadingState.start(key),
    stop: () => globalLoadingState.stop(key),
    isLoading: () => globalLoadingState.isLoading(key),
  };
}
