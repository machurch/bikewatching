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

   map.on('load', async() => { 
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
                'line-color': '#1EFC1E',
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
                'line-color': '#1EFC1E',
                'line-width': 3, // Adjusted for better visibility
                'line-opacity': 0.5
            }
        });

        // Select the SVG inside the map container
        const svg = d3.select('#map').select('svg');

        // d3.json(jsonurl).then(jsonData => {
        let jsonData;
        try {
              const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
              
              // Await JSON fetch
              const jsonData = await d3.json(jsonurl);

              let departuresByMinute = Array.from({ length: 1440 }, () => []);
              let arrivalsByMinute = Array.from({ length: 1440 }, () => []);
      

              // let stations = jsonData.data.stations;
              const stations = computeStationTraffic(jsonData.data.stations);

              let trips = await d3.csv(
                'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv',
                (trip) => {
                  trip.started_at = new Date(trip.started_at);
                  trip.ended_at = new Date(trip.ended_at);
                  let startedMinutes = minutesSinceMidnight(trip.started_at); 
                  //This function returns how many minutes have passed since `00:00` (midnight).
                  departuresByMinute[startedMinutes].push(trip); 
                  //This adds the trip to the correct index in `departuresByMinute` so that later we can efficiently retrieve all trips that started at a specific time.
        
                  // TODO: Same for arrivals
                  let endedMinutes = minutesSinceMidnight(trip.ended_at);
                  arrivalsByMinute[endedMinutes].push(trip);
                  return trip;
                },
              );
             
              // const stations = computeStationTraffic(jsonData.data.stations);
      
              const radiusScale = d3
                  .scaleSqrt()
                  .domain([0, d3.max(stations, (d) => d.totalTraffic)])
                  .range([0, 25]);
                        
      
              function getCoords(station) {
                const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
                const { x, y } = map.project(point);  // Project to pixel coordinates
                return { cx: x, cy: y };  // Return as object for use in SVG attributes
              }
      
              // Append circles to the SVG for each station
              let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);
              console.log(stations);

              const circles = svg
                  .selectAll('circle')
                  .data(stations, (d) => d.short_name)  // Use station short_name as the key)
                  .enter()
                  .append('circle')
                  // .attr('r', d => radiusScale(d.totalTraffic))  // Radius of the circle
                  .attr('r', d => radiusScale(d.totalTraffic)) 
                  .attr('fill', '#2E5077')  // Circle fill color
                  .attr('stroke', 'white')  // Circle border color
                  .attr('stroke-width', 1)  // Circle border thickness
                  .attr('opacity', 0.4)  // Circle opacity
                  .style("--departure-ratio", d => stationFlow(d.departures / d.totalTraffic))
                  .each(function(d) {
                  // Add <title> for browser tooltips
                      console.log(d.departures);
                      d3.select(this)
                        .append('title')
                        .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                        console.log(d.totalTraffic);
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
      
              const timeSlider = document.getElementById('time-slider');
              const selectedTime = document.getElementById('selected-time');
              const anyTimeLabel = document.getElementById('any-time');
      
              function updateTimeDisplay() {
                let timeFilter = Number(timeSlider.value); // Get slider value
                        
                if (timeFilter === -1) {
                  selectedTime.textContent = ''; // Clear time display
                  anyTimeLabel.style.display = 'block'; // Show "(any time)"
                } else {
                  selectedTime.textContent = formatTime(timeFilter); // Display formatted time
                  anyTimeLabel.style.display = 'none'; // Hide "(any time)"
                }
                            
                // Call updateScatterPlot to reflect the changes on the map
                updateScatterPlot(timeFilter);
              }
      
      
              timeSlider.addEventListener('input', updateTimeDisplay);
              updateTimeDisplay();
      
          
              function updateScatterPlot(timeFilter) {
                  // // Get only the trips that match the selected time filter
                  const filteredStations = computeStationTraffic(stations, timeFilter);

                  // Recalculate the radius scale domain based on filtered traffic data
                  const maxTraffic = d3.max(filteredStations, (d) => d.totalTraffic) || 1;
                  radiusScale.domain([0, maxTraffic]);

                  // Update circles
                  circles
                    .data(filteredStations, (d) => d.short_name)
                    .join("circle")
                    .style('--departure-ratio', (d) =>
                      stationFlow(d.departures / d.totalTraffic),)
                    .attr("r", (d) => {
                        return radiusScale(d.totalTraffic);
                    });
                }
                      
                function computeStationTraffic(stations, timeFilter = -1) {
                  // Retrieve filtered trips efficiently

                  const departures = d3.rollup(
                    filterByMinute(departuresByMinute, timeFilter), // Efficient retrieval
                    (v) => v.length,
                    (d) => d.start_station_id
                  );
                      
                  const arrivals = d3.rollup(
                    filterByMinute(arrivalsByMinute, timeFilter), // Efficient retrieval
                    (v) => v.length,
                    (d) => d.end_station_id
                  );
                  // console.log('Filtered departures:', filterByMinute(departuresByMinute, timeFilter));
                  // console.log('Filtered arrivals:', filterByMinute(arrivalsByMinute, timeFilter));
                  // console.log('departures rollup:', departures);
                  // console.log('arrivals rollup:', arrivals);
                      
                  // Update station data with filtered counts
                  return stations.map((station) => {
                    let id = station.short_name;
                    station.arrivals = arrivals.get(id) ?? 0;
                    // what you updated in step 4.2
                    station.departures = departures?.get(id) ?? 0;
                    station.totalTraffic = station.arrivals + station.departures;
                    return station; //previously implemented no updates
                  });
                }
            
          } catch (error) {
              console.error('Error loading JSON:', error); // Handle errors
          }
    })

function formatTime(minutes) {
    const date = new Date(0, 0, 0, 0, minutes);  // Set hours & minutes
    return date.toLocaleString('en-US', { timeStyle: 'short' }); // Format as HH:MM AM/PM
  }

function minutesSinceMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function filterByMinute(tripsByMinute, minute) {
    if (minute === -1) {
      return tripsByMinute.flat(); // No filtering, return all trips
    }
  
    // Normalize both min and max minutes to the valid range [0, 1439]
    let minMinute = (minute - 60 + 1440) % 1440;
    let maxMinute = (minute + 60) % 1440;
  
    // Handle time filtering across midnight
    if (minMinute > maxMinute) {
      let beforeMidnight = tripsByMinute.slice(minMinute);
      let afterMidnight = tripsByMinute.slice(0, maxMinute);
      return beforeMidnight.concat(afterMidnight).flat();
    } else {
      return tripsByMinute.slice(minMinute, maxMinute).flat();
    }
  }



