import test from 'tape';
import { PromisePro } from '../src/promise-pro.js';

test('PromisePro#constructor', async (t) => {
  const v1 = await new PromisePro(resolve => resolve(123));
  t.equal(v1, 123, 'executor `resolve` should return value.');

  try {
    await new PromisePro((_, reject) => reject(321));
  } catch (err) {
    t.equal(err , 321, 'executor `reject` should return value.');
  }

  await new PromisePro((resolve, _, options) => {
    t.ok(options, 'executor should have `options` parameter.');
    t.ok(options.signal, 'executor should have `options.signal` paramter.');
    resolve();
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
