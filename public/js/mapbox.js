/* eslint-disable */

export function displayMap(locations) {
  let map = L.map("map", {
    zoomControl: false,
    doubleClickZoom: false,
    touchZoom: false,
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: false,
  });

  L.tileLayer(
    "https://tile.jawg.io/jawg-dark/{z}/{x}/{y}.png?access-token=uGkxLCfU6wodLu1gtpKsLSKfX5vgf8zVrtofF8LkKmNGBIgCnMBxTLMwYTyTDepN",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: "",
    },
  ).addTo(map);

  const points = [];

  const customIcon = L.icon({
    iconUrl: "../img/pin.png",
    iconSize: [32, 40],
  });

  locations.forEach((loc) => {
    points.push([loc.coordinates[1], loc.coordinates[0]]);

    const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], {
      icon: customIcon,
    }).addTo(map);

    marker.bindPopup(
      `<p style='font-size: 12px; font-weight: 600'>Day ${loc.day}: ${loc.description}</p>`,
      {
        autoClose: false,
        closeButton: false,
      },
    );

    marker.openPopup();
  });

  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);

  map.scrollWheelZoom.disable();
}
