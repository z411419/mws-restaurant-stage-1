import DBHelper from './dbhelper';
import LazyLoad from './lazyload.min';

    var markers = [];
    let neighborhoods;
    let cuisines;
    let restaurants;

    /**
     * Fetch neighborhoods and cuisines as soon as the page is loaded.
     */

    document.addEventListener('DOMContentLoaded', () => {
        fetchNeighborhoods();
        fetchCuisines();
    });

    const /**
     * Fetch all neighborhoods and set their HTML.
     */
    fetchNeighborhoods = () => {
        DBHelper.fetchNeighborhoods((error, neighborhoods) => {
            if (error) { // Got an error
                console.error(error);
            } else {
                self.neighborhoods = neighborhoods;
                fillNeighborhoodsHTML();
            }
        });
    };

    const /**
     * Set neighborhoods HTML.
     */
    fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
        const select = document.getElementById('neighborhoods-select');
        neighborhoods.forEach(neighborhood => {
            const option = document.createElement('option');
            option.innerHTML = neighborhood;
            option.value = neighborhood;
            select.append(option);
        });
    };

    const /**
     * Fetch all cuisines and set their HTML.
     */
    fetchCuisines = () => {
        DBHelper.fetchCuisines((error, cuisines) => {
            if (error) { // Got an error!
                console.error(error);
            } else {
                self.cuisines = cuisines;
                fillCuisinesHTML();
            }
        });
    };

    const /**
     * Set cuisines HTML.
     */
    fillCuisinesHTML = (cuisines = self.cuisines) => {
        const select = document.getElementById('cuisines-select');

        cuisines.forEach(cuisine => {
            const option = document.createElement('option');
            option.innerHTML = cuisine;
            option.value = cuisine;
            select.append(option);
        });
    };

    /**
     * Initialize Google map, called from HTML.
     */
    window.initMap = () => {
        let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if(connection){
            console.log("This is the speed:" + connection.effectiveType);
            if(connection.effectiveType !== '3g'){
                let loc = {
                    lat: 40.722216,
                    lng: -73.987501
                };
                self.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 12,
                    center: loc,
                    scrollwheel: false
                });
                self.map.addListener('tilesloaded', setMapTitle);
                updateRestaurants();
            }
        }


    };

    const setMapTitle = () => {
        const mapFrame = document.querySelector('#map').querySelector('iframe');
        mapFrame.setAttribute('title', 'Google maps with restaurant location');
    };

    const /**
     * Update page and map for current restaurants.* @return {void}
     */
    updateRestaurants = () => {
        const cSelect = document.getElementById('cuisines-select');
        const nSelect = document.getElementById('neighborhoods-select');

        const cIndex = cSelect.selectedIndex;
        const nIndex = nSelect.selectedIndex;

        const cuisine = cSelect[cIndex].value;
        const neighborhood = nSelect[nIndex].value;

        DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
            if (error) { // Got an error!
                console.error(error);
            } else {
                resetRestaurants(restaurants);
                fillRestaurantsHTML();
            }
        })
    };

    /**
     * Clear current restaurants, their HTML and remove their map markers.
     */
    const resetRestaurants = (restaurants) => {
        // Remove all restaurants
        self.restaurants = [];
        const ul = document.getElementById('restaurants-list');
        ul.innerHTML = '';

        // Remove all map markers
        self.markers = self.markers ? self.markers : [];
        self.markers.forEach(m => m.setMap(null));

        self.restaurants = restaurants;
    };

    let /**
     * Create all restaurants HTML and add them to the webpage.
     */
    fillRestaurantsHTML = (restaurants = self.restaurants) => {
        const ul = document.getElementById('restaurants-list');
        restaurants.forEach(restaurant => {
            ul.append(createRestaurantHTML(restaurant));
        });
        addMarkersToMap();
    };

    let /**
     * Create restaurant HTML.
     */
    createRestaurantHTML = (restaurant) => {
        const li = document.createElement('li');

        const picture = document.createElement('picture');

        const sourceSmall = document.createElement('source');
        sourceSmall.className = 'restaurant-img lazy';
        sourceSmall.setAttribute("data-srcset", DBHelper.imageUrlForRestaurant(restaurant) + "_small.webp");
        sourceSmall.setAttribute("media", "(min-width: 400px)")
        picture.append(sourceSmall);

        const sourceLarge = document.createElement('source');
        sourceLarge.className = 'restaurant-img lazy';
        sourceLarge.setAttribute("data-srcset", DBHelper.imageUrlForRestaurant(restaurant) + "_large.webp");
        sourceLarge.setAttribute("media", "(min-width: 900px)")
        picture.append(sourceLarge);

        const image = document.createElement('img');
        image.className = 'restaurant-img lazy';
        image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant) + "_small.jpg");
        image.alt = "An image of restaurant " + restaurant.name + " in " + restaurant.neighborhood;
        picture.append(image);

        li.append(picture);

        const name = document.createElement('h2');
        name.innerHTML = restaurant.name;
        li.append(name);

        const neighborhood = document.createElement('p');
        neighborhood.innerHTML = restaurant.neighborhood;
        li.append(neighborhood);

        const address = document.createElement('p');
        address.innerHTML = restaurant.address;
        li.append(address);

        const more = document.createElement('a');
        more.innerHTML = 'View Details';
        more.href = DBHelper.urlForRestaurant(restaurant);
        li.append(more);

        const review = document.createElement('a');
        review.innerHTML = 'Add review';
        review.href = DBHelper.reviewRestaurant(restaurant);
        li.append(review)

        const favorite  = document.createElement('div');
        favorite.setAttribute('id', 'favorite');
        favorite.innerHTML =` 
            <p>Favorite</p>
        `;

        if(restaurant.is_favorite == 'true'){
            console.log('Initial load: '+ restaurant.id + ' = ' + restaurant.is_favorite);
            favorite.setAttribute('style', 'color: yellow; font-weight: bold');
        } else {
            favorite.removeAttribute('style');
        }

        favorite.addEventListener('click', () => {
            console.log("fetch: " + DBHelper.fetchFavorite(restaurant.id));
            if(restaurant.is_favorite == 'true'){
                console.log('Unfavorite');
                restaurant.is_favorite = 'false';
                DBHelper.unfavoriteRestaurant(restaurant.id);
                favorite.setAttribute('style', 'color: black');
            } else {
                restaurant.is_favorite = 'true';
                DBHelper.favoriteRestaurant(restaurant.id);
                favorite.setAttribute('style', 'color: yellow; font-weight: bold');
            }
        })

        li.append(favorite);

        li.onload = new LazyLoad;

        return li
    };

    let /**
     * Add markers for current restaurants to the map.
     */
    addMarkersToMap = (restaurants = self.restaurants) => {
        restaurants.forEach(restaurant => {
            // Add marker to the map
            const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
            google.maps.event.addListener(marker, 'click', () => {
                window.location.href = marker.url
            });
            // self.markers.push(marker);
        });
    };