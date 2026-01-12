/* Welcome to the menu.js file, created by Phillip Wandyez 12/10/2025
The menu.js file contains the various functions related to menu operations for index.html

Keeping the menu functions contained in a separate file means that they do not clutter other files
where they could feasibly fit.

*/


// menu.js


/////////////////////////////////////////////////////////////////////////
////MENU SECTION////////////////////////////////////////////////////////
// Show/hide search panel

const menuButton = document.getElementById('nav-menu');
const menuDropdown = document.getElementById('menu-dropdown');
const dropdown   = document.getElementById('menu-dropdown');
const faqLink = document.getElementById('faq-link');
const aboutLink =document.getElementById('about-link');

//This is the menu button
//I want it such that when any button within the menu button is pushed that it hides the dropdown. 
menuButton.addEventListener('click', () => {
    console.log("The menu button has been clicked");
  dropdown.style.display =
    dropdown.style.display === 'flex' ? 'none' : 'flex';
  document.getElementById('about-dropdown').classList.add('hidden');
  document.getElementById('faq-dropdown').classList.add('hidden');
});

//this is the ABOUT click handler
aboutLink.addEventListener('click', e => {
  console.log("The About button has been pushed!");
  e.preventDefault();
  //hide the dropdown when the about button is pushed
    dropdown.style.display =
    dropdown.style.display === 'flex' ? 'none' : 'flex';
  //show the about menu if it is hidden, hide it if it is visible
  document.getElementById('about-dropdown').classList.toggle('hidden');

});

//faq
faqLink.addEventListener('click', e => {
  e.preventDefault();
    //hide the dropdown when the about button is pushed
    dropdown.style.display =
    dropdown.style.display === 'flex' ? 'none' : 'flex';
  console.log("The FAQ button has been pushed!");


  // Toggle the FAQ panel
  document.getElementById('faq-dropdown').classList.toggle('hidden');
});


