import assert from 'node:assert/strict';
import { test } from 'node:test';


const importESM : (specifier : string) => Promise<any> =
  // eslint-disable-next-line no-eval
  eval('(specifier) => import(specifier)');

test('Piscina is default export', {}, async () => {
  assert.strictEqual((await importESM('piscina')).default, require('../'));
});

test('Exports match own property names', {}, async () => {
  // Check that version, workerData, etc. are re-exported.
  const exported = new Set(Object.getOwnPropertyNames(await importESM('piscina')));
  const required = new Set(Object.getOwnPropertyNames(require('../')));

  // Remove constructor properties + default export.
  for (const k of ['prototype', 'length', 'name']) required.delete(k);
  exported.delete('default');

  assert.deepStrictEqual(exported, required);
});
