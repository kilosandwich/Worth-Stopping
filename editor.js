//Welcome to the editor.js file, created by Phillip Wandyez 12/9/2025
/*
The purpose of this file is to create an editor to allow quick addition of new points
in a geoJSON file, as well as add new tags quickly based on the already existing tags in the
geoJSON file
*/

//A function that edits existing fields within a geoJSON file
//this will likely need to take an array of fields and then write them to the geoJSON file
//you will likely need to load all fields within the geoJSON file so editing it is relatively easy
//existing geoJSON entries need to be edited within the document instead of just added to the end
//new ids need to be added, probably just by counting upwards
//the editor needs some defaults, like GPS coordinates, postal codes, street address
//look it would be a really nice quality of life feature if the editor had an autofill that took 
//a street address and converted it into a series of tagsS

//A function to return GPS coordinates based upon street address. 
//This is possible using open street maps nominatim
//nominatim has a limit to its public api, though it should be limited in its usage. 
//Look into gmapsextractor extension which gets GPS
//https://github.com/gosom/google-maps-scraper
//there's also this on github

//A function that looks up all possible tags within geoJSON files and presents them as easy
//to toggle tags at the end that can be eliminated by pushing x

//A function to push the current locally cached geoJSON file changes to github


//the compare UID function checks if the given UID exists in the geoJSON filepath
//this will be required for replacing existing locations with updated information
//as this determines if the data stored in the temporary geoJSON file is to be used to replace
//or append. 
async function compareUID(uid, geojsonFilePath = "locations.geojson") {
    console.log("Compariing UID!");
    console.log(uid);
  return fetch(geojsonFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load GeoJSON");
      }
      return response.json();
    })
    .then(geojson => {
      if (!Array.isArray(geojson.features)) {
        return false;
      }

      return geojson.features.some(feature =>
        String(feature?.properties?.uid) === String(uid)
      );
    })
    .catch(err => {
      console.error("compareUID error:", err);
      return false;
    });
}
//this function returns the properties for the location matching the uid
//of the uid for the given geojson file
async function getProperties(uid, geojsonFilePath = "locations.geojson") {
  try {
    const response = await fetch(geojsonFilePath);
    if (!response.ok) {
      throw new Error("Failed to load GeoJSON");
    }

    const geojson = await response.json();

    if (!Array.isArray(geojson.features)) {
      throw new Error("Invalid GeoJSON: missing features array");
    }

    const match = geojson.features.find(feature =>
      String(feature?.properties?.uid) === String(uid)
    );

    // If no matching feature was found
    if (!match || !match.properties) {
      return null;
    }

    // Return only the properties object
    return match.properties;
  } catch (err) {
    console.error("getProperties error:", err);
    return null;
  }
}

//this function returns the coordinates for the given geojson file
//that match the given uid
async function getCoordinates(uid, geojsonFilePath = "locations.geojson") {
  try {
    const response = await fetch(geojsonFilePath);
    if (!response.ok) {
      throw new Error("Failed to load GeoJSON");
    }

    const geojson = await response.json();

    if (!Array.isArray(geojson.features)) {
      throw new Error("Invalid GeoJSON: missing features array");
    }

    const match = geojson.features.find(feature =>
      String(feature?.properties?.uid) === String(uid)
    );

    if (!match || !match.geometry) {
      return null;
    }

    // GeoJSON coordinates can vary by geometry type (that's a future problem)
    return {
      coordinates: match.geometry.coordinates
    };
  } catch (err) {
    console.error("getCoordinates error:", err);
    return null;
  }
}

//this function will look through every feature in the geoJSON file and count the UIDs
//this is used when no UID is given for a location, and a UID will be counted until it is 
//higher than all existing UIDs
async function generateUID(geojsonFilePath = "locations.geojson") {
  try {
    const response = await fetch(geojsonFilePath);
    if (!response.ok) {
      throw new Error("Failed to load GeoJSON");
    }

    const geojson = await response.json();

    if (!Array.isArray(geojson.features)) {
      throw new Error("Invalid GeoJSON: missing features array");
    }

    let maxUID = 0;

    for (const feature of geojson.features) {
      const uid = feature?.properties?.uid;

      // Skip missing or non-numeric UIDs safely
      const numericUID = Number(uid);
      if (Number.isInteger(numericUID) && numericUID > maxUID) {
        maxUID = numericUID;
      }
    }

    return maxUID + 1;
  } catch (err) {
    console.error("generateUID error:", err);

    // Safe fallback: first UID
    return 1;
  }
}

