const express = require("express");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("./data.sqlite");

//── تسجيل دخول الإدارة باستخدام PIN
app.post("/api/admin/login", (req, res) => {
  const { pin } = req.body;
  db.get("SELECT value FROM settings WHERE key='admin_pin'", (err, row) => {
    if (!row) return res.status(500).json({ error: "PIN غير موجود" });
    bcrypt.compare(pin, row.value, (err, ok) => {
      if (!ok) return res.status(401).json({ error: "PIN خاطئ" });
      const token = jwt.sign({ admin: true }, process.env.JWT_SECRET);
      res.json({ token });
    });
  });
});

//── قائمة الحلاقين
app.get("/api/barbers", (req, res) => {
  db.all("SELECT * FROM barbers", (err, rows) => res.json(rows));
});

//── قائمة الخدمات
app.get("/api/services", (req, res) => {
  db.all("SELECT * FROM services", (err, rows) => res.json(rows));
});

//── إنشاء موعد جديد
app.post("/api/appointments", (req, res) => {
  const { client_name, client_phone, barber_id, service_id, starts_at } = req.body;

  const sql = `
    INSERT INTO appointments (client_name, client_phone, barber_id, service_id, starts_at)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [client_name, client_phone, barber_id, service_id, starts_at], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

//── إدارة: عرض جميع المواعيد
app.get("/api/appointments", (req, res) => {
  db.all(
    `SELECT a.*, b.name AS barber_name, s.name AS service_name
     FROM appointments a
     LEFT JOIN barbers b ON a.barber_id = b.id
     LEFT JOIN services s ON a.service_id = s.id`,
    (err, rows) => res.json(rows)
  );
});

app.listen(10000, () => console.log("Backend running on 10000"));
