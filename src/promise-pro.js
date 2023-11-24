const EVENT_ABORT = 'abort';

export class PromisePro extends Promise {
  constructor(executor, abortController = new AbortController()) {
    super((resolve, reject) => {
      abortController.signal.addEventListener(EVENT_ABORT, reject);
      return executor(resolve, reject, abortController.signal);
    });
    this.abortController = abortController;
  }

  abort(reason) {
    if (!this.abortController.signal.aborted) {
      this.abortController.abort(reason);
    }
  }
}