function autofillEditorInput(uid,props ="",coordinates=""){
  //make sure to convert the coordinates into a usable type
  document.getElementById("editor-uid").value = uid || "";
  document.getElementById("editor-name").value = props?.name || "";
  document.getElementById("editor-street").value = props?.street|| "";
  document.getElementById("editor-country").value = props?.country || "";
  document.getElementById("editor-state").value = props?.state || "";
  document.getElementById("editor-county").value = props?.county || "";
  document.getElementById("editor-city").value = props?.city || "";
  document.getElementById("editor-website").value = props?.website || "";
  document.getElementById("editor-description").value = props?.description || "";

  //Coordinates are not stored in an array, the array must be converted to a string in order to be displayed
  //now hilariously, this very same string will be converted back into an array, thus achieving almost nothing
  //go team!
  console.log("The coordinates we are attempting to convery into an array are");
  console.log(coordinates);

  let coordinatesString;
  //in the event that the coordinates are blank, there is no need to run the function to convert them into a string
  if (coordinates != ""){
    coordinatesString = coordinateObjToString(coordinates);
  }
  console.log("I have converted the coordinates into a string:");
  console.log(coordinatesString);
  
  document.getElementById("editor-coordinates").value = coordinatesString || "";


  //you will need to figure out how to autofill the tags section considering there are literally ENDLESS tags to add
  //and you might want to make them up on the fly.
}

//define a function that retrieves the data from the given UID of the geoJSON, it needs to return all relevant features to the creation of
//a location, including populating a tag array

//the editor function is called based on the UID of a given location
//this UID is most often supplied by a popup which features a convenient editor button
//we are going to need to define a very big html thingy that features a lot of buttons for input
async function editor(uid = "", geojsonFilePath = "locations.geojson"){
    console.log("The editor has been called for location: ");
    console.log(uid);
    UIDExists = await compareUID(uid, geojsonFilePath)
    props = "";

    //if no UID exists (either none given, or not present), generate one for the new location. 
    if ((uid === "") || (!UIDExists)) {
        //the UID clearly does not exist, or isn't present
        //so generate one
        uid = await generateUID(geojsonFilePath);
        console.log("testing generation of UID");
        console.log(uid);
        //make sure to populate the UID now
        autofillEditorInput(uid,"","")
    }else{
        //since the UID exists, gather the information from the existing uid. 
        //it is easier to gather all the coordinates THEN parse them
        //it's not like the editor is exactly concerned with efficiency of speed,
        //but I would rather not have to open the geoJSON file EVERY time I want to use it
         props = await getProperties(uid, geojsonFilePath);
         coordinates = await getCoordinates(uid,geojsonFilePath);
         console.log("Here are the properties and coordinates for the given UID:")
         console.log(props);
         console.log(coordinates);
         autofillEditorInput(uid,props,coordinates);

         //time to populate the editor window with all the properties we have gathered. Yay.
    }
    
    //Great, now that we have the properies of the given UID (if they existed in the first place)
    //It is time to fill in the editor menu (which needs to persist if it is accidentally closed!)
    //The editor should probably exist as a div that is constantly hidden in the HTML. I mean that makes sense right?
    //the editor should then popup when the editor button is pushed. 
    buildEditorCheckboxes("tags.json", props);


    //great, the editor is done, create the local geoJSON file before you push it
    //OK, the local geoJSON file loaded successfull (maybe do a performance check where the data within it)
    //is compared to the data in the forms
    //if successfully compared (what we want to submit (ONLY ONE LOCATION)) then edit the main geoJSON file. 
    console.log("I am attempting to open the editor");
    openLocationEditor();
    
}

