/**
 * CambridgeTest — front-only avec mini BDD intégrée.
 *
 * BDD : SQLite embarqué via sql.js (WebAssembly), persistant dans localStorage.
 * Aucun back-end, aucune requête réseau (hormis le chargement des librairies sql.js depuis le CDN).
 */

const DB_KEY = 'cambridge_test_db';

let db = null;

/* ------------------------------------------------------------------ */
/*  Initialisation de sql.js                                          */
/* ------------------------------------------------------------------ */
async function initDb() {
  const SQL = window.initSqlJs;
  if (!SQL) {
    throw new Error('sql.js n\'a pas pu être chargé.');
  }

  const dbPromise = SQL({
    locateFile: (file) => `https://unpkg.com/sql.js/dist/${file}`
  });

  const existing = localStorage.getItem(DB_KEY);

  if (existing) {
    try {
      const bytes = base64ToUint8Array(existing);
      db = new dbPromise.Database(bytes);
      console.log('[BDD] Base restaurée depuis localStorage.');
    } catch (e) {
      console.warn('[BDD] Impossible de restaurer la base, création d\'une base vide.', e);
      db = new dbPromise.Database();
      createSchema();
    }
  } else {
    db = new dbPromise.Database();
    createSchema();
  }

  saveDb();
  render();
}

/* ------------------------------------------------------------------ */
/*  Schéma                                                            */
/* ------------------------------------------------------------------ */
function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

/* ------------------------------------------------------------------ */
/*  Persistance (localStorage)                                        */
/* ------------------------------------------------------------------ */
function saveDb() {
  if (!db) return;
  const data = db.export(); // Uint8Array
  const b64 = uint8ArrayToBase64(data);
  localStorage.setItem(DB_KEY, b64);
}

function clearDbStorage() {
  localStorage.removeItem(DB_KEY);
}

/* ------------------------------------------------------------------ */
/*  CRUD tâches                                                       */
/* ------------------------------------------------------------------ */
function addTask(title) {
  const now = new Date().toISOString();
  db.run('INSERT INTO tasks (title, done, created_at) VALUES (?, 0, ?)', [title, now]);
  saveDb();
  render();
}

function listTasks() {
  const rows = db.prepare('SELECT id, title, done, created_at FROM tasks ORDER BY created_at DESC').getRows();
  return rows.map((r) => ({ id: r.id, title: r.title, done: !!r.done, created_at: r.created_at }));
}

function setTaskDone(id, done) {
  db.run('UPDATE tasks SET done = ? WHERE id = ?', [done ? 1 : 0, id]);
  saveDb();
  render();
}

function deleteTask(id) {
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
  saveDb();
  render();
}

function resetAll() {
  if (!confirm('Supprimer toutes les tâches et réinitialiser la base ?')) return;
  clearDbStorage();
  location.reload();
}

/* ------------------------------------------------------------------ */
/*  Import / Export du fichier .db                                    */
/* ------------------------------------------------------------------ */
function exportDb() {
  if (!db) return;
  const data = db.export();
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cambridge_test.db';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importDb(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const array = new Uint8Array(e.target.result);
      const SQL = window.initSqlJs;
      SQL({
        locateFile: (f) => `https://unpkg.com/sql.js/dist/${f}`
      }).then((SQL) => {
        db = new SQL.Database(array);
        saveDb();
        render();
      });
    } catch (err) {
      alert('Fichier de base invalide.');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

/* ------------------------------------------------------------------ */
/*  Render                                                            */
/* ------------------------------------------------------------------ */
function render() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-msg');
  const badge = document.getElementById('count-badge');

  const tasks = listTasks();
  badge.textContent = tasks.length;
  list.innerHTML = '';

  if (tasks.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  for (const t of tasks) {
    const li = document.createElement('li');
    li.className = 'task' + (t.done ? ' done' : '');
    li.innerHTML = `
      <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;margin:0;flex:1;">
        <input type="checkbox" ${t.done ? 'checked' : ''} />
        <span class="task-title">${escapeHtml(t.title)}</span>
      </label>
      <div class="task-actions">
        <button class="danger" title="Supprimer">×</button>
      </div>
    `;

    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => setTaskDone(t.id, checkbox.checked));

    const delBtn = li.querySelector('.task-actions button');
    delBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteTask(t.id);
    });

    list.appendChild(li);
  }
}

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                       */
/* ------------------------------------------------------------------ */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/* ------------------------------------------------------------------ */
/*  Écouteurs d'événements                                            */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', async () => {
  await initDb();

  const form = document.getElementById('task-form');
  const input = document.getElementById('task-title');

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    addTask(title);
    input.value = '';
    input.focus();
  });

  document.getElementById('btn-export').addEventListener('click', exportDb);

  const fileInput = document.getElementById('file-import');
  document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (ev) => {
    if (ev.target.files.length) importDb(ev.target.files[0]);
    ev.target.value = '';
  });

  document.getElementById('btn-reset').addEventListener('click', resetAll);
});
