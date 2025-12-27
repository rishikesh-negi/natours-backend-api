/* eslint-disable */
import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";

// DOM Elements:
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const updateUserDataForm = document.querySelector(".form-user-data");
const updateUserPasswordForm = document.querySelector(".form-user-password");
const logoutBtn = document.querySelector(".nav__el--logout");
const bookTourBtn = document.querySelector("#book-tour");

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
    const photo = document.getElementById("photo").files[0];

    const formData = new FormData();

    formData.append("name", name);
    formData.append("email", email);
    formData.append("photo", photo);

    console.log(formData);

    updateSettings(formData, "data");
  });
}

if (updateUserPasswordForm) {
  updateUserPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const btnSavePassword = document.querySelector(".btn--save-password");
    btnSavePassword.textContent = "Updating...";
    btnSavePassword.setAttribute("disabled", true);
    btnSavePassword.style.cursor = "not-allowed";

    const passwordCurrentField = document.getElementById("password-current");
    const passwordField = document.getElementById("password");
    const passwordConfirmField = document.getElementById("password-confirm");

    const passwordCurrent = passwordCurrentField.value;
    const password = passwordField.value;
    const passwordConfirm = passwordConfirmField.value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password",
    );

    passwordCurrentField.value = "";
    passwordField.value = "";
    passwordConfirmField.value = "";
    btnSavePassword.textContent = "Save password";
    btnSavePassword.removeAttribute("disabled");
    btnSavePassword.style.cursor = "pointer";
  });
}

if (logoutBtn) logoutBtn.addEventListener("click", logout);

if (bookTourBtn) {
  const { tourId } = bookTourBtn.dataset;
  bookTourBtn.addEventListener("click", bookTour.bind(null, tourId));
}
