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

test('PromisePro.all', async t => {

  t.test('`PromisePro` resolves', async t => {
    const v = await PromisePro.all([
      PromisePro.resolve(1),
      PromisePro.resolve(2),
    ]);
    t.same(v, [1, 2]);
  });

  t.test('`PromisePro` rejects', async t => {
    try {
      await PromisePro.all([
        PromisePro.reject(3),
        PromisePro.resolve(4),
      ]);
    } catch (e) {
      t.same(e, 3);
    }
  });

  t.test('native `Promise` and `PromisePro` resolves', async t => {
    const v = await PromisePro.all([
      Promise.resolve(5),
      PromisePro.resolve(6),
    ]);
    t.same(v, [5, 6]);
  });

  t.test('native `Promise` with `PromisePro` rejects', async t => {
    try {
      await PromisePro.all([
        PromisePro.reject(7),
        PromisePro.resolve(8),
      ]);
    } catch (e) {
      t.same(e, 7);
    }
  });

  t.test('abort', async t => {
    const abortController = new AbortController();
    const p1 = new PromisePro((resolve) => setTimeout(() => resolve(1), 1000), { abortController });
    const p2 = new PromisePro((resolve) => setTimeout(() => resolve(2), 1000), { abortController });
    const p = PromisePro.all([p1, p2], { abortController });
    p.abort();

    try {
      await p;
    } catch (e) {
      t.equal(p1.status, STATUS_REJECTED);
      t.equal(p2.status, STATUS_REJECTED);
      t.equal(p.status, STATUS_REJECTED);
    }
  });
});

test('PromisePro#allSettled', async t => {

  t.test('`PromisePro` resolves and rejects', async t => {
    const v = await PromisePro.allSettled([
      PromisePro.resolve(1),
      new PromisePro((resolve, _) => setTimeout(() => resolve(2), 500)),
      new PromisePro((_, reject) => setTimeout(() => reject(3), 200)),
    ]);
    t.equal(v[0].value, 1);
    t.equal(v[1].value, 2);
    t.equal(v[2].reason, 3);
  });

  t.test('abort', async t => {
    const abortController = new AbortController();
    const p1 = new PromisePro((resolve) => setTimeout(() => resolve(1), 1000), { abortController });
    const p2 = new PromisePro((resolve) => setTimeout(() => resolve(2), 1000), { abortController });
    const p = PromisePro.allSettled([p1, p2], { abortController });
    p.abort();

    try {
      await p;
    } catch (e) {
      t.equal(p1.status, STATUS_REJECTED);
      t.equal(p2.status, STATUS_REJECTED);
      t.equal(p.status, STATUS_REJECTED);
    }
  });

});
