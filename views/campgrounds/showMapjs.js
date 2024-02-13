
mapboxgl.accessToken = 'pk.eyJ1IjoicmlzaGktc2l2YXJhanUiLCJhIjoiY2xrZ3o0MG5jMDRqdzNvcnp4ZnBvZHQ4bCJ9.fjkl7FXHgXdueyxgY2tnUA';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // style URL
    center: campground, // starting position [lng, lat]
    zoom: 5, // starting zoom
});

 map.addControl(new mapboxgl.NavigationControl());
new mapboxgl.Marker()
    .setLngLat(campground)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
            .setHTML(
                `<h3>${campgrounds.title}</h3><p>${campgrounds.location}</p>`
            )
    )
    .addTo(map)