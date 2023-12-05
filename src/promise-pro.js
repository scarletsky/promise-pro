export class PromisePro {
  static EVENT_ABORT = 'abort';
  static EVENT_TIMEOUT = 'timeout';
  static STATUS_PENDING = 0;
  static STATUS_FULFILLED = 1;
  static STATUS_REJECTED = 2;

  static resolve(v, options = {}) {
    return new PromisePro((resolve, _) => resolve(v), options);
  }

  static reject(v, options = {}) {
    return new PromisePro((_, reject) => reject(v), options);
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
    if (!options.abortController) {
      options.abortController = new AbortController();
    }

    this.isPromisePro = true;
    this.options = options;
    this.abortController = options.abortController;
    this.timeoutFuncId = null;

    this.status = PromisePro.STATUS_PENDING;
    this.promise = new Promise((resolve, reject) => {
      this.resolveFunc = (v) => {
        this.status = PromisePro.STATUS_FULFILLED;
        resolve(v);

        this._clean();
      };

      this.rejectFunc = (v) => {
        this.status = PromisePro.STATUS_REJECTED;
        reject(v);

        this._clean();
      };

      this.abortFunc = (v) => this.rejectFunc(v);

      this.abortController.signal.addEventListener(PromisePro.EVENT_ABORT, this.abortFunc);
      return executor(this.resolveFunc, this.rejectFunc, { signal: this.abortController.signal });
    });

    if (options.timeout > 0) this.timeout(options.timeout);
  }

  get isPending() {
    return this.status === PromisePro.STATUS_PENDING;
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
    if (!this.isPending) return this;

    this._clearTimeout();
    this.timeoutFuncId = setTimeout(() => this.abort(PromisePro.EVENT_TIMEOUT), ms);

    return this;
  }

  _clean() {
    this._clearAbort();
    this._clearTimeout();
    this.resolveFunc = null;
    this.rejectFunc = null;
  }

  _clearAbort() {
    if (this.abortFunc) {
      this.abortController.signal.removeEventListener(PromisePro.EVENT_ABORT, this.abortFunc);
      this.abortFunc = null;
    }
  }

  _clearTimeout() {
    if (this.timeoutFuncId) {
      clearTimeout(this.timeoutFuncId);
      this.timeoutFuncId = null;
    }
  }
}
