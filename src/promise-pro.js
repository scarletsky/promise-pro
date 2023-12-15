export class PromisePro {
  static ID_COUNTER = 0;
  static EVENT_ABORT = 'abort';
  static EVENT_TIMEOUT = 'timeout';
  static STATUS_PENDING = 0;
  static STATUS_FULFILLED = 1;
  static STATUS_REJECTED = 2;
  static FUNC_RESOLVE = 0;
  static FUNC_REJECT = 1;

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

    this.id = ++PromisePro.ID_COUNTER;
    this.isPromisePro = true;
    this.options = options;
    this.abortController = options.abortController;
    this.status = PromisePro.STATUS_PENDING;

    this.timeoutFuncId = null;
    if (options.timeout > 0) this.timeout(options.timeout);

    this.promise = new Promise((resolve, reject) => {
      this.resolveFunc = (v) => {
        if (this.isPending) {
          this.status = PromisePro.STATUS_FULFILLED;
          this.clear();
          resolve(v);
        }
      };

      this.rejectFunc = (v) => {
        if (this.isPending) {
          this.status = PromisePro.STATUS_REJECTED;
          this.clear();
          reject(v);
        }
      };

      const abortFunc = (options.abortFunc === PromisePro.FUNC_RESOLVE)
            ? this.resolveFunc
            : this.rejectFunc;

      if (this.abortController.signal.aborted) {
        return abortFunc(this.abortController.signal.reason);
      }

      this.abortFunc = abortFunc;
      this.abortController.signal.addEventListener(PromisePro.EVENT_ABORT, this.abortFunc);
      return executor(this.resolveFunc, this.rejectFunc, { signal: this.abortController.signal });
    });
  }

  get isPending() {
    return this.status === PromisePro.STATUS_PENDING;
  }

  then(onFulfilled, onRejected) {
    return new PromisePro((resolve, reject) => {
      this.promise.then(
        value => {
          if (onFulfilled) {
            try {
              resolve(onFulfilled(value));
            } catch(error) {
              reject(error);
            }
          } else {
            resolve(value);
          }
        },
        reason => {
          if (onRejected) {
            try {
              resolve(onRejected(reason));
            } catch (error) {
              reject(error);
            }
          } else {
            reject(reason);
          }
        }
      );
    });
  }

  catch(onRejected) {
    return new PromisePro((resolve, reject) => {
      this.promise.catch(
        reason => {
          if (onRejected) {
            try {
              resolve(onRejected(reason));
            } catch (error) {
              reject(error);
            }
          } else {
            reject(reason);
          }
        }
      )
    });
  }

  finally(onFinally) {
    return new PromisePro((resolve, reject) => {
      this.promise.finally((v) => {
        if (onFinally) {
          try {
            resolve(onFinally);
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(v);
        }
      });
    });
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

  clear() {
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
