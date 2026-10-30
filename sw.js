const CACHE = 'first-words-v33';
const CARD_RANKS = ['6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
const CARD_SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const CARD_FILES = CARD_SUITS.flatMap(suit => CARD_RANKS.map(rank => `./assets/cards/${rank}%20of%20${suit}.svg`));
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './uno.css', './game.js?v=27', './durak.js?v=27', './assets/cards/back.svg', ...CARD_FILES];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => Promise.all(
      APP_FILES.map(url => fetch(new Request(url, { cache: 'reload' })).then(response => {
        if (!response.ok) throw new Error(`Unable to cache ${url}`);
        return cache.put(url, response);
      }))
    ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => caches.open(CACHE).then(cache => {
          cache.put('./index.html', response.clone());
          return response;
        }))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      });
    })
  );
});
