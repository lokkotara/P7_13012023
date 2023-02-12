import {
  createFilters,
  updateFilters,
  updateDatasFilters,
  displaysActiveTags,
} from "./components/filter.js";

import { showAllRecipes } from "./pages/index.js";

let src;
let recipes = null;
let recipesToDisplay = null;
let tagsListsToDisplay = {
  ingredients: [],
  ustensils: [],
  appliances: [],
};
let activeTags = {
  ingredients: [],
  ustensils: [],
  appliances: [],
  searchValue : "",
};

const setDataManagerSource = (source) => (src = source);

const initDataManager = async () => {
  try {
    const response = await fetch(src);
    recipes = await response.json();
    formatRecipes(recipes);
    recipesToDisplay = recipes;
  } catch (error) {
    console.error(error);
  }
};

const getAllRecipes = async () => {
  if (!recipes) await initDataManager();
  return recipesToDisplay;
};

/**
 * It takes a string, splits it into an array of words, filters out words that are less than 3
 * characters, then filters the recipes array to only include recipes that have at least one of the
 * words in the title, description, or ingredients.
 *
 * @returns {object[]} An array of recipes that match the search value
 */
const filterSearch = () => {
  let filteredWords   = [];
  let tempRecipes     = [];
  const words         = activeTags.searchValue.split(" ");

  for (let i = 0, size = words.length; i < size; i++) {
    if (words[i].length >= 3) filteredWords.push(words[i]);
  }

  for (let i = 0, size = recipes.length; i < size; i++) {
    let match   = true;
    let recipe  = recipes[i];

    for (let j = 0, size = filteredWords.length; j < size; j++) {
      let word = filteredWords[j];
      if (!recipe.name.toLowerCase().includes(word.toLowerCase()) && !recipe.description.toLowerCase().includes(word.toLowerCase())) {
        let ingredientMatch = false;

        for (let k = 0, size = recipe.ingredientsArray.length; k < size; k++) {
          if (recipe.ingredientsArray[k].toLowerCase().includes(word.toLowerCase())) {
            ingredientMatch = true;
            break;
          }
        }
        if (!ingredientMatch) {
          match = false;
          break;
        }
      }
    }
    if (match) {
      tempRecipes.push(recipe);
    }
  }
  recipesToDisplay = filterRecipes(tempRecipes);
  return recipesToDisplay;
};

function filterRecipes(recipesToDisplay) {
  let filteredRecipes = [];
  for (let i = 0; i < recipesToDisplay.length; i++) {
    let recipe = recipesToDisplay[i];

    if (activeTags.ingredients.length > 0) {
      let ingredientMatch = true;
      for (let j = 0; j < activeTags.ingredients.length; j++) {
        if (!recipe.ingredientsArray.includes(activeTags.ingredients[j])) {
          ingredientMatch = false;
          break;
        }
      }
      if (!ingredientMatch) {
        continue;
      }
    }

    if (activeTags.ustensils.length > 0) {
      let ustensilMatch = true;
      for (let j = 0; j < activeTags.ustensils.length; j++) {
        let match = false;
        for (let k = 0; k < recipe.ustensils.length; k++) {
          if (recipe.ustensils[k].toLowerCase() === activeTags.ustensils[j]) {
            match = true;
            break;
          }
        }
        if (!match) {
          ustensilMatch = false;
          break;
        }
      }
      if (!ustensilMatch) {
        continue;
      }
    }

    if (activeTags.appliances.length > 0) {
      let applianceMatch = false;
      for (let j = 0; j < activeTags.appliances.length; j++) {
        if (recipe.appliance.toLowerCase() === activeTags.appliances[j]) {
          applianceMatch = true;
          break;
        }
      }
      if (!applianceMatch) {
        continue;
      }
    }
    filteredRecipes.push(recipe);
  }
  return filteredRecipes;
}

/**
 * It takes a recipe object, and adds an ingredientsArray property to it based on its ingredients
 * @param {object} recipe - a recipe object
 */
const addIngredientsArray = (recipe) => {
  const ingredientsArray = [];
  for (const ingredients of recipe.ingredients) {
    const splitIngredient = ingredients.ingredient.split(" ");
    const formattedIngredient = splitIngredient.map((word) =>
      word.toLowerCase()
    );
    ingredientsArray.push(formattedIngredient.join(" "));
  }
  recipe.ingredientsArray = ingredientsArray;
};

const formatRecipes = (recipes) => {
  for (const recipe of recipes) {
    addIngredientsArray(recipe);
  }
};

/**
 * It takes an array, flattens it if necessary, removes duplicates, sorts it, and capitalizes
 * the first letter of each string. It returns an array of formatted strings.
 * @param {string[][]|string[]} array - the array of arrays that you want to flatten and format
 * @returns {[string]}An array of sorted strings.
 */
