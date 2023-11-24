export const EVENT_ABORT = 'abort';
export const EVENT_TIMEOUT = 'timeout';

export class PromisePro extends Promise {
  constructor(executor, abortController = new AbortController()) {
    super((resolve, reject) => {
      abortController.signal.addEventListener(EVENT_ABORT, reject);
      return executor(resolve, reject, abortController.signal);
    });
    this.timeoutFuncId = null;
    this.abortController = abortController;
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
