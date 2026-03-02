/*
Welcome to the Statistics.js file for Worth Stopping
Created by Phillip Wandyez 2025

The purpose of statistics.js is to calculate statistics for information contained within the locations.geojson file
including:
1.) Average distance to another point. (Note to self: you will likely need to include filters in your search for tags)
*/

async function getDistanceBetweenGPSCoordinates(coord1,coord2, unit = "km"){
    //So it turns out the earth is round, so if you convert the GPS coordinates into radians you can then
    //use a distance calculation for an arc along the surface of a sphere, this is represented by
    //the distance = radius of earth * angle between the two points
    //the haversine formula handles this for us. 

    //degrees to radians helper function
    const toRad = deg => deg * Math.PI / 180;

    //get lng and lat
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    //convert degrees into radians
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    //Get the radius of the earth for the given unit of measurement. 
    //Effectively you only need miles and km because no one else uses any other measurement system. 
    const R = unit === "miles" ? 3958.8 :
              unit === "meters" ? 6371000 :
              unit === "km" ? 6371 :
              6371; // default km

    

    //haversine formula implimentation
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function doPropertiesMatchArray(propArr, props){
//This function checks if the properties within a geojson feature match the properties included in the array of properties.
//however, you will have to get the properties elsewhere and feed them into this.
//this is meant to be used as a helper function when iterating through the geojson file.
//propArr is assumed to be an array of strings like ["uid=1254", "country=POL"]
//props is assumed to be a property object from the geojson

    return propArr.every(pair => {
        if (typeof pair !== "string") return false;

        const [key, value] = pair.split("=");

        if (!key || value === undefined) return false;

        // Trim whitespace just in case
        const cleanKey = key.trim();
        const cleanValue = value.trim();

        return (
            //the property exists AND the property matches the value
            Object.prototype.hasOwnProperty.call(props, cleanKey) &&
            String(props[cleanKey]) === cleanValue
        );
    });
}

async function getUIDsThatMatchProperties(propArr, geojsonFilePath="locations.geojson"){
//this function is meant to iterate through every feature within a geojson file
//and return an array of UIDs that contain all of the properties included in propArr
//propArr is assumed to be an array of strings like ["uid=1254", "country=POL"]
    try {

        ///////////////GeoJson Loading////////////////
        // Fetch the geojson file
        const response = await fetch(geojsonFilePath);

        if (!response.ok) {
            //this happens sometimes
            throw new Error("Failed to load GeoJSON file");
        }

        const geojson = await response.json();

        if (!geojson.features || !Array.isArray(geojson.features)) {
            throw new Error("Invalid GeoJSON structure");
        }
        //////////////////////////////////////////////
        
        const matchingUIDs = [];

        // Iterate through all features
        for (const feature of geojson.features) {
            if (!feature.properties) continue;

            //fetch the properties only once to make it run faster
            props = feature.properties;
            const matches = await doPropertiesMatchArray(
                propArr,
                props
            );

            if (matches) {
                // Ensure UID exists before pushing
                if ("uid" in props) {
                    matchingUIDs.push(props.uid);
                }
            }
        }

        return matchingUIDs;

    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getPropsFromUID(uid, geojsonFilePath="locations.geojson"){
    //This function retrieves the properties from a geojson file for a given uid
    //the uid is expected as a string like "1234"

    // Fetch the geojson file
    const response = await fetch(geojsonFilePath);

    if (!response.ok) {
        throw new Error("Failed to load GeoJSON file");
    }

    const geojson = await response.json();
    //Great, we got the geojson, now we need to find the uid in the geojson that matches the uid. 

    // Iterate through features to find matching uid
    for (const feature of geojson.features) {
        //somehow there's no features and the geojson didn't combust
        if (!feature.properties) continue;

        if (String(feature.properties.uid) === String(uid)) {
            return feature.properties; // return full properties object
        }
    }

    // If no match found
    return null;
}

async function getGeometryFromUID(uid, geojsonFilePath="locations.geojson"){
    //This function retrieves the properties from a geojson file for a given uid
    //the uid is expected as a string like "1234"

    // Fetch the geojson file
    const response = await fetch(geojsonFilePath);

    if (!response.ok) {
        throw new Error("Failed to load GeoJSON file");
    }

    const geojson = await response.json();
    //Great, we got the geojson, now we need to find the uid in the geojson that matches the uid. 

    // Iterate through features to find matching uid
    for (const feature of geojson.features) {
        //somehow there's no features and the geojson didn't combust
        if (!feature.properties) continue;

        if (String(feature.properties.uid) === String(uid)) {
            return feature.geometry; // return full properties object
        }
    }

    // If no match found
    return null;
}

async function shortestDistanceComparedToOtherUidsInArray(uidArr, uid, unit="km"){
//This function iterates through every uid in the uidArr, and calculates the shortest distance within the uidArr and the given uid.

    const uidGeometry = await getGeometryFromUID(uid);
    const uidCoords = uidGeometry.coordinates;
    let smallestDistance = Infinity;
    for (const uidToCompare of uidArr){
        //make sure to not include yourself, otherwise the answer will always be zero.
        if (uidToCompare !=uid){
            uidToCompareGeometry = await getGeometryFromUID(uidToCompare);
            uidToCompareCoords = uidGeometry.coordinates;
            distance = await getDistanceBetweenGPSCoordinates(uidCoords,uidToCompareCoords, unit);
            if (distance < smallestDistance){
                distance = smallestDistance;
            }
        }
    }
    return smallestDistance;
}
 async function getAverageShortestDistance(uidArr, unit="km"){
    //this function iterates through an array of uids (assumed to be in string format)
    //and calculates the average shortest distance
    let distanceArr = [];
    let totaldistance = 0;
    for (const uid of uidArr){
        shortestDistance = await shortestDistanceComparedToOtherUidsInArray(uidArr,uid,unit);
        distanceArr.push(shortestDistance);
    }
    //take the average

    for (const distance of distanceArr){
        totaldistance += distance;
    }

    return totaldistance/distanceArr.length;

 }