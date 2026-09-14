import { createApp } from './app.js';
import { database } from './database.js';

const port = Number(process.env.PORT || 3002);
createApp(database).listen(port, () => console.log(`Book API kör på http://localhost:${port}`));
