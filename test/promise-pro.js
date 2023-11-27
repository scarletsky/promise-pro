import test from 'tape';
import {
  PromisePro,
  STATUS_PENDING,
  STATUS_FULFILLED,
  STATUS_REJECTED,
} from '../src/promise-pro.js';

test('PromisePro#constructor', async (t) => {

  t.test('`resolve` should work', async t => {
    const v1 = await new PromisePro(resolve => resolve(123));
    t.equal(v1, 123, 'executor `resolve` should return value.');
  });

  t.test('`reject` should work', async t => {
    try {
      await new PromisePro((_, reject) => reject(321));
    } catch (err) {
      t.equal(err , 321, 'executor `reject` should return value.');
    }
  });

  t.test('should have `options` paramter', async t => {
    await new PromisePro((resolve, _, options) => {
      t.ok(options, 'executor should have `options` parameter.');
      t.ok(options.signal, 'executor should have `options.signal` paramter.');
      resolve();
    });
  });

  t.test('should have `status` field', async t => {
    const p = new PromisePro(resolve => setTimeout(resolve, 0));
    t.equal(p.status, STATUS_PENDING, 'default `status` should be `STATUS_PENDING`');
  });

  t.end();
});

test('PromisePro#abort', async (t) => {
  const p = new PromisePro((resolve) => setTimeout(resolve, 1000));
  let abortEvent;

  try {
    p.abort();
    await p;
  } catch (e) {
    t.ok(e instanceof Event, 'reject value should be `Event` instance.');
    abortEvent = e;
  }

  try {
    p.abort();
    await p;
  } catch (e) {
    t.ok(e === abortEvent, 'call `abort` twice should not override the reject value.');
  }

  t.end();
});


test('PromisePro#timeout', async t => {
  t.test('`timeout` should trigger `abort`', async t => {
    const p = new PromisePro(resolve => setTimeout(resolve, 1000));
    p.timeout(100);

    try {
      await p;
    } catch (e) {
      t.ok(e instanceof Event, '`timeout` trigger');
      t.ok(p.abortController.signal.aborted, '`abort` trigger');
    }
  });

  t.test('`options.timeout` should work', async t => {
    const p = new PromisePro(resolve => setTimeout(resolve, 1000), { timeout: 500 });
    t.ok(p.timeoutFuncId);

    try {
      await p;
    } catch (e) {
      t.ok(e instanceof Event, 'timeout trigger');
    }
  });
});
