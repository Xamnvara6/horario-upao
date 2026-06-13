# 🕷️ Horario UPAO

PWA con temática Spider-Man para gestionar el horario académico de Medicina Humana 2do ciclo — UPAO Sullana, ciclo 2026-10.

**En vivo:** https://xamnvara6.github.io/horario-upao/

---

## 📦 Archivos del repo

Este proyecto son **4 archivos** (debe subirse el conjunto completo):

| Archivo | Qué es |
|---------|--------|
| `index.html` | La app completa (HTML + CSS + JS) |
| `sw.js` | Service Worker: caché offline + notificaciones |
| `icon-192.png` | Icono PWA 192×192 |
| `icon-512.png` | Icono PWA 512×512 |

> ⚠️ **Importante:** si subes solo `index.html`, el Service Worker dará error 404 y se pierden las notificaciones en segundo plano y el modo offline. Sube siempre los 4 juntos.

---

## 🚀 Cómo desplegar (GitHub Pages)

1. Sube los 4 archivos a la raíz del repo `Xamnvara6/horario-upao`.
2. En GitHub: **Settings → Pages → Source: `main` branch / root**.
3. Espera ~1 min. La app queda en https://xamnvara6.github.io/horario-upao/

### Actualizar después de un cambio
- Si editas la app, sube de nuevo el archivo cambiado.
- Si tocas `sw.js`, **sube también la versión de caché** (la constante `CACHE` arriba del archivo, ej. `horario-v7` → `horario-v8`) para forzar a los navegadores a tomar la versión nueva.

---

## ✨ Funcionalidades

- **Horario visual por día** con bloques de color por tipo de actividad
- **Semana automática** — detecta la semana del ciclo y actualiza los temas de estudio
- **Lista de tareas** (FAB araña) — 102 tareas con horas reales, progreso guardado
- **Notas rápidas por día** — apuntes libres con autoguardado
- **Notificaciones** — aviso 10 min antes y a la hora exacta de cada tarea
- **Evaluaciones próximas** — countdown de las 31 evaluaciones del ciclo
- **Pomodoro** — temporizador 25/5/15 con estadísticas

### Limitaciones conocidas de las notificaciones
- **Android (PWA instalada):** funcionan en segundo plano ~1–2 h; luego el sistema duerme el Service Worker.
- **iOS:** las notificaciones web no funcionan (limitación de Safari/iOS para PWAs).
- **Con la app abierta:** siempre funcionan (hay un respaldo en el cliente).

---

## 🛠️ Stack

HTML + CSS + JavaScript vanilla · PWA · Service Worker · IndexedDB · localStorage · GitHub Pages. Sin frameworks ni dependencias externas.

## 💾 Dónde se guardan tus datos

Todo es local en tu dispositivo (no hay servidor):
- `localStorage`: tareas completadas, notas por día, ajustes, stats de pomodoro
- `IndexedDB` (en el Service Worker): estado de tareas para no notificar las ya hechas

> No hay sincronización entre dispositivos: lo que marcas en el celular no aparece en la laptop.