// END MENU SECTION/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////
//SEARCH BUTTON SECTION/////////////////////////////////////////////////
//the buildCheckboxes function references a json file which has the category 'categories' that points to the categories
//within the json file you want to build checkboxes for the search menu. 
const searchButton = document.getElementById("nav-search");
const searchPanel  = document.getElementById("search-dropdown");
searchButton.addEventListener("click", () => {
    // Toggle visibility
    console.log("The search button has been clicked!")
    const shouldShow = searchPanel.style.display !== "block";
    searchPanel.style.display = shouldShow ? "block" : "none";

    // If showing, load categories
    if (shouldShow) {
        console.log("I am attempting to build the checkboxes!")
        buildCheckboxes("tags.json");
    }
});
async function buildCheckboxes(jsonTagsFilePath) {
  try {
    console.log("buildCheckboxes is running!");

    // Step 1: Fetch the JSON file.
    const response = await fetch(jsonTagsFilePath);
    const data = await response.json();

    // Step 2: Read the list of category names.
    const categories = data.Categories || [];
    console.log("Here are the categories that I found in " + jsonTagsFilePath);
    console.log(categories);

    // Step 3: Get the container from the DOM.
    const container = document.getElementById('categories-container');
    if (!container) {
      console.error('categories-container not found in DOM');
      return;
    }

    // Clear any existing content.
    container.innerHTML = '';

    // Step 4: For each category, create a heading and a set of checkboxes
    categories.forEach(categoryName => {
      const normalizedCategory = String(categoryName).trim();

      // Wrapper for this category
      const categorySection = document.createElement('div');
      categorySection.className = 'category-section';

      // Category heading
      const heading = document.createElement('div');
      heading.className = 'category-heading';
      heading.textContent = normalizedCategory;
      heading.style.fontWeight = 'bold';
      heading.style.marginTop = '8px';
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
      tagsForCategory.forEach(tagValue => {
        const normalizedTag = String(tagValue).trim();
        //This is the bit where you can edit the css
        const label = document.createElement('label');
        label.style.marginRight = '12px';
        label.style.display = 'inline-block';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'tag-checkbox';

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

//this function gets all of the tags for the tag checkboxes and pushes them into an array
//note: this requires tthat the checkboxes have the id 'tag-checkbox'
async function getSelectedTags() {
  const checkedBoxes = document.querySelectorAll('.tag-checkbox:checked');
  const tags = [];

  checkedBoxes.forEach(cb => {
    tags.push(cb.value);   // e.g. "park:national", "museum:history"
  });
  console.log("I have gathered the selected tags from the checkboxes, they are as follows:");
  console.log(tags);

  return tags;
}

// menus.js

// Build the autocomplete <datalist> from locations.geojson
//this builds the autocomplete list for the default HTML autocomplete. 
//this is hardcoded to the name-suggestions element found in index.html
//you will likely need a buildTagsAutoComplete list for the menu, and have to reuse
//said function for the editor add tags section.
async function buildNameAutocompleteList(geojsonFilePath) {
  console.log("Attempting to build name autocomplete!");
  const datalist = document.getElementById('name-suggestions');
  if (!datalist) {
    console.warn('datalist#name-suggestions not found in DOM');
    return;
  }

  try {
    //fetch the geojsonfile so you can take a look at it
    const response = await fetch(geojsonFilePath);
    const geojson = await response.json();

    // Collect all names from features
    //define the nameSet variable. It's a new variable. 
    const namesSet = new Set();

    if (Array.isArray(geojson.features)) {
      geojson.features.forEach(feature => {
        //check the name of every feature in the geoJson file. 
        const name = feature?.properties?.name;
        if (name && typeof name === 'string') {
          namesSet.add(name.trim());
        }
      });
    }
    console.log("Here is the set of names we gathered:");
    console.log(namesSet);

    // Turn Set into a sorted array
    const names = Array.from(namesSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    // Clear any existing options
    datalist.innerHTML = '';

    // Create <option> for each name
    names.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      datalist.appendChild(opt);
    });

    console.log(`Name autocomplete populated with ${names.length} entries.`);
  } catch (err) {
    console.error('Error building name autocomplete from GeoJSON:', err);
  }
}

async function buildCountryAutocompleteList(codejson = "countrycodes.json") {
  try {
    const response = await fetch(codejson);
    if (!response.ok) {
      throw new Error("Failed to load country codes");
    }

    const countryCodes = await response.json();
    const datalist = document.getElementById("country-suggestions");

    if (!datalist) {
      console.warn("Datalist element not found");
      return;
    }

    // Clear existing options (if any)
    datalist.innerHTML = "";

    // Add countries as <option> elements
    Object.keys(countryCodes)
      .sort()
      .forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        datalist.appendChild(option);
      });

  } catch (error) {
    console.error("buildCountryAutocompleteList error:", error);
  }
}


//this list will take the given string for a country and convert it into its country code.
//for laziness sake I am going to hardcode the paths for these
async function countryToCountryCode(countryString ="", codejson = "countrycodes.json"){
  //case: no country to search for? search for everything
  if (!countryString || typeof countryString !== "string") {
    return "";
  }

  try {
    const response = await fetch(codejson);
    if (!response.ok) {
      throw new Error("Failed to load country codes");
    }

    const countryCodes = await response.json();

    // normalize input
    const normalizedInput = countryString.trim().toLowerCase();

    // find matching country (case-insensitive)
    for (const [country, code] of Object.entries(countryCodes)) {
      if (country.toLowerCase() === normalizedInput) {
        return code;
      }
    }

    // no match found
    return "";
  } catch (error) {
    console.error("countryToCountryCode error:", error);
    return "";
  }
}

async function getCountryInput(){
  // step 1: get the input from the country box
  const inputEl = document.getElementById("search-country");
  if (!inputEl){
    console.log("ERROR: country input element nonexistent")
     return null;

  }

  const countryInput = inputEl.value.trim();
  if (countryInput === ""){
    console.log("ERROR: there was no country input");
    return null;
  } 

  // step 2: convert country input to country code
  const countryCode = await countryToCountryCode(countryInput);
  if (!countryCode){
    console.log("ERROR: There was no country code, sorry");
    return null;
  } 

  // step 3: convert to tag string format
  const tag = `country:${countryCode}`;


  // return this tag
  console.log("Country code retrieved:");
  console.log(tag);
  return tag;
}

//you will also need a function that converts the country code into a tag and adds it to the tag array

//END SEARCH BUTTON SECTION////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////







