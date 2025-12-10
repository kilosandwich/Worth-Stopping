
//Welcome to the mapView.js file created by Phillip Wandyez 12/9/2025
/*
This file contains various functions that create the raw functionality
behind:
1.) displaying file contents from a .geoJSON file (Coodrdinates, information)
2.) displaying relevant websearched images based on the .geoJSON file loaded
    a.) searching wikimedia for relevant images
    b.) converting the data structure returned from the wikimedia 
    search into pretty HTML for map and list views
*/

//To do: make a function that gets the information from an inputted geoJSON file and iterates
//through the features and populates the map???
//Or would it be that there's a default filter?


async function getPictures(searchTerm, numImages){
    /*this function will scrape the internet (wikimedia) for pictures
    and return an array of urls for the images where the pictures can be found
    this array of URLs will later be passed into a function that converts
    it into pretty HTML format to be used elsewhere. */
    /* Unanswered questions:
        1.) How do I pass a marker object so that the marker can be updated to indicate
        that images have failed to be found?
    */
    //convert the input variables into strings so they can be appended into a search
    try{
        searchTerm = encodeURIComponent(searchTerm);
        numImages = encodeURIComponent(numImages);

    }catch (err){
        console.log("Could not convert the given parameters into URI ")
    }
    try {
        console.log("I am trying to construct the url search")
        // Build Wikimedia API URL
        var url =
            'https://commons.wikimedia.org/w/api.php' +
            '?action=query' +
            '&format=json' +
            '&origin=*' +
            '&prop=imageinfo' +
            '&generator=search' +
            '&gsrsearch='+
            searchTerm + //this is where the name for what you are searching for goes
            '&gsrlimit=' +
            numImages + //this specifies how many files you want to load
            "&gsrnamespace=6"+ //this bit is absolutely critical, it says to search only among images
            '&iiprop=url';
        //I checked, the url constructed is accurate. 
        console.log("The url we constructed was: "+url)
        // Fetch from Wikimedia
        console.log("Awaiting response from wikimedia");
        var response = await fetch(url);
        var data = await response.json();
        console.log("Here is the data we got back from wikimedia:");
        //looks like this bit is working, we are successfully getting the data from wikimedia
        console.log(data);
        // Safety check: make sure we have results
        if (!data.query || !data.query.pages) {
            console.log("No results found, sorry boss we fucked something up");
            return;
        }

        //This is the section where the data has been returned, and we return an array of images
        console.log("We are now trying to construct HTML to dislay within the popup");
        //iterate through the images from the data.query.pages
        const urls = [];  // this will be the array we return
        if (data.query?.pages) {
            for (const id in data.query.pages) {
                const page = data.query.pages[id];
                const url = page.imageinfo?.[0]?.url;
                if (url) urls.push(url);
            }
        }
        //Checked it, this works. The array of URLs is successfully constructed
        console.log("Here is our constructed array of image urls:");
        console.log(urls)
        //congrats, we successfully got as many images as possible to request, now we put them
        //into an easy to use array for other functions to use.
        return urls;

    } catch (err) {
        // If anything goes wrong (network error, JSON error, etc),
        // show a friendly message.
        console.error('Error loading images from Wikimedia:', err);
    }
}

