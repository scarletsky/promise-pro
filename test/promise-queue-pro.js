import test from 'tape';
import { sleep } from '../src/utils.js';
import { PromisePro } from '../src/promise-pro.js';
import { PromiseQueuePro } from '../src/promise-queue-pro.js';


test('PromiseQueuePro#constructor', async t => {
  t.test('no options (default)', async t => {
    const q = new PromiseQueuePro();
    t.equal(q.status, PromiseQueuePro.STATUS_PAUSED);
    t.equal(q.concurrency, Infinity);
    t.equal(q.timeout, -1);
  });
});

test('PromiseQueuePro#add', async t => {
  t.test('with `autoStart=false`', async t => {
    const q = new PromiseQueuePro();
    q.add(() => PromisePro.resolve(111));
    q.add(() => PromisePro.resolve(222));
    q.add(() => PromisePro.resolve(333));
    t.equal(q.status, PromiseQueuePro.STATUS_PAUSED);
    t.equal(q.waitingTasks.length, 3);
  });

  t.test('with `autoStart=true`', async t => {
    const q = new PromiseQueuePro({ autoStart: true });
    q.add(() => PromisePro.resolve(111));
    q.add(() => PromisePro.resolve(222));
    q.add(() => PromisePro.resolve(333));
    t.notEqual(q.status, PromiseQueuePro.STATUS_PAUSED);
    t.equal(q.waitingTasks.length, 0);
  });

  t.test('with `autoStart=true` && native Promise', async t => {
    const q = new PromiseQueuePro({ autoStart: true });
    q.add(() => Promise.resolve(111));
    q.add(() => Promise.reject(222));
    q.add(() => PromisePro.resolve(333));
    q.add(() => PromisePro.reject(444));
  });
});

test('PromiseQueuePro#start', async t => {
  const q = new PromiseQueuePro();
  q.add(() => PromisePro.resolve(111));
  q.add(() => PromisePro.resolve(222));
  q.add(() => PromisePro.resolve(333));
  t.equal(q.status, PromiseQueuePro.STATUS_PAUSED);
  t.equal(q.waitingTasks.length, 3);
  q.start();
  t.notEqual(q.status, PromiseQueuePro.STATUS_PAUSED);
  t.equal(q.waitingTasks.length, 0);
});

test('PromiseQueuePro#pause', async t => {
  const q = new PromiseQueuePro({ autoStart: true });
  t.notEqual(q.status, PromiseQueuePro.STATUS_PAUSED);
  q.pause();
  t.equal(q.status, PromiseQueuePro.STATUS_PAUSED);
});

test('PromiseQueuePro#dequeue', async t => {
  t.test('with default `concurrency`', async t => {
    const q = new PromiseQueuePro({ autoStart: true });
    q.add(() => new PromisePro(resolve => setTimeout(() => resolve(111), 100)));
    q.add(() => new PromisePro(resolve => setTimeout(() => resolve(222), 250)));
    q.add(() => new PromisePro(resolve => setTimeout(() => resolve(333), 500)));
    t.equal(q.waitingTasks.length, 0);
    t.equal(q.activeTasks.size, 3);
    await sleep(200);
    t.equal(q.activeTasks.size, 2);
    await sleep(200);
    t.equal(q.activeTasks.size, 1);
    await sleep(250);
    t.equal(q.activeTasks.size, 0);
  });

  t.test('with `concurrency=1`', async t => {
    const q = new PromiseQueuePro({ concurrency: 1 });
    q.add(() => new PromisePro(resolve => setTimeout(() => resolve(111), 100)));
    q.add(() => new PromisePro(resolve => setTimeout(() => resolve(222), 250)));
    q.add(() => new PromisePro(resolve => setTimeout(() => resolve(333), 500)));
    t.equal(q.activeTasks.size, 0);
    t.equal(q.waitingTasks.length, 3);
    q.start();

    t.equal(q.activeTasks.size, 1);
    t.equal(q.waitingTasks.length, 2);

    await sleep(200);

    t.equal(q.activeTasks.size, 1);
    t.equal(q.waitingTasks.length, 2);

    await sleep(300);

    t.equal(q.activeTasks.size, 1);
    t.equal(q.waitingTasks.length, 1);

    await sleep(400);

    t.equal(q.activeTasks.size, 0);
    t.equal(q.waitingTasks.length, 0);
  });
});
