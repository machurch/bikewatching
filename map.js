// map.on('load', () => { 
//     console.log('heyyy');
//   });
// console.log("heyyyy");
// // Set your Mapbox access token here
// mapboxgl.accessToken = 'pk.eyJ1IjoibWFjaHVyY2giLCJhIjoiY203YXV2Y2NxMDdyajJrcTA5OHpodHB2NCJ9.CU6b50t7UCMIVgDi6qds4w';

// // Initialize the map
// const map = new mapboxgl.Map({
//     container: 'map', // ID of the div where the map will render
//     style: 'mapbox://styles/mapbox/streets-v12', // Map style
//     center: [-71.09415, 42.36027], // [longitude, latitude]
//     zoom: 12, // Initial zoom level
//     minZoom: 5, // Minimum allowed zoom
//     maxZoom: 18 // Maximum allowed zoom
//    });

// document.addEventListener("DOMContentLoaded", () => {
//     // console.log("DOM fully loaded");
  
//     let checkMap = setInterval(() => {
//       const mapDiv = document.getElementById("map");
//       if (mapDiv) {
//         // console.log("Map container found, initializing map...");
//         clearInterval(checkMap);
  
//         mapboxgl.accessToken = 'pk.eyJ1IjoibWFjaHVyY2giLCJhIjoiY203YXV2Y2NxMDdyajJrcTA5OHpodHB2NCJ9.CU6b50t7UCMIVgDi6qds4w';
  
//         const map = new mapboxgl.Map({
//           container: 'map', // Ensure this matches the div ID
//           style: 'mapbox://styles/machurch/cm7aw0zc2002j01soh2pu4r9u',
//           center: [-71.09415, 42.36027],
//           zoom: 12,
//           minZoom: 5,
//           maxZoom: 18
//         });
  
//         // console.log("Map initialized!");
//       } else {
//         // console.warn("Waiting for #map container...");
//       }
//     }, 500); // Checks every 500ms until the div is found
//   });

document.addEventListener("DOMContentLoaded", () => {

    let checkMap = setInterval(() => {
        const mapDiv = document.getElementById("map");
        if (mapDiv) {
            clearInterval(checkMap);

            mapboxgl.accessToken = 'pk.eyJ1IjoibWFjaHVyY2giLCJhIjoiY203YXV2Y2NxMDdyajJrcTA5OHpodHB2NCJ9.CU6b50t7UCMIVgDi6qds4w';

            // Declare `map` globally so it's accessible outside this function
            window.map = new mapboxgl.Map({
                container: 'map', // Ensure this matches the div ID
                style: 'mapbox://styles/machurch/cm7aw0zc2002j01soh2pu4r9u',
                center: [-71.09415, 42.36027],
                zoom: 12,
                minZoom: 5,
                maxZoom: 18
            });

            // Now that `map` exists, attach the `on load` event
            map.on('load', () => { 

                map.addSource('boston_route', {
                    type: 'geojson',
                    data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
                });

                map.addLayer({
                    id: 'bike-lanes-bos',
                    type: 'line',
                    source: 'boston_route',
                    paint: {
                        'line-color': '#FF8595',
                        'line-width': 3, // Adjusted for better visibility
                        'line-opacity': 0.5
                    }
                });

                map.addSource('cambridge_route', {
                    type: 'geojson',
                    data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
                });

                map.addLayer({
                    id: 'bike-lanes-cambridge',
                    type: 'line',
                    source: 'cambridge_route',
                    paint: {
                        'line-color': '#FF8595',
                        'line-width': 3, // Adjusted for better visibility
                        'line-opacity': 0.5
                    }
                });

                // Load the nested JSON file
                const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json'
                d3.json(jsonurl).then(jsonData => {
                  console.log('Loaded JSON Data:', jsonData);  // Log to verify structure
                  const stations = jsonData.data.stations;
                  console.log('Stations Array:', stations);
                }).catch(error => {
                  console.error('Error loading JSON:', error);  // Handle errors if JSON loading fails
                });

                // Add circles to map
                const svg = d3.select('#map').select('svg');
                let stations = [];

                function getCoords(station) {
                    const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
                    const { x, y } = map.project(point);  // Project to pixel coordinates
                    return { cx: x, cy: y };  // Return as object for use in SVG attributes
                }
                console.log(stations);

                // Append circles to the SVG for each station
                const circles = svg.selectAll('circle')
                .data(stations)
                .enter()
                .append('circle')
                .attr('r', 5)               // Radius of the circle
                .attr('fill', 'steelblue')  // Circle fill color
                .attr('stroke', 'white')    // Circle border color
                .attr('stroke-width', 1)    // Circle border thickness
                .attr('opacity', 0.8);      // Circle opacity

                // Function to update circle positions when the map moves/zooms
                function updatePositions() {
                circles
                    .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
                    .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
                    }

                // Initial position update when map loads
                updatePositions();

                // Reposition markers on map interactions
                map.on('move', updatePositions);     // Update during map movement
                map.on('zoom', updatePositions);     // Update during zooming
                map.on('resize', updatePositions);   // Update on window resize
                map.on('moveend', updatePositions);  // Final adjustment after movement ends

            });

        } else {
            console.warn("Waiting for #map container...");
        }
    }, 500); // Checks every 500ms until the div is found
});

// const svg = d3.select('#map').select('svg');
// let stations = [];

// function getCoords(station) {
//     const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
//     const { x, y } = map.project(point);  // Project to pixel coordinates
//     return { cx: x, cy: y };  // Return as object for use in SVG attributes
//   }

// // Append circles to the SVG for each station
// const circles = svg.selectAll('circle')
//   .data(stations)
//   .enter()
//   .append('circle')
//   .attr('r', 5)               // Radius of the circle
//   .attr('fill', 'steelblue')  // Circle fill color
//   .attr('stroke', 'white')    // Circle border color
//   .attr('stroke-width', 1)    // Circle border thickness
//   .attr('opacity', 0.8);      // Circle opacity

// // Function to update circle positions when the map moves/zooms
// function updatePositions() {
//   circles
//     .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
//     .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
//   }

// // Initial position update when map loads
// updatePositions();

// // Reposition markers on map interactions
// map.on('move', updatePositions);     // Update during map movement
// map.on('zoom', updatePositions);     // Update during zooming
// map.on('resize', updatePositions);   // Update on window resize
// map.on('moveend', updatePositions);  // Final adjustment after movement ends



