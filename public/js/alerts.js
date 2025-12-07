/* eslint-disable */

// "type" is "success" or "error".
export function showAlert(type, msg) {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
  window.setTimeout(hideAlert, 5000);
}

export function hideAlert() {
  const alert = document.querySelector(".alert");
  if (alert) alert.parentElement.removeChild(alert);
}
