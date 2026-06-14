const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 5000;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

app.use(cors());
app.use(express.json());

let firebaseEnabled = false;
let db = null;
const vehicleMemoryStore = [];
const freeCoatingMemoryStore = [];

function hasFirebaseCredentials() {
  return Boolean(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY);
}

function getFirebasePrivateKey() {
  return FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
}

function normalizeVehiclePayload(payload) {
  return {
    customerName: String(payload.customerName || "").trim(),
    mobileNumber: String(payload.mobileNumber || "").trim(),
    vehicleNumber: String(payload.vehicleNumber || "").trim(),
    vehicleModel: String(payload.vehicleModel || "").trim(),
    work: String(payload.work || "").trim(),
    status: payload.status === "Completed" ? "Completed" : "Pending",
  };
}

function normalizeFreeCoatingPayload(payload) {
  return {
    name: String(payload.name || "").trim(),
    mobile: String(payload.mobile || "").trim(),
    vehicle: String(payload.vehicle || "").trim(),
    model: String(payload.model || "").trim(),
    nextVisit: String(payload.nextVisit || "").trim(),
    done: Boolean(payload.done),
  };
}

function validateRequiredFields(payload, fields) {
  const missingField = fields.find((field) => !payload[field]);

  if (missingField) {
    return `Missing required field: ${missingField}`;
  }

  return null;
}

async function connectDatabase() {
  if (!hasFirebaseCredentials()) {
    console.log("Firebase connection skipped. Set FIREBASE_* environment variables to enable persistence.");
    return;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: getFirebasePrivateKey(),
        }),
      });
    }

    db = admin.firestore();
    firebaseEnabled = true;
    console.log("Firebase connected");
  } catch (error) {
    console.error("Firebase connection failed. Falling back to in-memory storage.");
    console.error(error.message);
  }
}

app.get("/", (_req, res) => {
  res.json({
    message: "Car Care backend is running",
    firebaseEnabled,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    firebaseEnabled,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/vehicles", async (_req, res) => {
  if (firebaseEnabled) {
    const snapshot = await db.collection("vehicles").orderBy("createdAt", "desc").get();
    const vehicles = snapshot.docs.map((doc) => doc.data());
    return res.json(vehicles);
  }

  return res.json(vehicleMemoryStore);
});

app.post("/api/vehicles", async (req, res) => {
  const normalizedVehicle = normalizeVehiclePayload(req.body);
  const validationError = validateRequiredFields(normalizedVehicle, [
    "customerName",
    "mobileNumber",
    "vehicleNumber",
    "vehicleModel",
    "work",
  ]);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const vehicle = {
    ...normalizedVehicle,
    id: String(req.body.id || crypto.randomUUID()),
    createdAt: req.body.createdAt || new Date().toISOString(),
  };

  if (firebaseEnabled) {
    await db.collection("vehicles").doc(vehicle.id).set(vehicle);
    return res.status(201).json(vehicle);
  }

  vehicleMemoryStore.unshift(vehicle);
  return res.status(201).json(vehicle);
});

app.get("/api/free-coating", async (_req, res) => {
  if (firebaseEnabled) {
    const snapshot = await db.collection("freeCoating").orderBy("createdAt", "desc").get();
    const records = snapshot.docs.map((doc) => doc.data());
    return res.json(records);
  }

  return res.json(freeCoatingMemoryStore);
});

app.post("/api/free-coating", async (req, res) => {
  const normalizedRecord = normalizeFreeCoatingPayload(req.body);
  const validationError = validateRequiredFields(normalizedRecord, ["name", "mobile", "vehicle", "model"]);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const record = {
    ...normalizedRecord,
    id: String(req.body.id || crypto.randomUUID()),
    createdAt: req.body.createdAt || new Date().toISOString(),
  };

  if (firebaseEnabled) {
    await db.collection("freeCoating").doc(record.id).set(record);
    return res.status(201).json(record);
  }

  freeCoatingMemoryStore.unshift(record);
  return res.status(201).json(record);
});

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
