import EventEmitter from 'eventemitter3';
import { PromisePro } from './promise-pro.js';

export class PromiseQueuePro extends EventEmitter {
  static STATUS_IDLE = 0;
  static STATUS_ACTIVE = 1;
  static STATUS_PAUSED = 2;
  static EVENT_IDLE = 'idle';
  static EVENT_ACTIVE = 'active';
  static EVENT_PAUSE = 'pause';
  static EVENT_ADD = 'add';
  static EVENT_REMOVE = 'remove';
  static EVENT_ERROR = 'error';
  static EVENT_PROGRESS = 'progress';

  constructor(options = {}) {
    super();
    this.isPromiseQueuePro = true;
    this.status = PromiseQueuePro.STATUS_PAUSED;
    this.concurrency = (options.concurrency !== undefined) ? options.concurrency : Infinity;
    this.timeout = (options.timeout !== undefined) ? options.timeout : -1;
    this.waitingTasks = [];
    this.activeTasks = new Map();
    this.stats = {
      done: 0,
      total: 0,
    };

    if (options.autoStart) this.start();
  }

  get isIdle() {
    return this.status === PromiseQueuePro.STATUS_IDLE;
  }

  get isActive() {
    return this.status === PromiseQueuePro.STATUS_ACTIVE;
  }

  get isPaused() {
    return this.status === PromiseQueuePro.STATUS_PAUSED;
  }

  // NOTE: from https://github.com/sindresorhus/p-queue/blob/main/source/lower-bound.ts
  getIndex(task) {
    let first = 0;
    let count = this.size;

    while (count > 0) {
      const step = Math.trunc(count / 2);
      let it = first + step;
      let a = this.waitingTasks[it];
      let b = task;

      if ((b.priority - a.priority) <= 0) {
        first = ++it;
        count -= step + 1;
      } else {
        count = step;
      }
    }

    return first;
  }

  add(fn, options = {}) {
    const task = {
        fn,
        priority: options.priority || 0
    };
    const index = this.getIndex(task);
    this.waitingTasks.splice(index, 0, task);
    this.stats.total++;
    this.emit(PromiseQueuePro.EVENT_ADD);

    return this.dequeue();
  }

  remove(fn) {
    const index = this.waitingTasks.findIndex(task => task.fn === fn);

    if (index > -1) {
      this.waitingTasks.splice(index, 1);
      this.stats.total--;
      this.emit(PromiseQueuePro.EVENT_REMOVE);
    }

    return this.dequeue();
  }

  dequeue() {
    if (this.isPaused) return this;
    if (this.activeTasks.size === this.concurrency) return this;

    if (this.waitingTasks.length === 0) {

      if (this.activeTasks.size === 0) {
        this.status = PromiseQueuePro.STATUS_IDLE;
        this.emit(PromiseQueuePro.EVENT_IDLE);
        return this;
      }

      return this;
    }

    const handler = this.waitingTasks.shift();

    if (handler) {
      const promise = handler.fn();
      this.activeTasks.set(promise.id, promise);

      promise
        .then((v) => {
          this.activeTasks.delete(promise.id);
          this.stats.done++;
          this.emit(PromiseQueuePro.STATUS_PROGRESS, this.stats.done / this.stats.total);
          this.dequeue();
          return v;
        })
        .catch((err) => {
          this.activeTasks.delete(promise.id);
          this.stats.done++;
          this.emit(PromiseQueuePro.STATUS_PROGRESS, this.stats.done / this.stats.total);
          this.dequeue();
          return err;
        });
    }

    this.dequeue();
  }

  start() {
    if (!this.isPaused) return this;

    this.status = PromiseQueuePro.STATUS_ACTIVE;

    return this.dequeue();
  }

  pause() {
    if (this.isPaused) return this;
    this.status = PromiseQueuePro.STATUS_PAUSED;
    return this;
  }

  abort() {
    this.pause();
    this.activeTasks.values().forEach(promise => promise.abort());
    return this;
  }

  timeout(ms) {
    this.activeTasks.values().forEach(promise => promise.timeout(ms));
    return this;
  }

  clear() {
    this.waitingTasks.length = 0;
    this.abort();
    return this;
  }
}

export const PromiseQueue = PromiseQueuePro;
