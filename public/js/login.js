/* eslint-disable */
import "@babel/polyfill";
import axios from "axios";
import { hideAlert, showAlert } from "./alerts";

export const login = async function (email, password) {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Login successful!");
      window.location.assign("/");
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async function () {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged out successfully!");
      window.location.assign("/");
    }
  } catch (err) {
    showAlert("error", "Error logging out! Try again.");
  }
};