//This is the build editor checkboxes function, it builds a series of checkboxes in the 
//editor window when the editor window is opened. When building the checkbox, it determines
//if the checkbox is present and if so prechecks the box such that it is ready to be populated
//immediately. This is smart. 
async function buildEditorCheckboxes(jsonTagsFilePath = "tags.json", props) {
  try {
    console.log("buildEditorCheckboxes is running!");

    // Step 1: Fetch the JSON file.
    const response = await fetch(jsonTagsFilePath);
    const data = await response.json();

    // Step 2: Read the list of category names.
    const categories = data.Categories || [];
    console.log("Here are the categories that I found in " + jsonTagsFilePath);
    console.log(categories);

    // Step 3: Get the container from the DOM.
    //Note: this container needs to be specified for the editor window. 
    const container = document.getElementById('editor-tags-container');
    if (!container) {
      console.error('categories-container not found in DOM');
      return;
    }

    // Clear any existing content.
    container.innerHTML = '';

    // Step 4: For each category, create a heading and a set of checkboxes
    //In this section you 
    categories.forEach(categoryName => {
      const normalizedCategory = String(categoryName).trim();

      // Wrapper for this category
      const categorySection = document.createElement('div');
      categorySection.className = 'editor-category-section';

      // Category heading
      const heading = document.createElement('div');
      heading.className = 'editor-category-heading';
      heading.textContent = normalizedCategory;
      categorySection.appendChild(heading);

      // Get all tags for this category from the JSON
      // For your file, this is simply data[normalizedCategory],
      // e.g. data["Parks"], data["Museums"], data["Worth Stopping Flags"].
      const tagsForCategory = data[normalizedCategory];


      if (!Array.isArray(tagsForCategory)) {
        console.warn(
          `No tags array found for category '${normalizedCategory}' in tags.json`
        );
        // Still append the heading, but no checkboxes
        container.appendChild(categorySection);
        return; // continues to next category in forEach
      }

      // For each tag inside this category, create a checkbox + label
      //because you are checking if the tag exists, this is where you compare if the tag already exists.
      //and if so starts the checkbox prechecked. 
      tagsForCategory.forEach(tagValue => {
        const normalizedTag = String(tagValue).trim();
        //check if the given set of properties already possesses the tag

        //if the properties actually exist, then check the categories within each property. 
        let hasTag;
        if (props != ""){
          //check if any key matches the tag from the row, then pre check the row.
            hasTag = Object.keys(props || {}).some(
            key => key.toLowerCase() === normalizedTag
          );

          if (hasTag) {
            console.log("Already possesses tag!");
            console.log(normalizedTag);
          }
        }



        //This is the bit where you can edit the css
        const label = document.createElement('label');
        label.className = 'label-editor-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'tag-editor-checkbox';
        checkbox.checked = hasTag; //if the tag is possessed, it will already be checked

        // Use the actual tag string from JSON as the value,
        // e.g. "park:national", "museum:history", etc.
        checkbox.value = normalizedTag;
        checkbox.dataset.category = normalizedCategory;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + normalizedTag));

        categorySection.appendChild(label);
      });

      // Append the whole category block to the container
      container.appendChild(categorySection);
    });
  } catch (err) {
    console.error('Error loading tags.json:', err);
  }
}

//the editor save changes button:

async function editorSaveChanges(locationsgeojsonFileHandle ="") {
  console.log("Attempting to begin saving process");

  const { properties, geometry } = await editorGetInputs();
  console.log("We have retrieved the properties");
  console.log(properties)
  console.log("We have retrieved the geometry");
  console.log(geometry);
  //download a local geoJSON file reflecting the changes you wish to make before actually trying to change the locations.geojson file.
  //saveLocationLocally(properties, geometry);
  if (!properties?.uid) {
    throw new Error("No UID found in properties");
  }

  await upsertGeoJSONFeature(
    locationsgeojsonFileHandle,
    properties,
    geometry,
    properties.uid
  );
}



//this function is designed to get all of the inputs from the editor window. 
//for the sake of convenience all property tags will be added into an array
//this array will then be added to everything else.
//this function will return two arrays
//one for properties
//and one for geometry
async function editorGetInputs() {
  const props = {};

  console.log("Collected all the tags for the editor window!");

  props.uid = editorGetUID();
  props.name = editorGetName();
  props.street = editorGetStreetAddress();
  props.country = editorGetCountry();
  props.state = editorGetState();
  props.county = editorGetCounty();
  props.city = editorGetCity();
  props.website = editorGetWebsite();
  props.description = editorGetDescription();

  // Tags → boolean flags
  const tags = await editorGetSelectedTags();
  console.log("Tags gathered, let's iterate through them");
  console.log(tags);
  tags.forEach(tag => {
    props[tag] = true;
  });

  const locLat = editorGetLat();
  const locLng = editorGetLng();

  const geometry = {
    type: "Point",
    coordinates: [locLng, locLat]
  };

  return {
    properties: props,
    geometry: geometry
  };
}


