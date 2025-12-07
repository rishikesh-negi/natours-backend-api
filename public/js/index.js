/* eslint-disable */
import { login } from "./login";
import { displayMap } from "./mapbox";

// DOM Elements:
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form");

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
