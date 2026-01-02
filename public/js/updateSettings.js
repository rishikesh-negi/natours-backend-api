import axios from "axios";
import { showAlert } from "./alerts";

// "type" can be "password" or "data":
export async function updateSettings(data, type) {
  try {
    const url =
      type === "password"
        ? "/api/v1/users/updateMyPassword"
        : "/api/v1/users/updateMe";

    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert("error", `Unable to update your ${type}`);
  }
}
