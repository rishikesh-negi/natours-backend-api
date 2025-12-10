/* eslint-disable */
import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import { updateUserData } from "./updateSettings";

// DOM Elements:
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const updateUserDataForm = document.querySelector(".form-user-data");
const logoutBtn = document.querySelector(".nav__el--logout");

// Form values:
let email;
let password;

// Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    email = document.getElementById("email").value;
    password = document.getElementById("password").value;
    login(email, password);
  });
}

if (updateUserDataForm) {
  updateUserDataForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    updateUserData(name, email);
  });
}

if (logoutBtn) logoutBtn.addEventListener("click", logout);
