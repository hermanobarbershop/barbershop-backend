const sqlite3 = require("sqlite3");
const bcrypt = require("bcryptjs");

const db = new sqlite3.Database("./data.sqlite");

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS barbers (id INTEGER PRIMARY KEY, name TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY, name TEXT, duration INTEGER)");
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY,
      client_name TEXT,
      client_phone TEXT,
      barber_id INTEGER,
      service_id INTEGER,
      starts_at TEXT
  )`);

  db.run("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)");

  const pinHash = bcrypt.hashSync(process.env.ADMIN_PIN || "1234", 10);

  db.run("INSERT OR REPLACE INTO settings VALUES ('admin_pin', ?)", [pinHash]);

  db.run("INSERT INTO barbers (name) VALUES ('أحمد'),('محمد')");
  db.run("INSERT INTO services (name, duration) VALUES ('قص شعر',30),('ذقن',20)");
});

db.close();
