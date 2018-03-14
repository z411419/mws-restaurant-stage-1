(function() {
    'use strict';

var filesToCache = [
    '.',
    'index.html',
    'restaurant.html',
    'css/styles.css',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'images/1.jpg',
    'images/2.jpg',
    'images/3.jpg',
    'images/4.jpg',
    'images/5.jpg',
    'images/6.jpg',
    'images/7.jpg',
    'images/8.jpg',
    'images/9.jpg',
    'images/10.jpg'
];

var staticCacheName = 'restaurant-cache';

self.addEventListener('install', function(event) {
    console.log('Attempting to install service worker and cache static assets');
    event.waitUntil(
        caches.open(staticCacheName)
            .then(function(cache) {
                return cache.addAll(filesToCache);
            })
    );
});

    self.addEventListener('fetch', function(event) {
        // console.log('Fetch event for ', event.request.url);
        event.respondWith(

            caches.match(event.request).then(function(response) {
                if (response) {
                    // console.log('Found ', event.request.url, ' in cache');
                    return response;
                }
                if (/\.jpg$|.png$/.test(event.request.url)) {

                    let req = event.request.clone();
                    if(!req.url.indexOf("-large") === -1){
                        console.log("Small image loaded");
                        let returnUrl = req.url.substr(0,req.url.indexOf("-large")) + "-small_small.jpg";
                        return caches.match(returnUrl);
                    }
                }
                // console.log('Network request for ', event.request.url);
                return fetch(event.request).then(function(response) {
                    if (response.status === 404) {
                        return caches.match('pages/404.html');
                    }
                    return caches.open(staticCacheName).then(function(cache) {
                        if (event.request.url.indexOf('test') < 0) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    });
                });
            }).catch(function(error) {
                // console.log('Error, ', error);



                return caches.match('pages/offline.html');
            })
        );
    });

    self.addEventListener('activate', function(event) {
        console.log('Activating new service worker...');

        var cacheWhitelist = [staticCacheName];

        event.waitUntil(
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if (cacheWhitelist.indexOf(cacheName) === -1) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        );
    });


})();