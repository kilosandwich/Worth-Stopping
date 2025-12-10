/* Welcome to the menu.js file, created by Phillip Wandyez 12/10/2025
The menu.js file contains the various functions related to menu operations for index.html

Keeping the menu functions contained in a separate file means that they do not clutter other files
where they could feasibly fit.

*/


// menu.js
const menuButton = document.getElementById('nav-menu');
const dropdown   = document.getElementById('menu-dropdown');

menuButton.addEventListener('click', () => {
    console.log("The menu button has been clicked");
  dropdown.style.display =
    dropdown.style.display === 'flex' ? 'none' : 'flex';
});

//to do: make a drop down menu that references the tags.json file and creates a checkmark based system that when the search 
//button is hit revises the map or list view.
//my assumption is that you will have to create a populate list feature entirely separate from the populate map feature
//the list will be populated after the map because the map is more important

// Show/hide search panel
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


//the buildCheckboxes function references a json file which has the category 'categories' that points to the categories
//within the json file you want to build checkboxes for the search menu. 
async function buildCheckboxes(jsonTagsFilePath){
try {
    console.log("buildcheckboxes is running!")
    //Step 1: Fetch the JSON file, make sure to wait until it is finished loading.
    const response = await fetch(jsonTagsFilePath);   // adjust path if needed
    const data = await response.json();

    //Get the categories container from the index.html, this is a requirement otherwise it will fail. 
    //in the future you might want to make this an entirely separate JSON file so you don't go looking in one
    //place for everything and need to add exemptions, it should really simplify things.
    const categories = data.Categories || [];
    console.log("Here are the categories that I found in "+ jsonTagsFilePath);
    console.log(categories)
    const container = document.getElementById('categories-container');
    if (!container) {
        //whoops, we somehow didn't get the container
      console.error('categories-container not found in DOM');
      return;
    }

    // Clear any existing content just in case otherwise it will look weird.
    //the html was just filler waiting for the categories to populate an yway
    container.innerHTML = '';

    // For each category name, create a checkbox + label
    //OKAY so this is the part where stuff is going not right, instead of having the category name as the heading
    //and everything within that category in the JSON file as a checkbox, only the categories listed are being shown. 
    categories.forEach(categoryName => {
      const normalized = String(categoryName).trim();

      const label = document.createElement('label');
      label.style.marginRight = '12px';
      label.style.display = 'inline-block';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'tag-checkbox';

      // We can encode the value as "category:normalizedLowercase"
      const tagValue = 'category:' + normalized.toLowerCase();
      checkbox.value = tagValue;

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + normalized));

      container.appendChild(label);
    });

  } catch (err) {
    console.error('Error loading tags.json:', err);
  }
}



