import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import { alerts, inventory, recommendations, usageData } from './data.js';

const PORT = Number(process.env.PORT || 8001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const dbPath = path.join(__dirname, 'db.json');
const seedData = { inventory, alerts, recommendations, usageData };

const loadDatabase = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2));
    return structuredClone(seedData);
  }

  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const database = loadDatabase();
let nextInventoryId = Math.max(0, ...database.inventory.map(item => item.id)) + 1;

const saveDatabase = () => {
  fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
};

const send = (res, status, data) => {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
};

const sendText = (res, status, content, contentType, includeBody = true) => {
  res.writeHead(status, {
    'Content-Type': contentType,
  });
  res.end(includeBody ? content : undefined);
};

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const serveStatic = (pathname, res, includeBody = true) => {
  if (!fs.existsSync(distDir)) {
    return send(res, 404, { message: 'Build the website first with npm run build' });
  }

  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(distDir, requestedPath));

  if (!filePath.startsWith(distDir)) {
    return send(res, 403, { message: 'Forbidden' });
  }

  const targetPath = fs.existsSync(filePath) && fs.statSync(filePath).isFile()
    ? filePath
    : path.join(distDir, 'index.html');
  const extension = path.extname(targetPath);
  return sendText(res, 200, fs.readFileSync(targetPath), mimeTypes[extension] || 'application/octet-stream', includeBody);
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1_000_000) req.destroy();
  });
  req.on('end', () => {
    if (!body) return resolve({});
    try {
      resolve(JSON.parse(body));
    } catch (error) {
      reject(error);
    }
  });
});

const daysUntil = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((date - today) / 86400000));
};

const calculateStatus = ({ available, required, status }) => {
  if (status) return status;
  if (available <= 20 || available < required * 0.35) return 'Critical';
  if (available < required) return 'Warning';
  return 'Healthy';
};

const normalizeInventoryPayload = (payload, existing = {}) => {
  const available = Number(payload.available ?? payload.units ?? existing.available ?? 0);
  const used = Number(payload.used ?? existing.used ?? 0);
  const required = Number(payload.required ?? existing.required ?? Math.max(available, 80));

  return {
    ...existing,
    group: payload.group ?? existing.group,
    available,
    used,
    required,
    expiry: payload.expiry ?? existing.expiry ?? '',
    days: payload.days ?? daysUntil(payload.expiry),
    predicted: Number(payload.predicted ?? existing.predicted ?? Math.round(required * 0.8)),
    status: calculateStatus({ available, required, status: payload.status }),
    bank: payload.bank ?? existing.bank ?? 'CityCare Central Blood Bank',
    batch: payload.batch ?? existing.batch ?? `CC-${Date.now()}`,
    collection: payload.collection ?? existing.collection ?? '',
  };
};

const buildReports = () => {
  const totalStock = database.inventory.reduce((sum, item) => sum + item.available + item.used, 0);
  const availableUnits = database.inventory.reduce((sum, item) => sum + item.available, 0);
  const usedUnits = database.inventory.reduce((sum, item) => sum + item.used, 0);
  const predictedDemand = database.inventory.reduce((sum, item) => sum + item.predicted, 0);
  const expiringSoon = database.inventory.filter(item => item.days <= 7).reduce((sum, item) => sum + Math.min(item.available, 12), 0);

  return {
    totalStock,
    availableUnits,
    usedUnits,
    predictedDemand,
    lowStockGroups: database.inventory.filter(item => item.status !== 'Healthy').length,
    expiringSoon,
    wastageRate: totalStock ? Number(((11 / totalStock) * 100).toFixed(1)) : 0,
    stockByGroup: database.inventory,
    usageData: database.usageData,
  };
};

const getForecast = (group) => {
  const item = database.inventory.find(record => record.group.toLowerCase() === decodeURIComponent(group).toLowerCase());
  if (!item) return null;

  return {
    group: item.group,
    currentStock: item.available,
    expectedDemand: item.predicted,
    projectedGap: Math.max(0, item.predicted - item.available),
    recommendedRestock: item.predicted > item.available ? Math.max(35, item.predicted - item.available + 10) : 0,
    confidence: 94,
    trend: database.usageData,
  };
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const isApiRoute = url.pathname === '/api' || url.pathname.startsWith('/api/');
  const path = isApiRoute ? url.pathname.replace(/^\/api/, '') || '/' : url.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (!isApiRoute && (req.method === 'GET' || req.method === 'HEAD')) return serveStatic(url.pathname, res, req.method === 'GET');

  if (req.method === 'GET' && path === '/') return send(res, 200, { name: 'BloodAI API', status: 'ok' });
  if (req.method === 'GET' && path === '/health') return send(res, 200, { status: 'ok' });
  if (req.method === 'GET' && path === '/inventory') return send(res, 200, database.inventory);
  if (req.method === 'GET' && path === '/alerts') return send(res, 200, database.alerts);
  if (req.method === 'GET' && path === '/recommendations') return send(res, 200, database.recommendations);
  if (req.method === 'GET' && path === '/reports') return send(res, 200, buildReports());

  if (req.method === 'GET' && path.startsWith('/forecast/')) {
    const forecast = getForecast(path.split('/').pop());
    return forecast ? send(res, 200, forecast) : send(res, 404, { message: 'Blood group not found' });
  }

  if (req.method === 'POST' && path === '/inventory') {
    try {
      const payload = await readBody(req);
      if (!payload.group || !Number(payload.available ?? payload.units)) {
        return send(res, 400, { message: 'Blood group and units are required' });
      }
      const item = { id: nextInventoryId++, ...normalizeInventoryPayload(payload) };
      database.inventory.push(item);
      saveDatabase();
      return send(res, 201, item);
    } catch {
      return send(res, 400, { message: 'Invalid JSON body' });
    }
  }

  if ((req.method === 'PUT' || req.method === 'DELETE') && path.startsWith('/inventory/')) {
    const id = Number(path.split('/').pop());
    const index = database.inventory.findIndex(item => item.id === id);
    if (index === -1) return send(res, 404, { message: 'Inventory record not found' });

    if (req.method === 'DELETE') {
      const [deleted] = database.inventory.splice(index, 1);
      saveDatabase();
      return send(res, 200, deleted);
    }

    try {
      const payload = await readBody(req);
      database.inventory[index] = normalizeInventoryPayload(payload, database.inventory[index]);
      saveDatabase();
      return send(res, 200, database.inventory[index]);
    } catch {
      return send(res, 400, { message: 'Invalid JSON body' });
    }
  }

  return send(res, 404, { message: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`BloodAI website running at http://127.0.0.1:${PORT}`);
  console.log(`BloodAI API running at http://127.0.0.1:${PORT}/api`);
});
