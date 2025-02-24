    //per area of county or population 
    //join by attribute or field to join pop data or area of couty 

//creating two new maps!   
var map = L.map('map1').setView([44.0, -120.5], 7); // Oregon coordinates
var map2 = L.map('map2').setView([44.0, -120.5], 7); // Same Oregon coordinates as map1

//adding openstreet map tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// //dataset one is hazard sites in Oregon
// fetch('data/hazard_sites.geojson')
//     .then(response => response.json())
//     .then(data => {
//         // var vorp = turf.voronoi(data);
//         // var buff = turf.buffer(data, 10, {units: "miles"})
//         L.geoJSON(data).addTo(map);
//     })
//     .catch(error => console.error('Error: ', error));



// // Census tract polygons
// fetch('data/CensusTracts.geojson')
//     .then(response => response.json())
//     .then(data => {
//         // Add GeoJSON data to the map
//         L.geoJSON(data).addTo(map);
//     })
//     .catch(error => console.error('Error: ', error));

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
                        return L.circleMarker(latlng, { color: 'red', radius: .5 });
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
                    style: styleCensusTracts
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

    /////////////////////////////////////
//still need to add pop ups or hover feature! 
     //////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////////
// Create the legend control for the first map in the bottom right of screen/////

// // Function to determine color based on hazard count
// function getColor(count) {
//     return count > 50 ? 'red' :            // red for hazard count greater than 50
//            count > 30 ? 'orange' :         // orange for hazard count greater than 30
//            count > 10 ? 'yellow' :         // yellow for hazard count greater than 10
//            count >= 1  ? 'lightblue' :     // light blue for hazard count greater than 0
//            count === 0  ? 'lightgrey' :    // light grey for hazard count 0
//            'transparent';                  // default to transparent if no match
// }

// // Create the legend control
// var legend = L.control({ position: "bottomright" });

// // Add details to the legend
// legend.onAdd = function () {
//     var div = L.DomUtil.create("div", "info legend");

//     // Apply custom background and padding styles for the legend box
//     div.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
//     div.style.padding = "10px";
//     div.style.borderRadius = "5px";
//     div.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";

//     // Define hazard count ranges for the legend (adjust to fit your data's needs)
//     var grades = [0 ,1, 10, 30, 50];  // Adjust these values to match your color thresholds
//     var labels = ["<strong>Hazard Count</strong>", "<br>"];

//     // Loop through the hazard count ranges to create colored labels
//     for (var i = 0; i < grades.length; i++) {
//         var color = getColor(grades[i]);  // Get the color based on hazard count
//         var nextGrade = grades[i + 1] || Infinity;  // Handle the "infinity" case for the last range

//         // Add legend item for each hazard count range
//         labels.push(
//             '<i style="background:' + color + '; width: 18px; height: 18px; border-radius: 50%; display: inline-block;"></i> ' +
//             (nextGrade === Infinity ? ">" + grades[i] : "≤ " + nextGrade) + "<br>"
//         );
//     }

//     div.innerHTML = labels.join("");
//     return div;
// };

// // Add the legend to the map
// legend.addTo(map);



    // //here is data set two which are the county boundaries
// fetch('data/county_boundaries.geojson')
//     .then(response => response.json())
//     .then(data => {
//         // Filter counties where the "COBCODE" contains "OR"
//         var oregonCounties = L.geoJSON(data, {
//             filter: function(feature) {
//                 // Check if "COBCODE" contains "OR" (case-sensitive)
//                 return feature.properties.COBCODE && feature.properties.COBCODE.includes("OR");
//             }
//         }).addTo(map);
//     })
//     .catch(error => console.error('Error: ', error));

    // //disolve by county so all census tracts in one polygon 
    // fetch('data/CensusTracts.geojson')
    // .then(response => response.json())
    // .then(data => {
    //     // Filter census tracts that belong to Oregon (or another region) based on COBCODE or COUNTY
    //     var oregonCensusTracts = L.geoJSON(data, {
    //         filter: function(feature) {
    //             return feature.properties.COBCODE && feature.properties.COBCODE.includes("OR");  // Filter by Oregon (adjust as needed)
    //         }
    //     }).addTo(map);

    //     // Group features by COUNTY name
    //     var groupedByCounty = {};

    //     data.features.forEach(function(feature) {
    //         var county = feature.properties.COUNTY;  // Group by COUNTY (adjust property name if needed)

    //         if (!groupedByCounty[county]) {
    //             groupedByCounty[county] = [];
    //         }
    //         groupedByCounty[county].push(feature);
    //     });

    //     // For each county, dissolve (union) its census tracts if more than one feature exists
    //     Object.keys(groupedByCounty).forEach(function(county) {
    //         var countyTracts = groupedByCounty[county];

    //         // Only dissolve if there are at least two tracts
    //         if (countyTracts.length > 1) {
    //             // Start with the first feature (polygon)
    //             var dissolvedCounty = countyTracts.reduce(function(accumulator, feature) {
    //                 // Use turf.union to merge the polygons
    //                 if (accumulator) {
    //                     return turf.union(accumulator, feature.geometry);
    //                 } else {
    //                     return feature.geometry;
    //                 }
    //             }, null);

    //             // Add the dissolved county polygon to the map
    //             if (dissolvedCounty) {
    //                 L.geoJSON({
    //                     type: "Feature",
    //                     geometry: dissolvedCounty,
    //                     properties: {
    //                         COUNTY: county  // Include COUNTY as a property
    //                     }
    //                 }).addTo(map);
    //             }
    //         } else {
    //             // If only one tract, just add it directly
    //             L.geoJSON(countyTracts).addTo(map);
    //         }
    //     });
    // })
    // .catch(error => console.error('Error: ', error));



    
