// Run by `npm run api` before json-server starts.
// json-server writes every POST/PUT/DELETE into db.json, so we start each
// session from a fresh copy of seed.json. That keeps the committed seed data
// unchanged and gives every demo the same starting boards and tasks.
const fs = require('fs');
const path = require('path');

fs.copyFileSync(path.join(__dirname, 'seed.json'), path.join(__dirname, 'db.json'));
console.log('mock-api/db.json reset from seed.json');
