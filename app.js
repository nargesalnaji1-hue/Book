import express from 'express';
import cors from 'cors';

export function createApp(database) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  const toBook = (row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    publishedYear: row.published_year,
    available: Boolean(row.available),
    createdAt: row.created_at
  });

  const findBook = (id) => database.prepare('SELECT * FROM books WHERE id = ?').get(id);
  const validId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;
  const validateBook = (body, partial = false) => {
    const allowed = ['title', 'author', 'genre', 'publishedYear', 'available'];
    const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
    if (unknown.length) return `Okända fält: ${unknown.join(', ')}.`;
    const required = ['title', 'author', 'genre', 'publishedYear'];
    if (!partial && required.some((key) => body[key] === undefined)) return 'title, author, genre och publishedYear måste anges.';
    if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) return 'title måste vara en icke-tom text.';
    if (body.author !== undefined && (typeof body.author !== 'string' || !body.author.trim())) return 'author måste vara en icke-tom text.';
    if (body.genre !== undefined && (typeof body.genre !== 'string' || !body.genre.trim())) return 'genre måste vara en icke-tom text.';
    if (body.publishedYear !== undefined && (!Number.isInteger(body.publishedYear) || body.publishedYear < 0 || body.publishedYear > 2100)) return 'publishedYear måste vara ett heltal mellan 0 och 2100.';
    if (body.available !== undefined && typeof body.available !== 'boolean') return 'available måste vara true eller false.';
    return null;
  };

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/books', (req, res, next) => {
    try {
      const conditions = [];
      const values = [];
      if (req.query.author) { conditions.push('LOWER(author) LIKE LOWER(?)'); values.push(`%${req.query.author}%`); }
      if (req.query.genre) { conditions.push('LOWER(genre) = LOWER(?)'); values.push(req.query.genre); }
      if (req.query.available !== undefined) {
        if (!['true', 'false'].includes(req.query.available)) return res.status(400).json({ error: 'available-filtret måste vara true eller false.' });
        conditions.push('available = ?'); values.push(req.query.available === 'true' ? 1 : 0);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = database.prepare(`SELECT * FROM books ${where} ORDER BY id DESC`).all(...values);
      return res.json(rows.map(toBook));
    } catch (error) { return next(error); }
  });

  app.get('/api/books/:id', (req, res, next) => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ error: 'id måste vara ett positivt heltal.' });
      const book = findBook(req.params.id);
      return book ? res.json(toBook(book)) : res.status(404).json({ error: 'Boken hittades inte.' });
    } catch (error) { return next(error); }
  });

  app.post('/api/books', (req, res, next) => {
    try {
      const validationError = validateBook(req.body || {});
      if (validationError) return res.status(400).json({ error: validationError });
      const result = database.prepare('INSERT INTO books (title, author, genre, published_year, available) VALUES (?, ?, ?, ?, ?)').run(req.body.title.trim(), req.body.author.trim(), req.body.genre.trim(), req.body.publishedYear, req.body.available === undefined ? 1 : Number(req.body.available));
      return res.status(201).json(toBook(findBook(result.lastInsertRowid)));
    } catch (error) { return next(error); }
  });

  app.patch('/api/books/:id', (req, res, next) => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ error: 'id måste vara ett positivt heltal.' });
      if (!findBook(req.params.id)) return res.status(404).json({ error: 'Boken hittades inte.' });
      const validationError = validateBook(req.body || {}, true);
      if (validationError) return res.status(400).json({ error: validationError });
      const fields = []; const values = [];
      const fieldMap = { title: 'title', author: 'author', genre: 'genre', publishedYear: 'published_year', available: 'available' };
      for (const [key, column] of Object.entries(fieldMap)) if (req.body[key] !== undefined) { fields.push(`${column} = ?`); values.push(key === 'available' ? Number(req.body[key]) : typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key]); }
      if (!fields.length) return res.status(400).json({ error: 'Minst ett fält måste skickas för uppdatering.' });
      values.push(req.params.id);
      database.prepare(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      return res.json(toBook(findBook(req.params.id)));
    } catch (error) { return next(error); }
  });

  app.delete('/api/books/:id', (req, res, next) => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ error: 'id måste vara ett positivt heltal.' });
      const result = database.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
      return result.changes ? res.status(204).send() : res.status(404).json({ error: 'Boken hittades inte.' });
    } catch (error) { return next(error); }
  });

  app.use((_req, res) => res.status(404).json({ error: 'Routen hittades inte.' }));
  app.use((error, _req, res, _next) => {
    console.error(error);
    return res.status(500).json({ error: 'Ett internt serverfel inträffade.' });
  });
  return app;
}
