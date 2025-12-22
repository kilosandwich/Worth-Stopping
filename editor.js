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

function autofillEditorInput(uid,props ="",coordinates){
  //make sure to convert the coordinates into a usable type
  document.getElementById("editor-uid").value = props.uid || "";
  document.getElementById("editor-name").value = props.name || "";
  document.getElementById("editor-street").value = props.street|| "";
  document.getElementById("editor-country").value = props.country || "";
  document.getElementById("editor-state").value = props.state || "";
  document.getElementById("editor-county").value = props.county || "";
  document.getElementById("editor-city").value = props.city || "";
  document.getElementById("editor-website").value = props.website || "";
  document.getElementById("editor-coordinates").value = coordinates || "";
  document.getElementById("editor-description").value = props.description || "";
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

    //if no UID exists (either none given, or not present), generate one for the new location. 
    if ((uid === "") || (!UIDExists)) {
        //the UID clearly does not exist, or isn't present
        //so generate one
        uid = await generateUID(geojsonFilePath);
        console.log("testing generation of UID");
        console.log(uid);
        //make sure to populate the UID now
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


    //great, the editor is done, create the local geoJSON file before you push it
    //OK, the local geoJSON file loaded successfull (maybe do a performance check where the data within it)
    //is compared to the data in the forms
    //if successfully compared (what we want to submit (ONLY ONE LOCATION)) then edit the main geoJSON file. 
    console.log("I am attempting to open the editor");
    openLocationEditor();
    
}




//the save location will open the geoJSON file (or at least a temporary copy of it, and append to the end of it a new location)
//the inputs will have to be very long and very standardized
//you may wish to consider definining a particular object in js such that its features can be easily passed between js files.
//the purpose of saving it locally is so we know the original isn't getting fucked over before we actually append and replace files
function saveLocationLocally(){

}

//if the location within the locally saved geoJSON already exists replace it
//this is done by compariing the localtemporary json file with the master file.
//if the location already exists replace it with the updated information
//if the location does not exist, append the new location to the master file.
//for the sake of CONVENIENCE a 'ARE YOU SURE' popup should appear if it is a replacement. 
function appendAndReplace(tempgeojsonFilePath, geojsonFilePath){

}

//this function is designed to get the latitude and longitude for a location based off a provided street address
//this function is intended to be used with a button in the editor where it gets the input fields for street address
//and then fetches the latitude and longitude 
async function getLatLong(){

}


function openLocationEditor() {
document.getElementById("edit-dropdown").style.display = "block";

}

function closeLocationEditor() {
  document.getElementById("edit-dropdown").style.display = "none";
}

document.getElementById("add-location")
  ?.addEventListener("click", () => {
    console.log("Add location button clicked!");
    editor();
  });
//button function in order to open a google maps location of the editor
document.getElementById("editor-open-google-maps")
  ?.addEventListener("click", () => {
    lat = editorGetLat();
    lng = editorGetLang();
    openGoogleMapsToCoordinates(lat,lng);

  });

function openGoogleMapsToCoordinates(lat,lng){
    const url =
      `https://www.google.com/maps/search/?api=1` +
      `&query=${lat},${lng}`;

    window.open(url, "_blank", "noopener");
}


//helper functions to get the various 
//things from their various form locations
//from the index.html editor
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
      // 4. (Optional but recommended)
      //    Validate geographic bounds
      // -------------------------------
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn("Coordinates out of bounds:", { lat, lng });
          return null;
      }

    console.log("Coordinates retrieved:", { lat, lng });

    return { lat, lng };
}
//helped functions that do what the getCoordinates function does but just returns a single number. WAY easier to use. 
function editorGetLat() {
    const coords = editorGetCoordinates();
    return coords ? coords.lat : null;
}

function editorGetLang() {
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
