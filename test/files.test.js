import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

const png = await readFile(new URL('../avatar.png', import.meta.url));
const pdf = await readFile(new URL('../b.pdf', import.meta.url));

async function setup(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'upload-api-'));
  const uploadDir = path.join(directory, 'uploads');
  const server = createApp({ uploadDir }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}/api/files`;
  const upload = (files, suffix = '') => {
    const form = new FormData();
    for (const [field, content, name, type] of files) form.append(field, new Blob([content], { type }), name);
    return fetch(base + suffix, { method: 'POST', body: form });
  };
  return { base, upload, uploadDir, directory };
}

test('single upload, list, byte-identical download, delete and missing file', async (t) => {
  const { base, upload } = await setup(t);
  const response = await upload([['file', png, 'avatar.png', 'image/png']]);
  assert.equal(response.status, 201);
  const file = await response.json();
  assert.equal(file.originalName, 'avatar.png');
  assert.equal(file.size, png.length);
  assert.notEqual(file.filename, 'avatar.png');
  assert.equal((await (await fetch(base + '/multiple')).json()).length, 1);
  const download = await fetch(base + '/' + file.filename);
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /attachment/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), png);
  assert.equal((await fetch(base + '/' + file.filename, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(base + '/' + file.filename)).status, 404);
  assert.equal((await fetch(base + '/' + file.filename, { method: 'DELETE' })).status, 404);
});

test('multiple accepts PNG and PDF; image listing excludes PDF', async (t) => {
  const { base, upload } = await setup(t);
  const response = await upload([
    ['files', png, 'a.png', 'image/png'], ['files', pdf, 'b.pdf', 'application/pdf'],
  ], '/multiple');
  assert.equal(response.status, 201);
  assert.equal((await response.json()).count, 2);
  assert.equal((await (await fetch(base)).json()).length, 2);
  const images = await (await fetch(base + '/multiple')).json();
  assert.equal(images.length, 1);
  assert.match(images[0].filename, /\.png$/);
});

test('missing files and wrong field return 400', async (t) => {
  const { base, upload } = await setup(t);
  for (const suffix of ['', '/multiple']) {
    assert.equal((await fetch(base + suffix, { method: 'POST' })).status, 400);
  }
  assert.equal((await upload([['avatar', png, 'avatar.png', 'image/png']])).status, 400);
});

test('unsupported extension, MIME mismatch, and truncated content return 415', async (t) => {
  const { upload, uploadDir } = await setup(t);
  for (const file of [
    ['file', '<script>bad</script>', 'a.html', 'text/html'],
    ['file', pdf, 'fake.png', 'image/png'],
    ['file', 'not a png', 'fake.png', 'image/png'],
    ['file', png.subarray(0, 10), 'short.png', 'image/png'],
  ]) assert.equal((await upload([file])).status, 415);
  assert.deepEqual(await readdir(path.join(uploadDir, '.staging')), []);
  assert.deepEqual(await readdir(uploadDir), ['.staging']);
});

test('a bad file rolls back the entire batch', async (t) => {
  const { base, upload, uploadDir } = await setup(t);
  const response = await upload([
    ['files', png, 'a.png', 'image/png'], ['files', 'fake', 'b.pdf', 'application/pdf'],
  ], '/multiple');
  assert.equal(response.status, 415);
  assert.deepEqual(await (await fetch(base)).json(), []);
  assert.deepEqual(await readdir(path.join(uploadDir, '.staging')), []);
});

test('over 5 MB returns 413 and cleans partial uploads', async (t) => {
  const { upload, uploadDir } = await setup(t);
  const response = await upload([['file', Buffer.alloc(5 * 1024 * 1024 + 1), 'big.png', 'image/png']]);
  assert.equal(response.status, 413);
  assert.deepEqual(await readdir(path.join(uploadDir, '.staging')), []);
});

test('six files return 400 and leave no partial files', async (t) => {
  const { base, upload, uploadDir } = await setup(t);
  const response = await upload(Array.from({ length: 6 }, () => ['files', png, 'a.png', 'image/png']), '/multiple');
  assert.equal(response.status, 400);
  assert.deepEqual(await (await fetch(base)).json(), []);
  assert.deepEqual(await readdir(path.join(uploadDir, '.staging')), []);
});

test('duplicate original names generate distinct stored files', async (t) => {
  const { upload } = await setup(t);
  const first = await (await upload([['file', png, 'a.png', 'image/png']])).json();
  const second = await (await upload([['file', png, 'a.png', 'image/png']])).json();
  assert.notEqual(first.filename, second.filename);
});

test('traversal, hidden files and symlinks cannot be downloaded or deleted', async (t) => {
  const { base, uploadDir, directory } = await setup(t);
  const outside = path.join(directory, 'secret.png');
  await writeFile(outside, 'private');
  const linkName = '12345678-1234-4123-8123-123456789abc.png';
  await symlink(outside, path.join(uploadDir, linkName));
  for (const name of ['..%2Fsecret.png', '%2Fetc%2Fpasswd', '.gitkeep', linkName]) {
    assert.equal((await fetch(base + '/' + name)).status, 404);
    assert.equal((await fetch(base + '/' + name, { method: 'DELETE' })).status, 404);
  }
  assert.deepEqual(await (await fetch(base)).json(), []);
  assert.equal(await readFile(outside, 'utf8'), 'private');
});
