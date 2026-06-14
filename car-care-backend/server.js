const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const vehicleSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    vehicleNumber: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, trim: true },
    work: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

const freeCoatingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    vehicle: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    nextVisit: { type: String, default: "" },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
const FreeCoating = mongoose.models.FreeCoating || mongoose.model("FreeCoating", freeCoatingSchema);

let mongoEnabled = false;
const vehicleMemoryStore = [];
const freeCoatingMemoryStore = [];

async function connectDatabase() {
  if (!MONGODB_URI) {
    console.log("MongoDB connection skipped. Set MONGODB_URI to enable persistence.");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    mongoEnabled = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed. Falling back to in-memory storage.");
    console.error(error.message);
  }
}

app.get("/", (_req, res) => {
  res.json({
    message: "Car Care backend is running",
    mongoEnabled,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    mongoEnabled,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/vehicles", async (_req, res) => {
  if (mongoEnabled) {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
    return res.json(vehicles);
  }

  return res.json(vehicleMemoryStore);
});

app.post("/api/vehicles", async (req, res) => {
  if (mongoEnabled) {
    const createdVehicle = await Vehicle.create(req.body);
    return res.status(201).json(createdVehicle);
  }

  const vehicle = {
    ...req.body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  vehicleMemoryStore.unshift(vehicle);
  return res.status(201).json(vehicle);
});

app.get("/api/free-coating", async (_req, res) => {
  if (mongoEnabled) {
    const records = await FreeCoating.find().sort({ createdAt: -1 }).lean();
    return res.json(records);
  }

  return res.json(freeCoatingMemoryStore);
});

app.post("/api/free-coating", async (req, res) => {
  if (mongoEnabled) {
    const createdRecord = await FreeCoating.create(req.body);
    return res.status(201).json(createdRecord);
  }

  const record = {
    ...req.body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  freeCoatingMemoryStore.unshift(record);
  return res.status(201).json(record);
});

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
