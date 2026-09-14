# Book Library API – INL 2

## Tema och syfte

Detta projekt är ett API-only-projekt för ett digitalt **bokbibliotek**. API:et låter klienter skapa, läsa, uppdatera och radera böcker. Det går även att filtrera listan efter författare, genre och om boken är tillgänglig.

Projektet examinerar Node.js-API-design, testning av Node.js-applikationer och planering av ett databasdrivet programmeringsprojekt.

## Teknik

- Node.js 18+
- Express
- SQLite via `better-sqlite3`
- Vitest och Supertest för testning
- CORS för att API:et ska kunna anropas från separata klienter

Det finns **ingen frontend** i denna inlämning. API:et testas med automatiska tester, curl, Postman eller en annan HTTP-klient.

## Datamodell

SQLite skapar filen `data/books.db` automatiskt.

```text
books
--------------------------------------------------------------
| id | title | author | genre | published_year | available |
--------------------------------------------------------------
| PK | text  | text   | text  | integer        | 0 eller 1 |
--------------------------------------------------------------
| created_at: text, databasens skapelsetid                   |
--------------------------------------------------------------
```

## Kom igång

```bash
# 1. Gå till projektmappen
cd api-book-library

# 2. Installera beroenden
npm install

# 3. Starta API:et
npm start
```

API:et kör då på `http://localhost:3002`.

För utveckling med automatisk omstart:

```bash
npm run dev
```

## Testning och TDD

Testsviten körs med:

```bash
npm test
```

Testerna använder en separat SQLite-databas i minnet så att riktiga data inte påverkas. Testerna verifierar att API:et kan skapa, läsa, uppdatera och radera böcker, filtrera resultat och returnera korrekta felkoder.

Arbetssättet följer **red-green-refactor**:

1. **Red:** testerna skrevs först för CRUD, filtrering och validering.
2. **Green:** API-routes och databaslogik implementerades tills testerna passerade.
3. **Refactor:** validering, felhantering och hjälpfunktioner separerades för tydligare kod.

## REST API-dokumentation

Basadress:

```text
http://localhost:3002/api
```

### Bokobjekt

```json
{
  "id": 1,
  "title": "Dune",
  "author": "Frank Herbert",
  "genre": "Science Fiction",
  "publishedYear": 1965,
  "available": true,
  "createdAt": "2026-09-14 12:00:00"
}
```

### GET `/api/health`

Kontrollerar att servern är igång.

```bash
curl http://localhost:3002/api/health
```

Svar:

```json
{ "status": "ok" }
```

### GET `/api/books`

Returnerar alla böcker.

```bash
curl http://localhost:3002/api/books
```

Filtrering sker med query-parametrar:

```bash
# Författare innehåller texten
curl "http://localhost:3002/api/books?author=herbert"

# Genre, skiftlägesokänsligt
curl "http://localhost:3002/api/books?genre=fantasy"

# Tillgänglighet
curl "http://localhost:3002/api/books?available=true"
```

Filtren kan kombineras:

```bash
curl "http://localhost:3002/api/books?genre=fantasy&available=true"
```

### GET `/api/books/:id`

Returnerar en bok med ett visst ID.

```bash
curl http://localhost:3002/api/books/1
```

### POST `/api/books`

Skapar en bok. `title`, `author`, `genre` och `publishedYear` krävs. `available` är valfritt och blir `true` om det utelämnas.

```bash
curl -X POST http://localhost:3002/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Dune","author":"Frank Herbert","genre":"Science Fiction","publishedYear":1965}'
```

Svar: `201 Created`.

### PATCH `/api/books/:id`

Uppdaterar ett eller flera fält.

```bash
curl -X PATCH http://localhost:3002/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"available":false}'
```

Svar: `200 OK` med den uppdaterade boken.

### DELETE `/api/books/:id`

Raderar en bok.

```bash
curl -X DELETE http://localhost:3002/api/books/1
```

Svar: `204 No Content`.

## Felhantering

API:et använder konsekventa HTTP-statuskoder:

| Status | Betydelse |
|---|---|
| `200` | Begäran lyckades |
| `201` | Resurs skapades |
| `204` | Resurs raderades utan svarskropp |
| `400` | Felaktig input, ID eller filter |
| `404` | Bok eller route hittades inte |
| `500` | Oväntat internt serverfel, exempelvis databasproblem |

Exempel på fel:

```json
{ "error": "Boken hittades inte." }
```

Alla databasoperationer ligger i `try/catch`. Express sista felhanterare loggar serverfelet och skickar inte interna detaljer till klienten.

## Kodgranskning av klasskamrat


```text
Klasskamrat: [fyll i namn]
Datum: [fyll i datum]
Testade endpoints: GET, POST, PATCH, DELETE samt filtrering
Kommentar: [fyll i klasskamratens sammanfattning]
```


