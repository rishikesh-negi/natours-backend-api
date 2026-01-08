/* eslint-disable */

// "type" is "success" or "error".
export function showAlert(type, msg, alertDurationSeconds = null) {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
  window.setTimeout(hideAlert, Math.abs(alertDurationSeconds) * 1000 || 5000);
}

export function hideAlert() {
  const alert = document.querySelector(".alert");
  if (alert) alert.parentElement.removeChild(alert);
}
