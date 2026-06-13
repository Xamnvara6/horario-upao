/* ════════════════════════════════════════════════════════════
   Horario UPAO · Service Worker v7  🕷️
   - Caché offline real (network-first para el HTML, cache-first resto)
   - Notificaciones programadas desde el SW (10 min antes + hora exacta)
   - Persistencia de tareas completadas en IndexedDB (sobrevive al sleep del SW)
   ════════════════════════════════════════════════════════════ */
'use strict';

const CACHE = 'horario-v7';
const CORE  = ['./', './index.html', './icon-192.png', './icon-512.png'];

// ── Install: precache del core ──────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).catch(() => c.add('./')))  // tolera iconos ausentes
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar cachés viejas ─────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first para navegación, cache-first resto ──
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});

/* ════════════ IndexedDB: estado de tareas completadas ════════════
   Persiste swDoneKeys para que el SW no notifique tareas ya hechas,
   incluso después de que el navegador lo descargue de memoria.        */
const IDB_NAME = 'horario-upao';
const IDB_STORE = 'done';

function idb() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(IDB_NAME, 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(IDB_STORE)) {
        open.result.createObjectStore(IDB_STORE);
      }
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror   = () => reject(open.error);
  });
}

async function idbSet(key, val) {
  try {
    const db = await idb();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch (_) {}
}

async function idbGet(key) {
  try {
    const db = await idb();
    return await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const r = tx.objectStore(IDB_STORE).get(key);
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  } catch (_) { return undefined; }
}

// ── Mensajes desde el cliente ───────────────────────────────
let swNotifTimers = [];

self.addEventListener('message', e => {
  const data = e.data;
  if (!data) return;

  if (data.type === 'SCHEDULE_NOTIFS') {
    swNotifTimers.forEach(t => clearTimeout(t));
    swNotifTimers = [];

    const tasks   = data.tasks || [];
    const nowMins = typeof data.nowMins === 'number' ? data.nowMins : 0;
    const DAY_MS  = 16 * 60 * 60 * 1000;

    tasks.forEach(task => {
      if (typeof task.mins !== 'number' || !task.label) return;

      const preDelay   = (task.mins - 10 - nowMins) * 60 * 1000;
      const exactDelay = (task.mins - nowMins) * 60 * 1000;

      if (preDelay > 0 && preDelay < DAY_MS) {
        swNotifTimers.push(setTimeout(
          () => swCheckAndNotify(task, '⏰ En 10 minutos', task.time + ' — ' + task.label),
          preDelay
        ));
      }
      if (exactDelay > 0 && exactDelay < DAY_MS) {
        swNotifTimers.push(setTimeout(
          () => swCheckAndNotify(task, '🕷️ ¡Ahora! ' + task.time, '¿Completaste: ' + task.label + '?'),
          exactDelay
        ));
      }
    });

    e.source && e.source.postMessage({ type: 'NOTIFS_SCHEDULED', count: swNotifTimers.length });
  }

  if (data.type === 'TASK_DONE') {
    idbSet(data.key, data.done ? 1 : 0);
  }

  if (data.type === 'CANCEL_NOTIFS') {
    swNotifTimers.forEach(t => clearTimeout(t));
    swNotifTimers = [];
  }
});

// ── Notificar solo si la tarea sigue pendiente ──────────────
async function swCheckAndNotify(task, title, body) {
  const key = 'tl_' + task.dia + '_' + task.idx;
  const done = await idbGet(key);
  if (done === 1) return;  // ya completada → no molestar

  self.registration.showNotification(title, {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'horario-' + task.dia + '-' + task.idx,
    renotify: true,
    data: { url: self.registration.scope }
  });
}

// ── Click en notificación → enfocar/abrir la app ────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const existing = cs.find(c => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
