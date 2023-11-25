export const EVENT_ABORT = 'abort';
export const EVENT_TIMEOUT = 'timeout';
export const STATUS_PENDING = 0;
export const STATUS_FULFILLED = 1;
export const STATUS_REJECTED = 2;

export class PromisePro extends Promise {
  constructor(executor, abortController = new AbortController()) {
    super((resolve, reject) => {
      abortController.signal.addEventListener(EVENT_ABORT, reject);
      return executor(resolve, reject, abortController.signal);
    });
    this.status = STATUS_PENDING;
    this.timeoutFuncId = null;
    this.abortController = abortController;
  }

  then(onFulfilled, onRejected) {
    return super.then(
      value => {
        this.status = STATUS_FULFILLED;
        if (onFulfilled) return onFulfilled(value);
      },
      reason => {
        this.status = STATUS_REJECTED;
        if (onRejected) return onRejected(reason);
      }
    );
  }

  catch(onRejected) {
    return super.catch(reason => {
      this.status = STATUS_REJECTED;
      if (onRejected) return onRejected(reason);
    })
  }

  abort(reason) {
    if (!this.abortController.signal.aborted) {
      this.abortController.abort(reason);
    }
  }

  timeout(ms) {
    if (this.timeoutFuncId) {
      clearTimeout(this.timeoutFuncId);
      this.timeoutFuncId = null;
    }

    this.timeoutFuncId = setTimeout(() => this.abort(EVENT_TIMEOUT), ms);
  }
}
