const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db = null;

function getDb() {
  if (!db) {
    const dbFile = process.env.DB_FILE || path.join(__dirname, '../database.sqlite');
    db = new sqlite3.Database(dbFile);
  }
  return db;
}

function initDb() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.serialize(() => {
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL
        )
      `);

      database.run(`
        CREATE TABLE IF NOT EXISTS study_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          subject TEXT NOT NULL,
          description TEXT NOT NULL,
          creator_id INTEGER
        )
      `, (err) => {
        if (err) return reject(err);
        database.get(`SELECT COUNT(*) as count FROM study_groups`, (err, row) => {
          if (err) return reject(err);
          if (row.count === 0) {
            const stmt = database.prepare(`INSERT INTO study_groups (name, subject, description) VALUES (?, ?, ?)`);
            stmt.run('Calculus Study Group', 'Mathematics', 'Solving calculus problems together.');
            stmt.run('JavaScript Fundamentals', 'Computer Science', 'Learning JS basics and advanced concepts.');
            stmt.run('Organic Chemistry Club', 'Chemistry', 'Reviewing reaction mechanisms and lab reports.');
            stmt.finalize((err) => {
              if (err) return reject(err);
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    });
  });
}

function closeDb() {
  return new Promise((resolve) => {
    if (db) {
      db.close(() => {
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Data access functions (only place where SQL is written)
function createUser(email, passwordHash, name) {
  return new Promise((resolve, reject) => {
    getDb().run(
      `INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)`,
      [email, passwordHash, name],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, email, name });
      }
    );
  });
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    getDb().get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    getDb().get(`SELECT id, email, name FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function getAllGroups() {
  return new Promise((resolve, reject) => {
    getDb().all(`SELECT * FROM study_groups`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function getGroupById(id) {
  return new Promise((resolve, reject) => {
    getDb().get(`SELECT * FROM study_groups WHERE id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function createGroup(name, subject, description, creatorId) {
  return new Promise((resolve, reject) => {
    getDb().run(
      `INSERT INTO study_groups (name, subject, description, creator_id) VALUES (?, ?, ?, ?)`,
      [name, subject, description, creatorId],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name, subject, description, creator_id: creatorId });
      }
    );
  });
}

function deleteGroup(id) {
  return new Promise((resolve, reject) => {
    getDb().run(`DELETE FROM study_groups WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

module.exports = {
  getDb,
  initDb,
  closeDb,
  createUser,
  getUserByEmail,
  getUserById,
  getAllGroups,
  getGroupById,
  createGroup,
  deleteGroup
};
