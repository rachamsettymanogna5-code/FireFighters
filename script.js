let map;
let marker;

window.addEventListener("load", () => {
  map = L.map("map").setView([17.385, 78.4867], 13);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  marker = L.marker([17.385, 78.4867]).addTo(map);

  document.getElementById("searchForm").addEventListener(
    "submit", searchLocation
  );

  document.getElementById("gpsBtn").addEventListener(
    "click", useGPS
  );

  document.getElementById("floorPlan").addEventListener(
    "change", uploadFloorPlan
  );
});

function showLocation(lat, lon, name) {
  map.setView([lat, lon], 18);
  marker.setLatLng([lat, lon])
    .bindPopup(name)
    .openPopup();

  document.getElementById("message").textContent =
    "Location found: " + name;

  document.getElementById("coordinates").textContent =
    "Coordinates: " + lat.toFixed(6) + ", " +
    lon.toFixed(6);

  document.getElementById("buildingInfo").textContent =
    name + " — upload its floor plan to view indoor rooms.";
}

async function searchLocation(event) {
  event.preventDefault();

  const input = document
    .getElementById("locationInput")
    .value.trim();

  const message = document.getElementById("message");
  message.textContent = "Searching location...";

  // Try multiple search phrases
  const queries = [
    input,
    input + ", Andhra Pradesh, India"
  ];

  try {
    let place = null;

    for (const query of queries) {
      const url = new URL(
        "https://nominatim.openstreetmap.org/search"
      );

      url.searchParams.set("q", query);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "5");
      url.searchParams.set("countrycodes", "in");

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Location service unavailable");
      }

      const results = await response.json();

      if (results.length > 0) {
        // Prefer a result whose name resembles the search
        place = results.find(item =>
          item.display_name.toLowerCase().includes(
            input.split(",")[0].toLowerCase()
          )
        ) || results[0];

        break;
      }
    }

    if (!place) {
      message.textContent =
        "Place not found. Try the college name with city and state.";
      return;
    }

    showLocation(
      Number(place.lat),
      Number(place.lon),
      place.display_name
    );

  } catch (error) {
    message.textContent =
      "Search failed. Check internet and try again.";
    console.error(error);
  }
}
function useGPS() {
  if (!navigator.geolocation) {
    alert("GPS location is not supported by this browser.");
    return;
  }

  document.getElementById("message").textContent =
    "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    position => {
      showLocation(
        position.coords.latitude,
        position.coords.longitude,
        "Current GPS location"
      );
    },
    () => {
      document.getElementById("message").textContent =
        "Location permission denied or GPS unavailable.";
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

function uploadFloorPlan(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select a floor-plan image.");
    event.target.value = "";
    return;
  }

  const image = document.getElementById("floorImage");

  if (image.dataset.objectUrl) {
    URL.revokeObjectURL(image.dataset.objectUrl);
  }

  const objectUrl = URL.createObjectURL(file);
  image.src = objectUrl;
  image.dataset.objectUrl = objectUrl;
  image.style.display = "block";
}

// Real heart-rate and person-detection data must come
// from connected, tested sensors or a detection system.