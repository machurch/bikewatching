   // Set your Mapbox access token here
   mapboxgl.accessToken = 'pk.eyJ1IjoibWFjaHVyY2giLCJhIjoiY203YXV2Y2NxMDdyajJrcTA5OHpodHB2NCJ9.CU6b50t7UCMIVgDi6qds4w';

   // Initialize the map
   const map = new mapboxgl.Map({
     container: 'map', // ID of the div where the map will render
     style: 'mapbox://styles/machurch/cm7aw0zc2002j01soh2pu4r9u', // Map style
     center: [-71.09415, 42.36027], // [longitude, latitude]
     zoom: 12, // Initial zoom level
     minZoom: 5, // Minimum allowed zoom
     maxZoom: 18 // Maximum allowed zoom
   });

   map.on('load', () => { 
        // Add Boston bike lanes
        map.addSource('boston_route', {
            type: 'geojson',
            data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
        });

        map.addLayer({
            id: 'bike-lanes',
            type: 'line',
            source: 'boston_route',
            paint: {
                'line-color': '#FF8595',
                'line-width': 3,
                'line-opacity': 0.4
            }
        });

        // Add Cambridge bike lanes
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

        const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

        d3.json(jsonurl).then(jsonData => {
            // console.log('Loaded JSON Data:', jsonData); // Check structure
            let stations = jsonData.data.stations; // Assign stations array
            // console.log('Stations Array:', stations);

            d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv')
                .then(trips => {
                    // console.log('Loaded Trips Data:', trips);

                    let departures = d3.rollup(
                        trips,
                        (v) => v.length,
                        (d) => d.start_station_id
                    );

                    let arrivals = d3.rollup(
                        trips,
                        (v) => v.length,
                        (d) => d.end_station_id
                    );

                    stations = stations.map((station) => {
                        let id = station.short_name;
                        station.arrivals = arrivals?.get(id) ?? 0;
                        station.departures = departures?.get(id) ?? 0;
                        station.totalTraffic = station.arrivals + station.departures;
                        return station;
                    });

                    // console.log('Here are stations:', stations);

                    const radiusScale = d3
                        .scaleSqrt()
                        .domain([0, d3.max(stations, (d) => d.totalTraffic)])
                        .range([0, 25]);
                    
                    // Select the SVG inside the map container
                    const svg = d3.select('#map').select('svg');

                    function getCoords(station) {
                        const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
                        const { x, y } = map.project(point);  // Project to pixel coordinates
                        return { cx: x, cy: y };  // Return as object for use in SVG attributes
                    }
                    console.log('stations: ', stations);

                    // Append circles to the SVG for each station
                    const circles = svg.selectAll('circle')
                        .data(stations)
                        .enter()
                        .append('circle')
                        .attr('r', d => radiusScale(d.totalTraffic))  // Radius of the circle
                        .attr('fill', '#2E5077')  // Circle fill color
                        .attr('stroke', 'white')  // Circle border color
                        .attr('stroke-width', 1)  // Circle border thickness
                        .attr('opacity', 0.4)  // Circle opacity
                        .each(function(d) {
                            // Add <title> for browser tooltips
                            d3.select(this)
                            .append('title')
                            .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                        });

                    // Function to update circle positions when the map moves/zooms
                    function updatePositions() {
                        circles
                            .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
                            .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
                    }

                    // Initial position update when map loads
                    updatePositions();

                    // Reposition markers on map interactions
                    map.on('move', updatePositions);
                    map.on('zoom', updatePositions);
                    map.on('resize', updatePositions);
                    map.on('moveend', updatePositions);

                    })
                .catch(error => {
                    console.error('Error loading CSV:', error);
                });

    }).catch(error => {
        console.error('Error loading JSON:', error);
    });
});




