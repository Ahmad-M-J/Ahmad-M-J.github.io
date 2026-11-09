// Keeps the game on the phone so it plays with no connection. Made by tools/make_pwa.js.
const CACHE = 'dig-6f450bfc65';
const SHELL = ["./","index.html","index.js","index.audio.worklet.js","index.audio.position.worklet.js","manifest.json","icon-180.png","icon-192.png","icon-512.png"];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(caches.keys()
		.then((keys) => Promise.all(keys.filter((k) => k.startsWith('dig-') && k !== CACHE).map((k) => caches.delete(k))))
		.then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
		return;
	}
	// The page itself: the newest copy when online, the kept one when not. A link that has gone away
	// still answers, with an error page, so only a good answer replaces the kept copy.
	if (request.mode === 'navigate') {
		event.respondWith(fetch(request).then((response) => {
			if (!response.ok) {
				throw new Error('page unavailable');
			}
			const copy = response.clone();
			caches.open(CACHE).then((cache) => cache.put('index.html', copy));
			return response;
		}).catch(() => caches.match('index.html')));
		return;
	}
	// Everything else never changes within a version: keep it and serve it from the phone.
	event.respondWith(caches.open(CACHE).then((cache) => cache.match(request, { ignoreSearch: true }).then((hit) => {
		if (hit) {
			return hit;
		}
		return fetch(request).then((response) => {
			if (response.ok) {
				cache.put(request, response.clone());
			}
			return response;
		});
	})));
});