//the save location will open the geoJSON file (or at least a temporary copy of it, and append to the end of it a new location)
//the inputs will have to be very long and very standardized
//you may wish to consider definining a particular object in js such that its features can be easily passed between js files.
//the purpose of saving it locally is so we know the original isn't getting fucked over before we actually append and replace files
function saveLocationLocally(properties, geometry) {

  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: properties,
        geometry: geometry
      }
    ]
  };

  const jsonString = JSON.stringify(geojson, null, 2);
  const blob = new Blob([jsonString], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "editor.geojson";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log("editor.geojson saved locally");
}

//Upsert means to update and insert
async function upsertGeoJSONFeature(
  fileHandle,
  properties,
  geometry,
  uid
) {
  if (!fileHandle) {
    throw new Error("No file handle provided");
  }

  // --------------------------------------------------
  // Step 1: Ensure we have write permission
  // --------------------------------------------------
  const permission = await fileHandle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    throw new Error("Write permission to GeoJSON file was denied");
  }

  // --------------------------------------------------
  // Step 2: Read existing file contents
  // --------------------------------------------------
  const file = await fileHandle.getFile();
  const text = await file.text();

  let geojson;
  try {
    geojson = JSON.parse(text);
  } catch (err) {
    throw new Error("Existing file is not valid JSON");
  }

  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("GeoJSON file is not a FeatureCollection");
  }

  if (!Array.isArray(geojson.features)) {
    geojson.features = [];
  }

  // --------------------------------------------------
  // Step 3: Build the new feature
  // --------------------------------------------------
  const newFeature = {
    type: "Feature",
    properties: { ...properties, uid },
    geometry
  };

  // --------------------------------------------------
  // Step 4: Replace or append
  // --------------------------------------------------
  const existingIndex = geojson.features.findIndex(
    f => f?.properties?.uid === uid
  );

  if (existingIndex !== -1) {
    console.log(`Replacing existing feature with uid: ${uid}`);
    geojson.features[existingIndex] = newFeature;
  } else {
    console.log(`Appending new feature with uid: ${uid}`);
    geojson.features.push(newFeature);
  }

  // --------------------------------------------------
  // Step 5: Write file back to disk
  // --------------------------------------------------
  const writable = await fileHandle.createWritable();
  await writable.write(
    JSON.stringify(geojson, null, 2)
  );
  await writable.close();

  console.log("GeoJSON file successfully updated");
}




function openLocationEditor() {
document.getElementById("edit-dropdown").style.display = "block";

}

function closeLocationEditor() {
  document.getElementById("edit-dropdown").style.display = "none";
}



/*=================================
BUTTON SECTION - WHERE BUTTONS LIVE
b=b=b=b=b=b=b=b=b=b=b=b=b=b=b=b=b=b
*/
//This button opens the editor when it is clicked. The button is labeled add location
document.getElementById("add-location")
  ?.addEventListener("click", () => {
    console.log("Add location button clicked!");
    editor();
  });
  
//button function in order to open a google maps location of the editor
document.getElementById("editor-open-google-maps")
  ?.addEventListener("click", () => {
    lat = editorGetLat();
    lng = editorGetLng();
    openGoogleMapsToCoordinates(lat,lng);

  });

function openGoogleMapsToCoordinates(lat,lng){
    const url =
      `https://www.google.com/maps/search/?api=1` +
      `&query=${lat},${lng}`;

    window.open(url, "_blank", "noopener");
}

