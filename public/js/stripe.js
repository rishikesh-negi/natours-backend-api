import axios from "axios";
import { showAlert } from "./alerts";

const { loadStripe } = require("@stripe/stripe-js");

const stripePromise = loadStripe(
  "pk_test_51SiD2qPuVwn1MptjjGjuVSrEQeT5L7n84xOoIywg3YYmcsMfJwyJtwRzumSrFnl0I1o8IFHJvhJ8Wlvxx5KaoPir005bHYXYub",
);

export async function bookTour(tourId) {
  try {
    // 1) Get the checkout session from the API endpoint:
    const {
      data: { session },
    } = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + charge credit card:
    window.location.assign(session.url);
  } catch (err) {
    console.error(err);
    showAlert("error", err.message);
  }
}
