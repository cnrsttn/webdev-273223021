const express = require('express');
const path = require('path');
const crypto = require('crypto');
const services = require('./services');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '../public')));

  // Simple in-memory session store for slice 1
  const sessions = new Map();

  function getSessionUser(req) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('sessionId='));
    if (!sessionCookie) return null;
    const sessionId = sessionCookie.split('=')[1];
    return sessions.get(sessionId) || null;
  }

  app.get('/', (req, res) => {
    const user = getSessionUser(req);
    if (user) {
      res.redirect('/groups');
    } else {
      res.redirect('/login');
    }
  });

  app.get('/login', (req, res) => {
    const user = getSessionUser(req);
    if (user) {
      return res.redirect('/groups');
    }
    res.sendFile(path.join(__dirname, '../public/login.html'));
  });

  app.get('/groups', (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      // AC-10: A visitor who opens /groups without signing in is redirected to /login.
      return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../public/groups.html'));
  });

  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const user = await services.registerUser(email, password, name);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await services.authenticateUser(email, password);
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, user);
      res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly`);
      res.json({ success: true, user });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  });

  app.post('/api/logout', (req, res) => {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith('sessionId='));
      if (sessionCookie) {
        const sessionId = sessionCookie.split('=')[1];
        sessions.delete(sessionId);
      }
    }
    res.setHeader('Set-Cookie', 'sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    res.json({ success: true });
  });

  app.get('/api/groups', async (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const groups = await services.getStudyGroups();
      res.json(groups);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}

module.exports = { createApp };
