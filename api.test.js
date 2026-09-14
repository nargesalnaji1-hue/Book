import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import request from 'supertest';
import { createApp } from '../src/app.js';

const databases = [];
function api() {
  const database = new Database(':memory:');
  database.exec(`CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    published_year INTEGER NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  databases.push(database);
  return request(createApp(database));
}
const book = { title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', publishedYear: 1965 };
afterEach(() => databases.splice(0).forEach((database) => database.close()));

describe('Book Library API', () => {
  it('skapar och hämtar en bok', async () => {
    const client = api();
    const created = await client.post('/api/books').send(book);
    expect(created.status).toBe(201);
    expect(created.body.title).toBe('Dune');
    const fetched = await client.get(`/api/books/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.author).toBe('Frank Herbert');
  });

  it('listar och filtrerar böcker på genre och författare', async () => {
    const client = api();
    await client.post('/api/books').send(book);
    await client.post('/api/books').send({ ...book, title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy' });
    const byGenre = await client.get('/api/books?genre=fantasy');
    expect(byGenre.body).toHaveLength(1);
    expect(byGenre.body[0].title).toBe('The Hobbit');
    const byAuthor = await client.get('/api/books?author=herbert');
    expect(byAuthor.body).toHaveLength(1);
  });

  it('uppdaterar en bok', async () => {
    const client = api();
    const created = await client.post('/api/books').send(book);
    const updated = await client.patch(`/api/books/${created.body.id}`).send({ available: false, genre: 'Klassiker' });
    expect(updated.status).toBe(200);
    expect(updated.body.available).toBe(false);
    expect(updated.body.genre).toBe('Klassiker');
  });

  it('raderar en bok', async () => {
    const client = api();
    const created = await client.post('/api/books').send(book);
    expect((await client.delete(`/api/books/${created.body.id}`)).status).toBe(204);
    expect((await client.get(`/api/books/${created.body.id}`)).status).toBe(404);
  });

  it('validerar indata och okända routes', async () => {
    const client = api();
    expect((await client.post('/api/books').send({ title: 'Saknas fält' })).status).toBe(400);
    expect((await client.get('/api/books?available=maybe')).status).toBe(400);
    expect((await client.get('/api/does-not-exist')).status).toBe(404);
  });
});
