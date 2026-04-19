const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:8080' 
  : ''; // Use relative in prod

let currentRoute = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker registered'))
      .catch(err => console.log('SW registration failed:', err));
  }
});

function initApp() {
  fetchData();
  // Poll every 10 seconds
  setInterval(fetchData, 10000);
  
  document.getElementById('find-route-btn').addEventListener('click', findRoute);
  document.getElementById('user-zone').addEventListener('change', highlightUserZone);
}

async function fetchData() {
  try {
    const [stateRes, bestOptionRes] = await Promise.all([
      fetch(`${API_BASE}/state`),
      fetch(`${API_BASE}/best-option`)
    ]);

    if (!stateRes.ok) throw new Error('Offline or Network Error');
    const state = await stateRes.json();
    const bestOption = await bestOptionRes.json();

    updateNetworkStatus(true);
    updateMap(state.zones);
    updateQueues(state.queues);
    updateBestOption(bestOption);
    processAlerts(state);

  } catch (error) {
    console.warn('Using cached data if available', error);
    updateNetworkStatus(false);
  }
}

function updateNetworkStatus(isOnline) {
  const indicator = document.getElementById('network-status');
  if (isOnline) {
    indicator.textContent = 'Online';
    indicator.className = 'status-indicator online';
  } else {
    indicator.textContent = 'Offline Mode';
    indicator.className = 'status-indicator offline';
  }
}

function updateMap(zones) {
  // Clear old classes
  document.querySelectorAll('.svg-node.zone').forEach(el => {
    el.classList.remove('node-low', 'node-med', 'node-high');
  });

  // Apply new crowds
  Object.values(zones).forEach(zone => {
    const node = document.getElementById(`node-${zone.id}`);
    if (node) {
      if (zone.crowd === 'Low') node.classList.add('node-low');
      else if (zone.crowd === 'Medium') node.classList.add('node-med');
      else if (zone.crowd === 'High') node.classList.add('node-high');
    }
  });
  
  highlightUserZone();
  reapplyRouteHighlight();
}

function updateQueues(queues) {
  const container = document.getElementById('queues-list');
  container.innerHTML = '';
  
  Object.values(queues).forEach(q => {
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.innerHTML = `
      <span class="queue-name">${q.name}</span>
      <span class="queue-time">${q.time} min</span>
    `;
    container.appendChild(div);
  });
}

function updateBestOption({ bestGate, bestFood }) {
  document.getElementById('best-gate').textContent = bestGate ? `${bestGate.name} (${bestGate.time}m)` : '--';
  document.getElementById('best-food').textContent = bestFood ? `${bestFood.name} (${bestFood.time}m)` : '--';
}

function processAlerts(state) {
  const container = document.getElementById('alerts');
  container.innerHTML = ''; // clear

  const highZones = Object.values(state.zones).filter(z => z.crowd === 'High');
  if (highZones.length > 0) {
    const names = highZones.map(z => z.name).join(', ');
    const div = document.createElement('div');
    div.className = 'alert-banner';
    div.innerHTML = `⚠️ High crowd detected in ${names}. Please avoid these zones.`;
    container.appendChild(div);
  }
}

function highlightUserZone() {
  // Clear existing
  document.querySelectorAll('.node-user').forEach(el => el.classList.remove('node-user'));
  
  const zoneId = document.getElementById('user-zone').value;
  if (zoneId !== 'None') {
    const node = document.getElementById(`node-${zoneId}`);
    if (node) {
      node.classList.add('node-user');
    }
  }
}

async function findRoute() {
  const from = document.getElementById('route-from').value;
  const to = document.getElementById('route-to').value;
  
  if (from === to) {
    document.getElementById('route-result').textContent = 'You are already there!';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/route?from=${from}&to=${to}`);
    if (!res.ok) throw new Error('Failed to fetch route');
    const data = await res.json();

    if (data.route) {
      currentRoute = data.route;
      document.getElementById('route-result').textContent = `Suggested Path: ${data.route.join(' ➔ ')}`;
      reapplyRouteHighlight();
    } else {
      document.getElementById('route-result').textContent = `No available paths right now.`;
    }
  } catch (error) {
    console.error(error);
    document.getElementById('route-result').textContent = `Error fetching route in Offline Mode.`;
  }
}

function reapplyRouteHighlight() {
  // Clear previous route
  document.querySelectorAll('.route-path').forEach(el => el.classList.remove('route-path'));

  // Highlight new route nodes
  currentRoute.forEach(nodeId => {
    const node = document.getElementById(`node-${nodeId}`);
    if (node) {
      node.classList.add('route-path');
    }
  });
}
