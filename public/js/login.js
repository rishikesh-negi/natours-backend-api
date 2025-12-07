/* eslint-disable */
import "@babel/polyfill";
import axios from "axios";
import { showAlert } from "./alerts";

export const login = async function (email, password) {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:8000/api/v1/users/login",
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
