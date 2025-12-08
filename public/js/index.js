/* eslint-disable */
import { displayMap } from "./mapbox";
import { login, logout } from "./login";

// DOM Elements:
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form");
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

if (logoutBtn) logoutBtn.addEventListener("click", logout);
