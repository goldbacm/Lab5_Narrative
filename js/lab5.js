    //per area of county or population 
    //join by attribute or field to join pop data or area of couty 

//creating new maps!   
var map = L.map('map1').setView([44.0, -120.5], 7); // Oregon coordinates
// var map2 = L.map('map2').setView([44.0, -120.5], 7); // Same Oregon coordinates as map1

// //adding openstreet map tiles
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com/en-us/legal/terms/data-attributions"> ESRI Satellite Imagery</a> contributors'
}).addTo(map);

// //second map 
// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// }).addTo(map2);


// Load Census Tracts
fetch('data/CensusTracts.geojson')
    .then(response => response.json())
    .then(censusData => {
        
        // Load Hazard Sites after Census Tracts are loaded
        fetch('data/hazard_sites.geojson')
            .then(response => response.json())
            .then(hazardData => {

                // Store the hazard points as a GeoJSON FeatureCollection
                var hazardPoints = {
                    type: 'FeatureCollection',
                    features: hazardData.features
                };

                // Add hazard points to the map (optional for visual reference)
                L.geoJSON(hazardPoints, {
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, { color: 'white', radius: .5 });
                    }
                }).addTo(map);

                // Prepare an array to store the count of hazard points per census tract
                var hazardCounts = {};

                // Iterate through each census tract and count hazard points within it
                censusData.features.forEach(function(censusFeature) {
                    var censusTract = censusFeature;
                    var censusTractId = censusTract.properties.GEOID;  // Adjust to the correct property for ID

                    // Filter hazard points that fall inside the census tract
                    var pointsInCensusTract = turf.pointsWithinPolygon(hazardPoints, censusTract.geometry);

                    // Store the count of hazard points for this census tract
                    hazardCounts[censusTractId] = pointsInCensusTract.features.length;
                });

                // Function to determine color based on hazard count
                function getColor(count) {
                    if (count > 50) {
                        return 'red';          // Hazard count greater than 50
                    } else if (count >= 30) {
                        return 'orange';       // Hazard count between 31 and 50
                    } else if (count >= 10) {
                        return 'yellow';       // Hazard count between 11 and 30
                    } else if (count >= 1) {
                        return 'lightgreen';    // Hazard count between 2 and 10
                    } else {
                        return 'transparent';  // Hazard count 0, transparent
                    }
                }
                
                // Function to style census tracts based on hazard point count
                function styleCensusTracts(feature) {
                    var tractId = feature.properties.GEOID; // Adjust if needed based on your data
                    var hazardCount = hazardCounts[tractId] || 0;

                    // Set color scale based on hazard point count
                    var color = getColor(hazardCount);

                    return {
                        fillColor: color,
                        weight: 1,
                        opacity: 1,
                        color: 'black',
                        fillOpacity: 0.7
                    };
                }

                // Add the choropleth (census tracts with styled polygons based on hazard count)
                L.geoJSON(censusData, {
                    style: styleCensusTracts,
                    onEachFeature: function (feature, layer) {
                        // Retrieve the hazard count for the current census tract
                        var tractId = feature.properties.GEOID;  // Adjust if needed based on your data
                        var hazardCount = hazardCounts[tractId] || 0;  // Default to 0 if no hazard sites

                        // Bind a tooltip to the polygon to show hazard count
                        layer.bindTooltip('Hazard Sites: ' + hazardCount, {
                            permanent: false,  // Tooltip will be shown on hover
                            direction: 'center',  // Position the tooltip centered on the polygon
                            className: 'hazard-tooltip'  // Optional: Add a custom class for styling
                        });

                        // Optional: Add a mouseover event to change the polygon style on hover
                        layer.on({
                            mouseover: function (e) {
                                var layer = e.target;
                                layer.setStyle({
                                    weight: 2,
                                    color: 'black',
                                    fillOpacity: 0.9
                                });
                            },
                            mouseout: function (e) {
                                var layer = e.target;
                                layer.setStyle(styleCensusTracts(e.target.feature));  // Reset the style to the original
                            }
                        });
                    }
                }).addTo(map);

                // Create the legend
                var legend = L.control({ position: 'bottomright' });

                legend.onAdd = function () {
                    var div = L.DomUtil.create('div', 'info legend');
                    div.style.backgroundColor = 'white'; // White background

                    // Title of the legend
                    div.innerHTML += '<strong>Hazard Count</strong><br>';

                    // Define the ranges for the hazard count
                    var grades = [0, 1, 10, 30, 50];  // Hazard count thresholds
                    var labels = ['transparent', 'lightgreen', 'yellow', 'orange', 'red']; // Colors corresponding to the ranges
                    var ranges = ['0', '1-9', '10-29', '30-49', '50+']; // Corresponding ranges for each color

                    // Loop through each grade and create a label with color swatch for the legend
                    for (var i = 0; i < grades.length; i++) {
                        // Handle the last range separately to show `50+` for values above 50
                        div.innerHTML +=
                            '<i style="background:' + labels[i] + '; width: 20px; height: 20px; display: inline-block;"></i> ' +
                            ranges[i] + '<br>';
                    }

                    return div;
                };

                // Add the legend to the map
                legend.addTo(map);

            }) // End of the hazardData fetch .then
            .catch(error => console.error('Error loading hazard sites data:', error));

    }) // End of the censusData fetch .then
    .catch(error => console.error('Error loading census tracts data:', error)); 

//chatgpt did help a lot with nesting the datsets, also worked with classmates



    