/*
=b=b=b=b=b=b=b=b=b=b=b=b=b=b=b=b=b
END BUTTON SECTION
===================================
*/
/*
==============================
HELPER FUNCTION SECTION
==============================
Welcome to the helper function section
Is it technically inefficient to use a function instead of code the usage directly?
Yes.
However the helper is only used  by admins (meeeeeeeeeeeeee) and as a result does not have to be fast
Never forget future self: this section of code doesn't need to be optimized, stop wasting your time.
*/
//helper functions that do what the getCoordinates function does but just returns a single number. WAY easier to use. 
//helper functions to get the various 
//things from their various form locations
//from the index.html editor
function editorGetUID(){
  const UIDInput = document.getElementById("editor-uid");
  if (!UIDInput){
    console.log("editor-uid input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return UIDInput.value.trim();
}


function editorGetName(){
  const nameInput = document.getElementById("editor-name");
  if (!nameInput){
    console.log("editor-name input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return nameInput.value.trim();
}

function editorGetCoordinates() {
  //within the editor window, the coorinates are stored as lat,lng
  
    const coordinatesInput = document.getElementById("editor-coordinates");

    if (!coordinatesInput) {
        console.warn("editor-coordinates input not found!");
        return null;
    }

    const raw = coordinatesInput.value.trim();

    if (!raw) {
        console.warn("No coordinates entered");
        return null;
    }

    // Expect: "lat,lng" or "lat, lng"
    const parts = raw.split(",").map(p => p.trim());

    if (parts.length !== 2) {
        console.warn("Invalid coordinate format (expected 'lat, lng'):", raw);
        return null;
    }

      // -------------------------------
      // 3. TRANSFORM TO NUMBERS (KEY STEP)
      // -------------------------------
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          console.warn("Coordinates are not valid numbers:", parts);
          return null;
      }

      // -------------------------------
      // 4. Look, lat and lng are limited to +-90 and +-180 respectively
      //    Validate geographic bounds
      // -------------------------------
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn("Coordinates out of bounds:", { lat, lng });
          return null;
      }

    console.log("Coordinates retrieved:", { lat, lng });

    return { lat, lng };
}

function editorGetLat() {
    const coords = editorGetCoordinates();
    return coords ? coords.lat : null;
}

function editorGetLng() {
    const coords = editorGetCoordinates();
    return coords ? coords.lng : null;
}

function editorGetStreetAddress(){
  const streetAdressInput = document.getElementById("editor-street");
  if (!streetAdressInput){
    console.log("editor-street input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return streetAdressInput.value.trim();
}

function editorGetCountry(){
  const countryInput = document.getElementById("editor-country");
  if (!countryInput){
    console.log("editor-country input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return countryInput.value.trim();
}

function editorGetState(){
  const stateInput = document.getElementById("editor-state");
  if (!stateInput){
    console.log("editor-state input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return stateInput.value.trim();
}

function editorGetCounty(){
  const countyInput = document.getElementById("editor-county");
  if (!countyInput){
    console.log("editor-county input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return countyInput.value.trim();
}

function editorGetCity(){
  const cityInput = document.getElementById("editor-city");
  if (!cityInput){
    console.log("editor-city input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return cityInput.value.trim();
}

function editorGetWebsite(){
  const websiteInput = document.getElementById("editor-website");
  if (!websiteInput){
    console.log("editor-website input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return websiteInput.value.trim();
}

function editorGetDescription(){
  const descriptionInput = document.getElementById("editor-description");
  if (!descriptionInput){
    console.log("editor-description input not found!");
    return "";
  }

  //trim the finale value or else it will be whitespacey
  return descriptionInput.value.trim();
}



function coordinateObjToString(coordinateObj){
  //the coordinate object to string function takes an object of coordinates and converts them to a string
  //the object is retrieved from the geoJSON file and looks like obj.coordinates
  //WITHOUT the little array brackets around them.
  //yes this is stupid, yes it is necessary
      // -------------------------------
      // 3. TRANSFORM TO NUMBERS 
      //turn the array into its parts
      // -------------------------------
      console.log("CoordinateARray To String called!");
      console.log("Here is the coordinate obj we are working with");
      console.log(coordinateObj);
      coordinateArray = coordinateObj.coordinates;
 
      const lng = (coordinateArray[0]);
      const lat = (coordinateArray[1]);

      // -------------------------------
      // 4. Look, lat and lng are limited to +-90 and +-180 respectively
      //    Validate geographic bounds
      // -------------------------------
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn("Coordinates out of bounds:", { lat, lng });
          return null;
      }

    console.log("Coordinates retrieved:", { lng, lat });
    
    coordinateString = String(lat) + "," + String(lng);
    return coordinateString;
}


//this function gets all of the tags for the tag checkboxes and pushes them into an array
//note: this requires tthat the checkboxes have the id 'tag-checkbox'
async function editorGetSelectedTags() {
  const checkedBoxes = document.querySelectorAll('.tag-editor-checkbox:checked');
  const tags = [];

  checkedBoxes.forEach(cb => {
    tags.push(cb.value);   // e.g. "park:national", "museum:history"
  });
  console.log("I have gathered the selected tags from the checkboxes, they are as follows:");
  console.log(tags);

  return tags;
}
/*
=========================================
END HELPER SECTION
=========================================
*/
