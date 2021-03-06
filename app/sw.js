importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');

const bgSyncPlugin = new workbox.backgroundSync.Plugin('review-queue');
const networkWithBackgroundSync = new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
});

workbox.routing.registerRoute(
    'http://localhost:1337/reviews/',
    networkWithBackgroundSync,
    'POST'
);

workbox.skipWaiting();
workbox.clientsClaim();


workbox.routing.registerRoute(
    new RegExp('https://fonts.googleapis.com'),
    workbox.strategies.staleWhileRevalidate()
);
workbox.routing.registerRoute(
    new RegExp('https://maps.googleapis.com'),
    workbox.strategies.staleWhileRevalidate()
);
workbox.routing.registerRoute(
    new RegExp('https://maps.gstatic.com'),
    workbox.strategies.staleWhileRevalidate()
);
workbox.routing.registerRoute(
    new RegExp('http://localhost:3000/(.*)'),
    workbox.strategies.staleWhileRevalidate()
);

workbox.routing.registerRoute(
    /\.(?:js|css)$/,
    workbox.strategies.staleWhileRevalidate()
);

workbox.routing.registerRoute(/\.(?:png|gif|jpg|jpeg|webp)$/,
    workbox.strategies.staleWhileRevalidate({
        cacheExpiration: {
            maxEntries: 50
        }
    })
);

self.addEventListener('push', (event) => {
    const title = 'Get Started With Workbox';
    const options = {
        body: event.data.text()
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

workbox.precaching.precacheAndRoute([]);
