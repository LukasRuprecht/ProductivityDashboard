const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const dbPath = './pomodoro.db';
console.log('Attempting to connect to database at:', path.resolve(dbPath));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database');

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS preferences (
      user_id INTEGER PRIMARY KEY,
      study_sessions INTEGER DEFAULT 4,
      study_length INTEGER DEFAULT 25,
      break_length INTEGER DEFAULT 5,
      long_break_length INTEGER DEFAULT 15,
      enable_long_breaks BOOLEAN DEFAULT 1,
      auto_start_breaks BOOLEAN DEFAULT 0,
      auto_start_pomodoros BOOLEAN DEFAULT 0,
      dark_mode BOOLEAN DEFAULT 0,
      notifications BOOLEAN DEFAULT 1,
      sound_enabled BOOLEAN DEFAULT 1,
      sound_volume INTEGER DEFAULT 75,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  }
});

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

  db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
    if (row) return res.status(409).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
      if (err) return res.status(500).json({ message: 'Error creating user' });

      const userId = this.lastID;
      db.run(`INSERT INTO preferences (
        user_id, study_sessions, study_length, break_length, long_break_length,
        enable_long_breaks, auto_start_breaks, auto_start_pomodoros,
        dark_mode, notifications, sound_enabled, sound_volume
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, 4, 25, 5, 15, 1, 0, 0, 0, 1, 1, 75]);

      const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 604800000 });
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 604800000 });
    res.json({ message: 'Login successful' });
  });
});

app.get('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth-check', authenticateToken, (req, res) => {
  res.json({ authenticated: true, user: { username: req.user.username } });
});

app.get('/api/preferences', authenticateToken, (req, res) => {
  db.get('SELECT * FROM preferences WHERE user_id = ?', [req.user.id], (err, prefs) => {
    if (!prefs) return res.status(404).json({ message: 'Preferences not found' });

    const formatted = {
      studySessions: prefs.study_sessions,
      studyLength: prefs.study_length,
      breakLength: prefs.break_length,
      longBreakLength: prefs.long_break_length,
      enableLongBreaks: !!prefs.enable_long_breaks,
      autoStartBreaks: !!prefs.auto_start_breaks,
      autoStartPomodoros: !!prefs.auto_start_pomodoros,
      darkMode: !!prefs.dark_mode,
      notifications: !!prefs.notifications,
      soundEnabled: !!prefs.sound_enabled,
      soundVolume: prefs.sound_volume
    };
    res.json(formatted);
  });
});

app.put('/api/preferences', authenticateToken, (req, res) => {
  const {
    studySessions, studyLength, breakLength, longBreakLength,
    enableLongBreaks, autoStartBreaks, autoStartPomodoros,
    darkMode, notifications, soundEnabled, soundVolume
  } = req.body;

  db.run(`UPDATE preferences SET
    study_sessions = ?, study_length = ?, break_length = ?, long_break_length = ?,
    enable_long_breaks = ?, auto_start_breaks = ?, auto_start_pomodoros = ?,
    dark_mode = ?, notifications = ?, sound_enabled = ?, sound_volume = ?
    WHERE user_id = ?`,
    [
      studySessions, studyLength, breakLength, longBreakLength,
      enableLongBreaks ? 1 : 0, autoStartBreaks ? 1 : 0, autoStartPomodoros ? 1 : 0,
      darkMode ? 1 : 0, notifications ? 1 : 0, soundEnabled ? 1 : 0, soundVolume,
      req.user.id
    ],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error updating preferences' });
      res.json({ message: 'Preferences updated successfully' });
    });
});

// ----------- ✅ Todo Endpoints -----------

// Get all todos for authenticated user
app.get('/api/todos', authenticateToken, (req, res) => {
  db.all('SELECT * FROM todos WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error fetching todos' });
    res.json(rows);
  });
});

// Add a new todo
app.post('/api/todos', authenticateToken, (req, res) => {
  const { text } = req.body;
  const createdAt = new Date().toISOString();
  if (!text) return res.status(400).json({ message: 'Text is required' });

  db.run('INSERT INTO todos (user_id, text, completed, created_at) VALUES (?, ?, 0, ?)',
    [req.user.id, text, createdAt],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error adding todo' });

      res.status(201).json({
        id: this.lastID,
        user_id: req.user.id,
        text,
        completed: 0,
        createdAt
      });
    });
});

// Update a todo
app.put('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;

  db.run('UPDATE todos SET text = ?, completed = ? WHERE id = ? AND user_id = ?',
    [text, completed ? 1 : 0, id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error updating todo' });
      if (this.changes === 0) return res.status(404).json({ message: 'Todo not found' });
      res.json({ message: 'Todo updated' });
    });
});

// Delete a todo
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error deleting todo' });
      if (this.changes === 0) return res.status(404).json({ message: 'Todo not found' });
      res.json({ message: 'Todo deleted' });
    });
});

// ----------- Static + Utility Routes -----------

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.get('/alarm.mp3', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'alarm.mp3'));
});

app.get('/api/test-db', (req, res) => {
  db.get('SELECT 1 as test', (err, row) => {
    if (err) return res.status(500).json({ error: err.message, success: false });
    res.json({ success: true, data: row });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
