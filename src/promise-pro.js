export const EVENT_ABORT = 'abort';
export const EVENT_TIMEOUT = 'timeout';
export const STATUS_PENDING = 0;
export const STATUS_FULFILLED = 1;
export const STATUS_REJECTED = 2;

export class PromisePro {
  static resolve(v) {
    return new PromisePro((resolve, _) => resolve(v));
  }

  static reject(v) {
    return new PromisePro((_, reject) => reject(v));
  }

  static all(iterable, options = {}) {
    return new PromisePro((resolve, reject) => {
      Promise.all(iterable).then(resolve).catch(reject);
    }, options);
  }

  static allSettled(iterable, options = {}) {
    return new PromisePro((resolve, reject) => {
      return Promise.allSettled(iterable).then(resolve).catch(reject);
    }, options);
  }

  constructor(executor, options = {}) {
    const abortController = options.abortController || new AbortController();

    this.isPromisePro = true;
    this.status = STATUS_PENDING;
    this.abortController = abortController;
    this.timeoutFuncId = null;
    this.promise = new Promise((resolve, reject) => {
      this.resolveFunc = (v) => {
        this.status = STATUS_FULFILLED;
        return resolve(v);
      };

      this.rejectFunc = (v) => {
        this.status = STATUS_REJECTED;
        return reject(v);
      };

      this.abortFunc = (v) => {
        abortController.signal.removeEventListener(EVENT_ABORT, this.abortFunc);
        return this.rejectFunc(v);
      }

      abortController.signal.addEventListener(EVENT_ABORT, this.abortFunc);
      return executor(this.resolveFunc, this.rejectFunc, { signal: abortController.signal });
    });

    if (options.timeout > 0) this.timeout(options.timeout);
  }

  get isPending() {
    return this.status === 0;
  }

  then(onFulfilled, onRejected) {
    this.promise.then(onFulfilled, onRejected);
    return this;
  }

  catch(onRejected) {
    this.promise.catch(onRejected);
    return this;
  }

  finally(onFinally) {
    this.promise.finally(onFinally);
    return this;
  }

  abort(reason) {
    if (!this.isPending) return this;

    if (!this.abortController.signal.aborted) {
      this.abortController.abort(reason);
    }

    return this;
  }

  timeout(ms) {
    if (!this.isPending) return this;;

    this._clearTimeout();
    this.timeoutFuncId = setTimeout(() => this.abort(EVENT_TIMEOUT), ms);

    return this;
  }

  clean() {
    this._clearAbort();
    this._clearTimeout();
  }

  _clearAbort() {

  }

  _clearTimeout() {
    if (this.timeoutFuncId) {
      clearTimeout(this.timeoutFuncId);
      this.timeoutFuncId = null;
    }
  }
}
