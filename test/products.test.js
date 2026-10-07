import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

async function setup(t) {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = `${origin}/api/products`;
  const json = (method, url, body) => fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { origin, base, json };
}

test('all six product operations return the documented statuses and state', async (t) => {
  const { base, json } = await setup(t);
  const initial = await fetch(base);
  assert.equal(initial.status, 200);
  assert.equal((await initial.json()).total, 2);

  const created = await json('POST', base, { name: 'Desk lamp', price: 799, stock: 4, category: 'electronics' });
  assert.equal(created.status, 201);
  const product = await created.json();
  assert.equal(created.headers.get('location'), `/api/products/${product.id}`);
  assert.equal(product.name, 'Desk lamp');

  const one = await fetch(`${base}/${product.id}`);
  assert.equal(one.status, 200);
  assert.deepEqual(await one.json(), product);

  const put = await json('PUT', `${base}/${product.id}`, { name: 'Updated lamp', price: 899 });
  assert.equal(put.status, 200);
  const replaced = await put.json();
  assert.equal(replaced.stock, 0);
  assert.equal(replaced.category, undefined);
  assert.equal(replaced.createdAt, product.createdAt);

  const patch = await json('PATCH', `${base}/${product.id}`, { stock: 8 });
  assert.equal(patch.status, 200);
  const changed = await patch.json();
  assert.equal(changed.name, 'Updated lamp');
  assert.equal(changed.stock, 8);

  const deleted = await fetch(`${base}/${product.id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 204);
  assert.equal(await deleted.text(), '');
  assert.equal((await fetch(`${base}/${product.id}`)).status, 404);
});

test('search, category, and pagination return matching products', async (t) => {
  const { base } = await setup(t);
  const response = await fetch(`${base}?q=node&category=books&page=1&limit=1`);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.total, 1);
  assert.equal(result.data[0].name, 'Node.js book');
  assert.equal((await (await fetch(`${base}?page=2&limit=1`)).json()).data[0].id, 2);
});

test('invalid data and IDs return 400, missing product returns 404', async (t) => {
  const { base, json } = await setup(t);
  for (const body of [{ name: '', price: 1 }, { name: 'A', price: -1 }, { name: 'A', price: 1, stock: 2.5 }, { name: 'A', price: 1, unknown: true }]) {
    assert.equal((await json('POST', base, body)).status, 400);
  }
  assert.equal((await json('PATCH', `${base}/1`, {})).status, 400);
  assert.equal((await json('PUT', `${base}/1`, { name: 'Only name' })).status, 400);
  assert.equal((await fetch(`${base}/0`)).status, 400);
  assert.equal((await fetch(`${base}/999`)).status, 404);
  assert.equal((await fetch(`${base}?limit=101`)).status, 400);
});

test('Swagger UI and OpenAPI JSON include all six endpoints', async (t) => {
  const { origin } = await setup(t);
  const page = await fetch(`${origin}/api-docs/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /swagger-ui/i);
  const specResponse = await fetch(`${origin}/api-docs.json`);
  assert.equal(specResponse.status, 200);
  const spec = await specResponse.json();
  assert.equal(spec.openapi, '3.0.3');
  assert.deepEqual(Object.keys(spec.paths['/api/products']).sort(), ['get', 'post']);
  assert.deepEqual(Object.keys(spec.paths['/api/products/{id}']).filter((method) => method !== 'parameters').sort(), ['delete', 'get', 'patch', 'put']);
});
