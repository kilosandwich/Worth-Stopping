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
