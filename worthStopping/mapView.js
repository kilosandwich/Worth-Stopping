
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

// This function determines if the given properties of a feature in geoJSON match the name 
//term searched for
function featureMatchesName(props, rawTerm) {
//if there is no search term, then obviously it doesn't match
//makes sure that your implimentation if no name doesn't automatically find no searches at all
  if (!rawTerm) return false;
//convert the raw term into lower case and remove any spaces from beginning and end. Spaces are evil. 
  const term = String(rawTerm).trim().toLowerCase();
  if (!term) return false;

  // Adjust these keys to match your GeoJSON schema
  //if you fuck up your geoJSON schema feel free to shove it in here somewhere. 
  //theoretically, you could add the description in here and it would comb through it, I mean
  //what if the location is known by different names. 
  const nameFields = [
    props.name,
 ];

  // Build a single lowercase string with all available name-ish fields
  //This sounds stupid, but actually works - just mush all the strings together and if in the 
  //string there is a partial or exact match then congratulations, you did it.
  const combinedName = nameFields
    .filter(Boolean)
    .map(v => String(v).toLowerCase())
    .join(" ");

  if (!combinedName) return false;

  // Partial / substring match
  //check if the term is included in the string abomination that we created by slapping all strings together
  return combinedName.includes(term);
}

//this function clears all markers
function clearAllMarkers(map) {
  map.eachLayer(layer => {
    // Case 1: layer itself is a Marker
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
      return;
    }

    // Case 2: layer is a LayerGroup / FeatureGroup / GeoJSON etc.
    if (layer instanceof L.LayerGroup) {
      const markersToRemove = [];

      layer.eachLayer(inner => {
        if (inner instanceof L.Marker) {
          markersToRemove.push(inner);
        }
      });

      markersToRemove.forEach(m => layer.removeLayer(m));
    }
  });
}


//make a function that populates a given map with markers for the given tags (array of tags)
function populateMapMarkers(
  map,
  geoJSONFile,
  tagArray = ["worth stopping"],
  numImages = 4,
  selectANDOR = "AND",
  nameToSearchFor = ""
) {
    //Remove all markers, this can be amended later to only remove markers in the layer
    clearAllMarkers(map);
    //where we leave markers (this is not important for now)
  fetch(geoJSONFile)
    .then(response => response.json())
    .then(geojsonData => {


        const upperMode = String(selectANDOR || "AND").toUpperCase();

        // ----- TAG FILTER PRECOMPUTE -----
        let hasTagFilter = Array.isArray(tagArray) && tagArray.length > 0;
        let validTags = [];

        if (hasTagFilter) {
        validTags = tagArray
            .map(t => String(t).trim())
            .filter(t => t.length > 0);

        if (validTags.length === 0) {
            hasTagFilter = false;
        }
        }

        // ----- NAME FILTER PRECOMPUTE -----
        const trimmedNameSearch = String(nameToSearchFor || "").trim();
        let hasNameFilter = trimmedNameSearch.length > 0;

        let nameTerms = [];
        if (hasNameFilter) {
        nameTerms = trimmedNameSearch
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        if (nameTerms.length === 0) {
            hasNameFilter = false;
        }
        }

        markersLayer = L.geoJSON(geojsonData, {
        filter: feature => {
            const props = feature.properties;
            if (!props) return false;

            // ----------------- TAG FILTER (per feature) -----------------
            let tagPass = true; //initialize variable
            if (hasTagFilter) {
            if (upperMode === "AND") {
                // ALL tags must match
                tagPass = validTags.every(tag => featureMatchesTag(props, tag));
            } else {
                // OR: any tag match is enough
                tagPass = validTags.some(tag => featureMatchesTag(props, tag));
            }
            }

            // ----------------- NAME FILTER (per feature) -----------------
            let namePass = true;
            if (hasNameFilter) {
            if (upperMode === "AND") {
                // ALL name terms must match (partial match)
                namePass = nameTerms.every(term => featureMatchesName(props, term));
            } else {
                // OR: any name term partial-match is enough
                namePass = nameTerms.some(term => featureMatchesName(props, term));
            }
            }

            // ----------------- COMBINE TAG + NAME FILTERS -----------------
            // If neither tag nor name filter is active, include everything.
            if (!hasTagFilter && !hasNameFilter) {
            return true;
            }

            let overallPass;
            if (upperMode === "AND") {
            // Must satisfy all *active* filters.
            overallPass =
                (hasTagFilter ? tagPass : true) &&
                (hasNameFilter ? namePass : true);
            } else {
            // OR: passing any *active* filter is enough.
            const tagRelevant = hasTagFilter ? tagPass : false;
            const nameRelevant = hasNameFilter ? namePass : false;
            overallPass = tagRelevant || nameRelevant;
            }

            return overallPass;
        },


        // Marker creation
        pointToLayer: (feature, latlng) => L.marker(latlng),

        // Popup handling, remember this can be bound to anything within the layer
        //it doesn't have to be a marker
        onEachFeature: (feature, layer) => {
          layer.bindPopup(
            `<b>${feature.properties?.name || 'Unnamed'}</b><br>` +
            `${feature.properties?.description || ''}<br>` +
            `<div id="img-placeholder">Loading images…</div>`,
            { autoPan: false, keepInView: false }
          );

          layer.on("popupopen", async (e) => {
            const term = feature.properties?.name || "";
            const imageHtml = await buildPopupImages(term, numImages);
            const uid = feature.properties?.uid || "No uid found";
            console.log("The uid for this popup is:");
            console.log(uid);
            //define the original HTML
            //in this section you will want to create an edit button which 
            //is bound to the 'uid' found in the properties of the geoJSON feature feature so that it can dynamicallly edit the popup by
            //rewriting the geoJSON file.
            // Define the original HTML with an inline edit button
            const originalHtml =
              `<div class="popup-title-row">
                <b class="popup-title">${feature.properties?.name || 'Unnamed'}</b>
                <button
                  class="popup-edit-btn"
                  title="Edit location"
                  onclick="editor('${uid}')">
                  ✏️
                </button>
              </div>
              ${feature.properties?.description || ''}<br>`;

            e.popup.setContent(imageHtml + originalHtml);
          });
        }

      }).addTo(map);  // <- markers are inside this GeoJSON layer
      return markersLayer;
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