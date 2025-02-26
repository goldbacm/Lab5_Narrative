//creating new maps!   
var map2 = L.map('map2').setView([44.0, -120.5], 7); // Same Oregon coordinates as map1

//second map 
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com/en-us/legal/terms/data-attributions"> ESRI Satellite Imagery</a> contributors'
}).addTo(map2);

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
                        // return L.circleMarker(latlng, { color: 'red', radius: .5 });
                    }
                }).addTo(map2);

                // Prepare an array to store the count of hazard points per census tract
                var hazardCounts = {};
                var tractAreas = {}; // To store the area of each Census Tract

                // Iterate through each census tract and count hazard points within it
                censusData.features.forEach(function(censusFeature) {
                    var censusTract = censusFeature;
                    var censusTractId = censusTract.properties.GEOID;  // Adjust to the correct property for ID

                    // Calculate the area of each Census Tract
                    var tractArea = turf.area(censusTract); // Area in square meters
                    tractAreas[censusTractId] = tractArea;

                    // // Log the tract area and hazard points count for debugging
                    // console.log(`Tract ID: ${censusTractId}, Area: ${tractArea} sq meters`);

                    // Filter hazard points that fall inside the census tract
                    var pointsInCensusTract = turf.pointsWithinPolygon(hazardPoints, censusTract.geometry);

                    // // Log the number of points in each census tract
                    // console.log(`Points in Tract ID ${censusTractId}: ${pointsInCensusTract.features.length}`);

                    // Store the count of hazard points for this census tract
                    hazardCounts[censusTractId] = pointsInCensusTract.features.length;
                });

                // Function to normalize hazard count by the area of each census tract
                function getNormalizedHazardCount(tractId) {
                    var hazardCount = hazardCounts[tractId] || 0;
                    var area = tractAreas[tractId] || 1; // Avoid division by zero

                    // // Log the calculation of normalized hazard count for debugging
                    // console.log(`Normalized Hazard Count for Tract ID ${tractId}: (Count: ${hazardCount} / Area: ${area})`);

                    return (hazardCount / area) * 10000000; // Hazard count per square meter (multiplied by 10 million cause it aint showin)
                }

                // Function to determine color based on normalized hazard count
                function getColor(normalizedCount) {
                    if (normalizedCount > 0.5) {
                        return 'red';          // High normalized hazard density
                    } else if (normalizedCount >= 0.2) {
                        return 'orange';       // Medium normalized hazard density
                    } else if (normalizedCount >= 0.1) {
                        return 'yellow';       // Low normalized hazard density
                    } else {
                        return 'lightgreen';    // Very low normalized hazard density
                    }
                }

                // Function to style census tracts based on normalized hazard count
                function styleCensusTracts(feature) {
                    var tractId = feature.properties.GEOID; // Adjust if needed based on your data
                    var normalizedCount = getNormalizedHazardCount(tractId);

                    // Set color scale based on normalized hazard count
                    var color = getColor(normalizedCount);

                    return {
                        fillColor: color,
                        weight: 1,
                        opacity: 1,
                        color: 'black',
                        fillOpacity: 0.8
                    };
                }

                // Add the choropleth (census tracts with styled polygons based on normalized hazard count)
                L.geoJSON(censusData, {
                    style: styleCensusTracts,
                    onEachFeature: function (feature, layer) {
                        // Retrieve the normalized hazard count for the current census tract
                        var tractId = feature.properties.GEOID;  // Adjust if needed based on your data
                        var normalizedCount = getNormalizedHazardCount(tractId);  // Default to 0 if no hazard sites

                        // Bind a tooltip to the polygon to show normalized hazard count
                        layer.bindTooltip('Normalized Hazard Density: ' + normalizedCount.toFixed(5), {
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
                }).addTo(map2);

                // Create the legend
                var legend = L.control({ position: 'bottomright' });

                legend.onAdd = function () {
                    var div = L.DomUtil.create('div', 'info legend');
                    div.style.backgroundColor = 'white'; // White background

                    // Title of the legend
                    div.innerHTML += '<strong>Normalized Hazard Density</strong><br>';

                    // Define the ranges for the normalized hazard density
                    var grades = [0, 0.01, 0.02, 0.05];  // Hazard density thresholds (normalized)
                    var labels = ['lightgreen', 'yellow', 'orange', 'red']; // Colors corresponding to the ranges
                    var ranges = ['0', '0.01-0.02', '0.02-0.05', '0.05+']; // Corresponding ranges for each color

                    // Loop through each grade and create a label with color swatch for the legend
                    for (var i = 0; i < grades.length; i++) {
                        // Handle the last range separately to show `0.05+` for values above 0.05
                        div.innerHTML +=
                            '<i style="background:' + labels[i] + '; width: 20px; height: 20px; display: inline-block;"></i> ' +
                            ranges[i] + '<br>';
                    }

                    return div;
                };

                // Add the legend to the map
                legend.addTo(map2);

            }) // End of the hazardData fetch .then
            .catch(error => console.error('Error loading hazard sites data:', error));

    }) // End of the censusData fetch .then
    .catch(error => console.error('Error loading census tracts data:', error));

//chatgpt did help a lot with nesting the datsets, also worked with classmates
