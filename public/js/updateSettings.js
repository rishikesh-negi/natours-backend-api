import axios from "axios";
import { showAlert } from "./alerts";

export async function updateUserData(name, email) {
  try {
    const res = await axios({
      method: "PATCH",
      url: "http://localhost:8000/api/v1/users/updateMe",
      data: {
        name,
        email,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Account updated successfully");
    }
  } catch (err) {
    showAlert("error", "Unable to update your account");
  }
}
