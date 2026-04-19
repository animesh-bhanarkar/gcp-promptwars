const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Data Store (Lightweight)
let state = {
  demoMode: false,
  zones: {
    A: { id: 'A', name: 'Zone A', crowd: 'Low' },
    B: { id: 'B', name: 'Zone B', crowd: 'Medium' },
    C: { id: 'C', name: 'Zone C', crowd: 'High' },
    D: { id: 'D', name: 'Zone D', crowd: 'Low' }
  },
  queues: {
    Gate1: { id: 'Gate1', name: 'Gate 1', type: 'Gate', time: 5 },
    Gate2: { id: 'Gate2', name: 'Gate 2', type: 'Gate', time: 15 },
    FoodA: { id: 'FoodA', name: 'Food A', type: 'Food', time: 10 },
    FoodB: { id: 'FoodB', name: 'Food B', type: 'Food', time: 2 }
  }
};

// Simplified Venue Graph for Routing
const venueGraph = {
  Gate1: ['A'],
  Gate2: ['B'],
  A: ['Gate1', 'B', 'C', 'FoodA'],
  B: ['Gate2', 'A', 'D', 'FoodB'],
  C: ['A', 'D', 'Seat'],
  D: ['B', 'C', 'Seat'],
  FoodA: ['A'],
  FoodB: ['B'],
  Seat: ['C', 'D']
};

/**
 * Helper: Find shortest path using BFS.
 * Optional filter to exclude specific nodes (e.g., highly crowded zones).
 */
function findShortestPath(start, end, excludeNodes = []) {
  const queue = [[start]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === end) {
      return path;
    }

    const neighbors = venueGraph[node] || [];
    for (let neighbor of neighbors) {
      if (!visited.has(neighbor) && !excludeNodes.includes(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null; // No path found
}

/**
 * Route Suggestion Logic
 */
app.get('/route', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from/to parameters' });
  }

  // Find high crowd zones to avoid
  const highCrowdZones = Object.values(state.zones)
    .filter(z => z.crowd === 'High')
    .map(z => z.id);

  // Try to find path avoiding High crowd zones
  let path = findShortestPath(from, to, highCrowdZones);
  
  // If no path avoiding High crowd, fall back to any path
  if (!path) {
    path = findShortestPath(from, to, []);
  }

  res.json({ route: path });
});

// API Endpoints
app.get('/zones', (req, res) => {
  res.json(Object.values(state.zones));
});

app.get('/queues', (req, res) => {
  res.json(Object.values(state.queues));
});

app.get('/state', (req, res) => {
  res.json(state);
});

// Admin update endpoint
app.post('/update', (req, res) => {
  const { type, id, updateData } = req.body;
  if (!type || !id || !updateData) return res.status(400).json({ error: 'Invalid payload' });

  if (type === 'zone' && state.zones[id]) {
    state.zones[id] = { ...state.zones[id], ...updateData };
  } else if (type === 'queue' && state.queues[id]) {
    state.queues[id] = { ...state.queues[id], ...updateData };
  } else if (type === 'system') {
    if (updateData.demoMode !== undefined) {
      state.demoMode = updateData.demoMode;
    }
  } else {
    return res.status(404).json({ error: 'Entity not found' });
  }
  res.json({ success: true, state });
});

// Best Option Endpoint
app.get('/best-option', (req, res) => {
  // Find shortest queue for Gates
  const gates = Object.values(state.queues).filter(q => q.type === 'Gate');
  const bestGate = gates.reduce((prev, curr) => (curr.time < prev.time ? curr : prev));

  // Find shortest queue for Food
  const foods = Object.values(state.queues).filter(q => q.type === 'Food');
  const bestFood = foods.reduce((prev, curr) => (curr.time < prev.time ? curr : prev));

  res.json({
    bestGate,
    bestFood
  });
});

// Hybrid Auto-Randomization (Demo Mode)
setInterval(() => {
  if (state.demoMode) {
    // Randomize queue times slightly
    Object.keys(state.queues).forEach(key => {
      let change = Math.floor(Math.random() * 5) - 2; // -2 to +2
      let newTime = Math.max(1, state.queues[key].time + change);
      state.queues[key].time = newTime;
    });

    // Occasionally change a zone's crowd level
    if (Math.random() > 0.7) {
      const zoneIds = Object.keys(state.zones);
      const randomZone = zoneIds[Math.floor(Math.random() * zoneIds.length)];
      const levels = ['Low', 'Medium', 'High'];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      state.zones[randomZone].crowd = randomLevel;
    }
  }
}, 5000); // Check every 5 seconds for demo updates

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`SmartVenue Lite running on port ${PORT}`);
});