const getFormattedList = (array) => {
  const formattedList = new Set();
  array.flat().forEach((string) => {
    formattedList.add(string.toLowerCase());
  });
  return [...formattedList]
    .sort((a, b) => a.localeCompare(b))
    .map((string) => string.charAt(0).toUpperCase() + string.slice(1));
};

/**
 * It takes an array of arrays, and returns an array of unique values.
 * @returns {{ingredients: string[], ustensils: string[], appliances: string[]}} An object with 3 properties: ingredients, ustensils, appliances.
 */
const getTagsToDisplay = () => {
  const ustensilsArray = recipesToDisplay.map((recipe) => recipe.ustensils);
  const ingredientsArray = recipesToDisplay.map(
    (recipe) => recipe.ingredientsArray
  );
  const appliancesArray = recipesToDisplay.map((recipe) =>
    recipe.appliance.toLowerCase()
  );
  tagsListsToDisplay = {
    ingredients: filterByIngredientSearch(getFormattedList(ingredientsArray)),
    ustensils: filterByUstensilSearch(getFormattedList(ustensilsArray)),
    appliances: filterByApplianceSearch(getFormattedList(appliancesArray)),
  };
  return tagsListsToDisplay;
};

function filterByIngredientSearch(ingredients) {
  const searchValue = document.getElementById("ingredientsFilterInput");
  if (!searchValue) return ingredients;
  else {
    return ingredients.filter((ingredient) =>
      ingredient.toLowerCase().includes(searchValue.value.toLowerCase()));
  }
}

function filterByUstensilSearch(ustensils) {
  const searchValue = document.getElementById("ustensilsFilterInput");
  if (!searchValue) return ustensils;
  else {
    return ustensils.filter((ustensil) =>
      ustensil.toLowerCase().includes(searchValue.value.toLowerCase()));
  }
}

function filterByApplianceSearch(appliances) {
  const searchValue = document.getElementById("appliancesFilterInput");
  if (!searchValue) return appliances;
  else {
    return appliances.filter((appliance) =>
      appliance.toLowerCase().includes(searchValue.value.toLowerCase())
    );
  }
}

function resetRecipesToDisplay() {
  recipesToDisplay = filterSearch();
}

function addTag(name, list) {
  if (!activeTags[list].includes(name)) activeTags[list].push(name);
  filterSearch();
  getTagsToDisplay();
  displaysActiveTags(activeTags);
  showAllRecipes(recipesToDisplay);
  const index = tagsListsToDisplay[list].indexOf(
    name.charAt(0).toUpperCase() + name.slice(1)
  );
  if (index > -1) {
    tagsListsToDisplay[list].splice(index, 1);
    const { ingredients, ustensils, appliances } = tagsListsToDisplay;
    updateDatasFilters(
      { name: "ustensils", array: ustensils },
      { name: "appliances", array: appliances },
      { name: "ingredients", array: ingredients }
    );
  }
}

function removeTag(name, list) {
  const index = activeTags[list].indexOf(name);
  const tagToRemove = activeTags[list].splice(index, 1);
  tagsListsToDisplay[list].push(tagToRemove[0]);
  filterSearch();
  getTagsToDisplay();
  showAllRecipes(recipesToDisplay);
  displaysActiveTags(activeTags);
      const { ingredients, ustensils, appliances } = tagsListsToDisplay;
      updateDatasFilters(
        { name: "ustensils", array: ustensils },
        { name: "appliances", array: appliances },
        { name: "ingredients", array: ingredients }
      );
}

function filterListWithActiveTags(array, name) {
  return array.filter((item) => !activeTags[name].includes(item.toLowerCase()));
}

function updateSearchValue(value) {
  activeTags.searchValue = value;
}

function filterTagSearch (filterName, filterValue) {
  getTagsToDisplay();
  if (filterName === "ingredients") {
    return tagsListsToDisplay.ingredients.filter((ingredient) => ingredient.toLowerCase().includes(filterValue.toLowerCase()))
  } else if (filterName === "ustensils") {
    return tagsListsToDisplay.ustensils.filter((ustensil) => ustensil.toLowerCase().includes(filterValue.toLowerCase()))
  } else if (filterName === "appliances") {
    return tagsListsToDisplay.appliances.filter((appliance) => appliance.toLowerCase().includes(filterValue.toLowerCase()))
  }
}

export {
  setDataManagerSource,
  initDataManager,
  getAllRecipes,
  filterSearch,
  getTagsToDisplay,
  resetRecipesToDisplay,
  addTag,
  filterListWithActiveTags,
  updateSearchValue,
  removeTag,
  filterTagSearch,
};
