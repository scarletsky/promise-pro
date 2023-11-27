export const EVENT_ABORT = 'abort';
export const EVENT_TIMEOUT = 'timeout';
export const STATUS_PENDING = 0;
export const STATUS_FULFILLED = 1;
export const STATUS_REJECTED = 2;

export class PromisePro {
  constructor(executor, abortController = new AbortController()) {
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
  }

  get isPending() {
    return this.status === 0;
  }

  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.promise.catch(onRejected);
  }

  finally(onFinally) {
    return this.promise.finally(onFinally);
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
