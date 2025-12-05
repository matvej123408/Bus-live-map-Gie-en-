// main.js - demo simulation PWA
const map = L.map('map').setView([50.587, 8.676], 13); // центр Гиссена
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Create a simple SVG bus icon as a Leaflet divIcon
const busHtml = `
  <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="12" rx="2" ry="2" fill="#0078a8"/>
    <circle cx="7" cy="18" r="1.5" fill="#333"/>
    <circle cx="17" cy="18" r="1.5" fill="#333"/>
  </svg>
`;
const busIcon = L.divIcon({
  html: busHtml,
  className: '',
  iconSize: [32,32],
  iconAnchor: [16,16]
});

const vehicles = {};
let simulationData = null;
let simTimer = null;

const startBtn = document.getElementById('startSim');
const stopBtn = document.getElementById('stopSim');
startBtn.addEventListener('click', startSimulation);
stopBtn.addEventListener('click', stopSimulation);

function stopSimulation() {
  if (simTimer) { clearInterval(simTimer); simTimer = null; }
  Object.values(vehicles).forEach(v=> { if (v.marker) map.removeLayer(v.marker); });
  Object.keys(vehicles).forEach(k=> delete vehicles[k]);
}

function startSimulation() {
  stopSimulation();
  simulationData = demoSimulationData();
  const poly = L.polyline(simulationData.route, {}).addTo(map);
  map.fitBounds(poly.getBounds(), {padding:[40,40]});

  simulationData.trips.forEach(t => {
    const initial = simulationData.route[0];
    vehicles[t.id] = {
      marker: L.marker(initial, {icon: busIcon}).addTo(map).bindPopup(`${simulationData.line} ${t.id}`)
    };
  });

  simTimer = setInterval(simulationTick, 1000);
}

function simulationTick() {
  const now = new Date();
  simulationData.trips.forEach(t => {
    const markerObj = vehicles[t.id];
    if (!markerObj) return;
    const start = new Date(t.startTime);
    const elapsed = (now - start) / 1000;
    if (elapsed < 0) {
      markerObj.marker.setLatLng(simulationData.route[0]);
    } else if (elapsed > t.duration) {
      markerObj.marker.setLatLng(simulationData.route[simulationData.route.length-1]);
    } else {
      const frac = elapsed / t.duration;
      const pos = interpolateAlongRoute(simulationData.route, frac);
      markerObj.marker.setLatLng(pos);
      markerObj.marker.setPopupContent(`${simulationData.line} ${t.id}<br>${Math.max(0, Math.round(t.duration - elapsed))}s left`);
    }
  });
}

function interpolateAlongRoute(route, frac) {
  if (frac <= 0) return route[0];
  if (frac >= 1) return route[route.length-1];
  const dists = [0];
  let total = 0;
  for (let i=1;i<route.length;i++) {
    const a = route[i-1], b = route[i];
    const seg = map.distance(a,b);
    total += seg;
    dists.push(total);
  }
  const target = frac * total;
  for (let i=1;i<dists.length;i++) {
    if (target <= dists[i]) {
      const segLen = dists[i] - dists[i-1];
      const segFrac = (target - dists[i-1]) / segLen;
      const [lat1,lon1] = route[i-1];
      const [lat2,lon2] = route[i];
      return [
        lat1 + (lat2-lat1)*segFrac,
        lon1 + (lon2-lon1)*segFrac
      ];
    }
  }
  return route[route.length-1];
}

function demoSimulationData() {
  const route = [
    [50.5858, 8.6762],
    [50.5872, 8.6800],
    [50.5890, 8.6830],
    [50.5910, 8.6840],
    [50.5930, 8.6850]
  ];
  const now = new Date();
  const trips = [];
  for (let i=0;i<4;i++) {
    const start = new Date(now.getTime() + i*90*1000); // каждые 90 секунд
    trips.push({id:`trip${i+1}`, startTime: start.toISOString(), duration: 6*60}); // 6 минут
  }
  return {route, trips, line: 'Line 1 (demo)'};
}