//To do: make a function that takes the array of urls and converts them into html to inject
//elsehwere within the website
//if you wish to adjust how the html is constructed for popup images, this is the place
async function buildPopupImages(searchTerm, numImages) {
    urls = [];
    urls = await getPictures(searchTerm, numImages);
    console.log("We ran getPictures using the search term "+ searchTerm+ " and the number of images " + numImages + " here is the url array returned:");
    console.log(urls)
    // Guard if empty array
    if (!Array.isArray(urls) || urls.length === 0) {
        return "<div>No images found.</div>";
    }

    // Build <img> tags
    const imagesHtml = urls.map(url => {
        // basic sanitization
        const safeUrl = String(url);
        return `<img src="${safeUrl}" style="max-width:100%; margin-bottom:8px;" />`;
    }).join("");

    return `
        <div style="display:flex; flex-direction:column; align-items:center;">
            ${imagesHtml}
        </div>
    `;
}
//Helper function to determine if the given features match the tag
//this code should have an AND or OR feature (this will be necessary in the filter editor later)
//This function compares a single tag to every property within a given feature.
function featureMatchesTag(props, tag) {
    //There are no properties, so therefore the given array of properties cannot match any of the array of tags
    if (!props) return false;

    // Case 1: tag is like "state:michigan"
    //first we need to split the tag into its components
    if (tag.includes(':')) {
        //split the tag into its key and value
        const [rawKey, rawValue] = tag.split(':');
        const key = rawKey.trim();
        const expected = toString(rawValue.trim()).toLowerCase();

        //check if the key is even within the properties. 
        const actual = props[key];
        //well, the key is not within the properties, which means that the given tag is not within the properties.
        if (actual == null) return false;


        return String(actual).toLowerCase() === expected;
    }

    // Case 2: tag is like "worthStopping"
    // This is the situation where instead of looking for something specific we are merely checking if the key even exists. 
    const val = props[tag];

    // If explicitly boolean, require true
    //good news, it explcitly exists, if the value is true return it. 
    if (typeof val === 'boolean') return val === true;

    // Otherwise just require it to be present and truthy
    //somehow it's a type boolean but not explicitly included
    return Boolean(val);
}



//make a function that populates a given map with markers for the given tags (array of tags)
function populateMapMarkers(map, geoJSONFile, tagArray = ["worth stopping"], numImages = 4, selectANDOR = "AND") {

    fetch(geoJSONFile)
        .then(response => response.json())
        .then(geojsonData => {

            L.geoJSON(geojsonData, {

                // --------------------------------------------------------
                // FILTER: Only include features that match AND / OR logic
                // --------------------------------------------------------
                filter: feature => {

                    const props = feature.properties;
                    if (!props) return false;

                    if (!Array.isArray(tagArray) || tagArray.length === 0)
                        return true;  // no tags → include all

                    if (selectANDOR.toUpperCase() === "AND") {
                        // ALL tags must match
                        return tagArray.every(tag => featureMatchesTag(props, tag));
                    } else {
                        // OR mode: ANY tag match is enough
                        return tagArray.some(tag => featureMatchesTag(props, tag));
                    }
                },

                // Marker creation
                pointToLayer: (feature, latlng) => L.marker(latlng),

                // Popup handling
                onEachFeature: (feature, layer) => {

                    // Initial placeholder popup
                    layer.bindPopup(
                        `<b>${feature.properties?.name || 'Unnamed'}</b><br>` +
                        `${feature.properties?.description || ''}<br>` +
                        `<div id="img-placeholder">Loading images…</div>`,
                        { autoPan: false, keepInView: false }
                    );

                    // Lazy-load images AFTER opening popup
                    layer.on("popupopen", async (e) => {

                        const term = feature.properties?.name || "";
                        const imageHtml = await buildPopupImages(term, numImages);

                        const originalHtml =
                            `<b>${feature.properties?.name || 'Unnamed'}</b><br>` +
                            `${feature.properties?.description || ''}<br>`;

                        e.popup.setContent(imageHtml + originalHtml);
                    });
                }

            }).addTo(map);

        })
        .catch(err => console.error("Error loading GeoJSON:", err));
}



//To do: make a function that makes an html out of the various properties of a given geoJSON feature
//this is for the creation of the popup text that does not require an internet search.
//The title of the location should be in big letters below the images and should likely exist as a 
//separate div

//To do: make a 'get tags' feature which returns the properties of the given geoJSON feature
//and adds all the tags that have 'true' in them. This allows quick tag lookup while other information
//is not explicitly included. Yay simplification!

//To do: make a populate list view feature: theoretically the list view could be populated at the same time as the map but
//hidden (this may be slow)