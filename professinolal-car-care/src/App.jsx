import { forwardRef, useEffect, useMemo, useRef, useState, useDeferredValue, startTransition } from "react";
import { db, collection, addDoc } from "./firebase";
const STORAGE_KEYS = {
  entered: "carcare-entered",
  vehicles: "carcare-vehicles",
  bills: "carcare-bills",
  quotations: "carcare-quotations",
  freeCoating: "carcare-free-coating",
  settings: "carcare-settings",
  billCounter: "carcare-bill-counter",
};

const defaultSettings = {
  companyName: "Professional Car Care",
  tagline: "Premium workshop management",
  ownerName: "Workshop Owner",
  ownerMobile: "",
  ownerEmail: "",
  greyMode: false,
  address: "Detailing bay, service lane, city center",
};

const defaultVehicleForm = {
  customerName: "",
  mobileNumber: "",
  vehicleNumber: "",
  vehicleModel: "",
  work: "",
  status: "Pending",
};

const defaultCoatingForm = {
  name: "",
  mobile: "",
  vehicle: "",
  model: "",
  done: false,
  nextVisit: "",
};

const defaultCustomer = {
  customer: "",
  mobile: "",
  vehicle: "",
  model: "",
};

const serviceOptions = [
  "Body Coating",
  "Interior Cleaning",
  "Under Body Coating",
  "Ceramic Coating",
  "PPF",
  "Rubbing & Polishing",
  "AC Cleaning",
  "Foam Wash",
];

const navigation = [
  { id: "dashboard", label: "Dashboard" },
  { id: "vehicle", label: "Vehicle Desk" },
  { id: "salesCoating", label: "Sales Coating" },
  { id: "quotation", label: "Quotation" },
  { id: "billing", label: "Billing" },
  { id: "settings", label: "Settings" },
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDocumentNumber(prefix, counter) {
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}

function createLineItems(count) {
  return Array.from({ length: count }, () => ({ description: "", amount: "" }));
}

async function readRemoteCollection(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return response.json();
}

async function writeRemoteRecord(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return response.json();
}

function PreviewCard({ title, subtitle, children, actions }) {
  return (
    <div className="preview-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h3>{title}</h3>
        </div>
        {actions ? <div className="action-row compact">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

function App() {
  const [entered, setEntered] = useState(() => safeRead(STORAGE_KEYS.entered, false));
  const [activePage, setActivePage] = useState("dashboard");
  const [vehicles, setVehicles] = useState(() => safeRead(STORAGE_KEYS.vehicles, []));
  const [freeCoating, setFreeCoating] = useState(() => safeRead(STORAGE_KEYS.freeCoating, []));
  const [bills, setBills] = useState(() => safeRead(STORAGE_KEYS.bills, []));
  const [quotations, setQuotations] = useState(() => safeRead(STORAGE_KEYS.quotations, []));
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...safeRead(STORAGE_KEYS.settings, {}) }));
  const [billCounter, setBillCounter] = useState(() => safeRead(STORAGE_KEYS.billCounter, 1));
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [vehicleForm, setVehicleForm] = useState(defaultVehicleForm);
  const [coatingForm, setCoatingForm] = useState(defaultCoatingForm);
  const [billCustomer, setBillCustomer] = useState(defaultCustomer);
  const [quotationCustomer, setQuotationCustomer] = useState(defaultCustomer);
  const [billItems, setBillItems] = useState(() => createLineItems(3));
  const [quotationItems, setQuotationItems] = useState(() => createLineItems(5));
  const [salesRecords, setSalesRecords] = useState([]);
  const filteredSalesRecords = salesRecords.filter(
  (record) =>
    record.customer?.toLowerCase().includes(search.toLowerCase()) ||
    record.vehicle?.toLowerCase().includes(search.toLowerCase())
);
  const [billPreview, setBillPreview] = useState(null);
  const [quotationPreview, setQuotationPreview] = useState(null);
  const billPreviewRef = useRef(null);
  const quotationPreviewRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.entered, JSON.stringify(entered));
  }, [entered]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.freeCoating, JSON.stringify(freeCoating));
  }, [freeCoating]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bills, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.quotations, JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.billCounter, JSON.stringify(billCounter));
  }, [billCounter]);

  useEffect(() => {
    document.body.classList.toggle("grey-mode", settings.greyMode);
  }, [settings.greyMode]);

  useEffect(() => {
    let ignore = false;

    async function hydrateFromApi() {
      try {
        const [remoteVehicles, remoteCoating] = await Promise.all([
          readRemoteCollection("/api/vehicles"),
          readRemoteCollection("/api/free-coating"),
        ]);

        if (!ignore) {
          setVehicles((current) => (remoteVehicles.length ? remoteVehicles : current));
          setFreeCoating((current) => (remoteCoating.length ? remoteCoating : current));
        }
      } catch {
        // Keep the local-first experience when the API is not running.
      }
    }

    hydrateFromApi();

    return () => {
      ignore = true;
    };
  }, []);

  const dashboardStats = useMemo(() => {
    const pendingVehicles = vehicles.filter((vehicle) => vehicle.status === "Pending").length;
    const completedVehicles = vehicles.filter((vehicle) => vehicle.status === "Completed").length;
    const coatingPending = freeCoating.filter((record) => !record.done).length;
    const activeRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);

    return [
      { label: "Vehicles Logged", value: vehicles.length, tone: "gold" },
      { label: "Pending Jobs", value: pendingVehicles, tone: "orange" },
      { label: "Completed Jobs", value: completedVehicles, tone: "green" },
      { label: "Free Coating Due", value: coatingPending, tone: "blue" },
      { label: "Invoices Issued", value: bills.length, tone: "pink" },
      { label: "Revenue Tracked", value: formatCurrency(activeRevenue), tone: "violet" },
    ];
  }, [bills, freeCoating, vehicles]);

  const activeNav = navigation.find((item) => item.id === activePage);

  const filteredVehicles = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return vehicles;
    }

    return vehicles.filter((vehicle) =>
      [vehicle.customerName, vehicle.mobileNumber, vehicle.vehicleNumber, vehicle.vehicleModel, vehicle.work]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [deferredSearch, vehicles]);

  const recentBills = useMemo(() => [...bills].slice(-3).reverse(), [bills]);
  const upcomingCoating = useMemo(
  () =>
    salesRecords
      .filter((record) => !record.freeCoatingDone)
      .slice(0, 4),
  [salesRecords]
);

  function handleVehicleChange(event) {
    const { name, value } = event.target;
    setVehicleForm((current) => ({ ...current, [name]: value }));
  }

  function handleCoatingChange(event) {
    const { name, type, value, checked } = event.target;
    setCoatingForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function handleCustomerChange(event, setter) {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  }

  function handleLineItemChange(index, field, value, setter) {
    setter((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSaveVehicle(event) {
    event.preventDefault();

    const nextVehicle = {
      ...vehicleForm,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    try {
      const createdVehicle = await writeRemoteRecord("/api/vehicles", nextVehicle);
      setVehicles((current) => [createdVehicle, ...current.filter((vehicle) => vehicle.id !== createdVehicle.id)]);
    } catch {
      setVehicles((current) => [nextVehicle, ...current]);
    }

    setVehicleForm(defaultVehicleForm);

    startTransition(() => {
      setActivePage("dashboard");
    });
  }

  async function handleSaveFreeCoating(event) {
    event.preventDefault();

    const record = {
      ...coatingForm,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };


    setCoatingForm(defaultCoatingForm);

    setCoatingForm(defaultCoatingForm);
  }

  function buildPreview(prefix, counter, customer, items, type) {
    const validItems = items
      .map((item) => ({
        description: item.description.trim(),
        amount: Number(item.amount) || 0,
      }))
      .filter((item) => item.description);

    const total = validItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      id: buildDocumentNumber(prefix, counter),
      type,
      date: new Date().toISOString(),
      customer,
      items: validItems,
      total,
    };
  }

  function handleGenerateBill() {
    const preview = buildPreview("PCC", billCounter, billCustomer, billItems, "invoice");
    setBillPreview(preview);
    setBills((current) => [...current, preview]);
    setBillCounter((current) => current + 1);
  }

  function handleGenerateQuotation() {
    const quotationCounter = quotations.length + 1;
    const preview = buildPreview("QT", quotationCounter, quotationCustomer, quotationItems, "quotation");
    setQuotationPreview(preview);
    setQuotations((current) => [...current, preview]);
  }

  async function downloadPreview(elementRef, fileName) {
    if (!elementRef.current) {
      return;
    }

    const html2pdf = (await import("html2pdf.js")).default;

    html2pdf()
      .set({
        margin: 0.4,
        filename: fileName,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
        },
      })
      .from(elementRef.current)
      .save();
  }

  function sharePreview(preview, heading) {
    if (!preview) {
      return;
    }

    const lines = [
      `${heading}: ${preview.id}`,
      `Date: ${formatDateTime(preview.date)}`,
      `Customer: ${preview.customer.customer}`,
      `Vehicle: ${preview.customer.vehicle} (${preview.customer.model})`,
      "",
      ...preview.items.map((item, index) => `${index + 1}. ${item.description} - ${formatCurrency(item.amount)}`),
      "",
      `Total: ${formatCurrency(preview.total)}`,
    ];

    const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="app-shell">
      {!entered ? (
        <section className="welcome-screen">
          <div className="welcome-panel">
            <p className="eyebrow">Detailing cockpit</p>
            <h1>{settings.companyName}</h1>
            <p className="lead">
              A cleaner, faster workshop workspace for live vehicle tracking, quotes, invoices, and customer follow-ups.
            </p>
            <div className="hero-metrics">
              <div>
                <strong>{vehicles.length}</strong>
                <span>Vehicles tracked</span>
              </div>
              <div>
                <strong>{bills.length}</strong>
                <span>Invoices created</span>
              </div>
              <div>
                <strong>{freeCoating.length}</strong>
                <span>Care reminders</span>
              </div>
            </div>
            <button className="primary-button" onClick={() => setEntered(true)}>
              Enter Workshop
            </button>
          </div>
        </section>
      ) : (
        <div className="workspace-shell">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="brand-block">
                <div className="brand-mark">PCC</div>
                <div>
                  <p className="eyebrow">Workshop Hub</p>
                  <h2>{settings.companyName}</h2>
                  <p className="sidebar-copy">{settings.tagline}</p>
                </div>
              </div>

              <div className="status-ribbon">
                <span className="status-dot" />
                Live operations
              </div>
            </div>

            <nav className="nav-list">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  className={item.id === activePage ? "nav-button active" : "nav-button"}
                  onClick={() => setActivePage(item.id)}
                >
                  <span>{item.label}</span>
                  <small>
                    {item.id === "dashboard"
                      ? "Overview"
                      : item.id === "vehicle"
                        ? "Intake"
                        : item.id === "freeCoating"
                          ? "Retention"
                          : item.id === "quotation"
                            ? "Estimates"
                            : item.id === "billing"
                              ? "Invoices"
                              : "Brand"}
                  </small>
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-card">
                <span className="sidebar-label">Today at a glance</span>
                <strong>{dashboardStats[1].value} pending jobs</strong>
                <p>{dashboardStats[5].value} tracked from saved invoices.</p>
              </div>

              <div className="sidebar-mini-card">
                <span>Owner</span>
                <strong>{settings.ownerName}</strong>
                <p>{settings.ownerMobile || settings.ownerEmail || "Contact details not set yet"}</p>
              </div>
            </div>
          </aside>

          <main className="content">
            <header className="topbar">
              <div className="topbar-copy">
                <div className="topbar-badges">
                  <span className="topbar-chip">Operations overview</span>
                  <span className="topbar-chip subtle">{vehicles.length} vehicles in workspace</span>
                </div>
                <h1>{activeNav?.label}</h1>
                <p className="topbar-note">
                  {activePage === "dashboard"
                    ? "Monitor intake, customer care, and billing from one service command center."
                    : activePage === "vehicle"
                      ? "Capture arrivals quickly and keep the live queue crisp."
                      : activePage === "freeCoating"
                        ? "Track after-service follow-ups and protect repeat business."
                        : activePage === "quotation"
                          ? "Build polished estimates before the vehicle enters the bay."
                          : activePage === "billing"
                            ? "Create premium invoices with fast export and sharing."
                            : "Shape the workshop brand that appears across the experience."}
                </p>
              </div>
              <button className="ghost-button" onClick={() => setEntered(false)}>
                Exit to welcome screen
              </button>
            </header>

            {activePage === "dashboard" ? (
              <section className="page-grid">
                <section className="hero-banner">
                  <div className="hero-banner-copy">
                    <p className="eyebrow">Service command center</p>
                    <h2>Keep the floor moving and the customer experience premium.</h2>
                    <p>
                      From intake to billing, this layout is designed to surface the next action instead of burying it in forms.
                    </p>
                  </div>

                  <div className="hero-banner-rail">
                    <div className="hero-metric-card">
                      <span>Queue Pressure</span>
                      <strong>{dashboardStats[1].value}</strong>
                      <small>Vehicles waiting on action</small>
                    </div>
                    <div className="hero-metric-card">
                      <span>Care Follow-ups</span>
                      <strong>{dashboardStats[3].value}</strong>
                      <small>Customers due for attention</small>
                    </div>
                    <div className="hero-metric-card">
                      <span>Cash Flow</span>
                      <strong>{dashboardStats[5].value}</strong>
                      <small>Revenue captured in saved invoices</small>
                    </div>
                  </div>
                </section>

                <div className="stats-grid">
                  {dashboardStats.map((stat) => (
                    <article key={stat.label} className={`stat-card tone-${stat.tone}`}>
                      <div className="stat-card-top">
                        <span>{stat.label}</span>
                        <i className={`tone-dot tone-${stat.tone}`} />
                      </div>
                      <strong>{stat.value}</strong>
                      <small>
                        {stat.label === "Vehicles Logged"
                          ? "All captured workshop entries"
                          : stat.label === "Pending Jobs"
                            ? "Jobs still active on the floor"
                            : stat.label === "Completed Jobs"
                              ? "Closed jobs ready for delivery"
                              : stat.label === "Free Coating Due"
                                ? "Customer care reminders open"
                                : stat.label === "Invoices Issued"
                                  ? "Saved billing records"
                                  : "Live revenue estimate"}
                      </small>
                    </article>
                  ))}
                </div>

                <div className="two-column">
                  <PreviewCard title="Recent Vehicle Intake" subtitle="Live queue">
                    <div className="stack-list">
                      {vehicles.length ? (
                        vehicles.slice(0, 4).map((vehicle) => (
                          <article key={vehicle.id} className="list-card">
                            <div>
                              <strong>{vehicle.vehicleNumber}</strong>
                              <p>{vehicle.customerName}</p>
                            </div>
                            <div className="list-meta">
                              <span>{vehicle.work}</span>
                              <b className={vehicle.status === "Completed" ? "badge success" : "badge warning"}>
                                {vehicle.status}
                              </b>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="empty-state">No vehicles logged yet. Add one from Vehicle Desk.</p>
                      )}
                    </div>
                  </PreviewCard>

                  <PreviewCard title="Upcoming Free Coating" subtitle="Customer care">
                    <div className="stack-list">
                      {upcomingCoating.length ? (
                        upcomingCoating.map((record) => (
                          <article key={record.id} className="list-card">
                            <div>
                              <strong>{record.vehicle}</strong>
                              <p>{record.customer}</p>
                            </div>
                            <div className="list-meta">
                              <span>{record.date}</span>
                              <b className="badge info">Pending</b>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="empty-state">All clear. No pending coating reminders.</p>
                      )}
                    </div>
                  </PreviewCard>
                </div>

                <PreviewCard title="Latest Billing Activity" subtitle="Cash desk">
                  <div className="stack-list">
                    {recentBills.length ? (
                      recentBills.map((bill) => (
                        <article key={`${bill.id}-${bill.date}`} className="list-card">
                          <div>
                            <strong>{bill.id}</strong>
                            <p>{bill.customer.customer || "Walk-in customer"}</p>
                          </div>
                          <div className="list-meta">
                            <span>{formatDateTime(bill.date)}</span>
                            <b className="badge success">{formatCurrency(bill.total)}</b>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="empty-state">Invoices will appear here after you generate the first bill.</p>
                    )}
                  </div>
                </PreviewCard>
              </section>
            ) : null}

            {activePage === "vehicle" ? (
              <section className="page-grid">
                <div className="two-column">
                  <form className="panel-card" onSubmit={handleSaveVehicle}>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">New intake</p>
                        <h3>Vehicle Entry</h3>
                      </div>
                    </div>

                    <div className="form-grid">
                      <input
                        name="customerName"
                        placeholder="Customer name"
                        value={vehicleForm.customerName}
                        onChange={handleVehicleChange}
                        required
                      />
                      <input
                        name="mobileNumber"
                        placeholder="Mobile number"
                        value={vehicleForm.mobileNumber}
                        onChange={handleVehicleChange}
                        required
                      />
                      <input
                        name="vehicleNumber"
                        placeholder="Vehicle number"
                        value={vehicleForm.vehicleNumber}
                        onChange={handleVehicleChange}
                        required
                      />
                      <input
                        name="vehicleModel"
                        placeholder="Vehicle model"
                        value={vehicleForm.vehicleModel}
                        onChange={handleVehicleChange}
                        required
                      />
                      <select name="work" value={vehicleForm.work} onChange={handleVehicleChange} required>
                        <option value="">Select service</option>
                        {serviceOptions.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                      <select name="status" value={vehicleForm.status} onChange={handleVehicleChange}>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div className="action-row">
                      <button className="primary-button" type="submit">
                        Save Vehicle
                      </button>
                      <button className="ghost-button" type="button" onClick={() => setVehicleForm(defaultVehicleForm)}>
                        Clear
                      </button>
                    </div>
                  </form>

                  <PreviewCard title="Search Queue" subtitle="Fast lookup">
                    <input
                      className="search-input"
                      placeholder="Search by customer, vehicle, mobile, model, or service"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <div className="stack-list">
                      {filteredVehicles.length ? (
                        filteredVehicles.map((vehicle) => (
                          <article key={vehicle.id} className="vehicle-card">
                            <div className="vehicle-topline">
                              <strong>{vehicle.vehicleNumber}</strong>
                              <span>{formatDateTime(vehicle.createdAt)}</span>
                            </div>
                            <p>{vehicle.customerName}</p>
                            <small>
                              {vehicle.mobileNumber} • {vehicle.vehicleModel}
                            </small>
                            <div className="list-meta">
                              <span>{vehicle.work}</span>
                              <b className={vehicle.status === "Completed" ? "badge success" : "badge warning"}>
                                {vehicle.status}
                              </b>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="empty-state">No matching vehicles found.</p>
                      )}
                    </div>
                  </PreviewCard>
                </div>
              </section>
            ) : null}

            {activePage === "freeCoating" ? (
              <section className="page-grid">
                <div className="two-column">
                  <form className="panel-card" onSubmit={handleSaveFreeCoating}>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">Retention</p>
                        <h3>Free Coating Tracker</h3>
                      </div>
                    </div>

                    <div className="form-grid">
                      <input
  type="text"
  placeholder="Search Vehicle Number"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
                      <select
  value={coatingForm.vehicle}
  onChange={(e) =>
    setCoatingForm({
      ...coatingForm,
      vehicle: e.target.value,
    })
  }
>
  <option value="">Select Vehicle</option>

  {salesRecords
  .filter(
    (record) =>
      !record.freeCoatingDone &&
      record.vehicle.toLowerCase().includes(search.toLowerCase())
  )
  .map((record, index) => (
      <option key={index} value={record.vehicle}>
        {record.vehicle} - {record.customer}
      </option>
    ))}
</select>
                      <input name="nextVisit" type="date" value={coatingForm.nextVisit} onChange={handleCoatingChange} />
                      <label className="check-card">
                        <input name="done" type="checkbox" checked={coatingForm.done} onChange={handleCoatingChange} />
                        Mark as completed
                      </label>
                    </div>

                    <button className="primary-button" type="submit">
                      Mark Free Coating Complete
                    </button>
                  </form>

                  <PreviewCard title="Coating Follow-up List" subtitle="Reminder queue">
                    <div className="stack-list">
                      {freeCoating.length ? (
                        freeCoating.map((record) => (
                          <article key={record.id} className="list-card">
                            <div>
                              <strong>{record.vehicle}</strong>
                              <p>
                                {record.name} • {record.mobile}
                              </p>
                            </div>
                            <div className="list-meta">
                              <span>{record.nextVisit || "No date"}</span>
                              <b className={record.done ? "badge success" : "badge warning"}>
                                {record.done ? "Done" : "Pending"}
                              </b>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="empty-state">No free coating reminders saved yet.</p>
                      )}
                    </div>
                  </PreviewCard>
                </div>
              </section>
            ) : null}

            {activePage === "salesCoating" ? (
              <section className="page-grid">
    <div className="panel-card">
      <h2>Sales Coating Entry</h2>
<input
  className="search-input"
  placeholder="Search Customer or Vehicle Number"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
      <div className="form-grid">
        <input id="customerName" placeholder="Customer Name" />
        <input id="phoneNumber" placeholder="Phone Number" />
        <input id="vehicleNumber" placeholder="Vehicle Number" />
        <input id="vehicleModel" placeholder="Vehicle Model" />
        <input id="chassisNumber" placeholder="Chassis Number" />
        <input id="vehicleColor" placeholder="Vehicle Color" />
        <input id="salesmanName" placeholder="Salesman Name" />

        <select id="status">
          <option>Pending</option>
          <option>Complete</option>
        </select>

        <input id="deliveryDate" type="date" />
      </div>
<button
  className="primary-button"
  onClick={async () => {
    const saleRecord = {
      customer: document.getElementById("customerName").value,
      vehicle: document.getElementById("vehicleNumber").value,
      model: document.getElementById("vehicleModel").value,
      color: document.getElementById("vehicleColor").value,
      salesman: document.getElementById("salesmanName").value,
      status: document.getElementById("status").value,
      date: document.getElementById("deliveryDate").value,
      freeCoatingDone: false,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
console.log("Save button clicked", saleRecord);

try {
  console.log("Before Firestore");
console.log("Collection Test", collection(db, "sales"));
  const docRef = await addDoc(
    collection(db, "sales"),
    saleRecord
  );
console.log("DB:", db);
console.log("Collection:", collection(db, "sales"));
  console.log("After Firestore:", docRef.id);

} catch (error) {
  console.error("Firestore Error:", error);
  alert(error.message);
}


  setSalesRecords((prev) => {
  const updated = [saleRecord, ...prev];
  console.log(updated);
  return updated;
});
  }}
  
>
  Save Record
</button>
    </div>

    <div className="stack-list" style={{ marginTop: "20px" }}>
      <p>Total Records: {salesRecords.length}</p>
    {filteredSalesRecords.map((record, index) => (
        <div key={index} className="list-card">
          <h3>{record.customer}</h3>
          <p><strong>Vehicle:</strong> {record.vehicle}</p>
          <p><strong>Model:</strong> {record.model}</p>
          <p><strong>Color:</strong> {record.color}</p>
          <p><strong>Salesman:</strong> {record.salesman}</p>
          <p><strong>Delivery Date:</strong> {record.date}</p>
          <p>
            <strong>Warranty:</strong>{" "}
            {new Date(record.date).getTime() + 365 * 24 * 60 * 60 * 1000 < Date.now()
              ? "🔴 EXPIRED"
              : "🟢 ACTIVE"}
          </p>
          <p>
  <strong>Free Coating:</strong>{" "}
  {record.freeCoatingDone ? "🟢 Complete" : "🟡 Pending"}
</p>
          <div className="list-meta">
            <b className={record.status === "Complete" ? "badge success" : "badge warning"}>
              {record.status}
            </b>
            <button
  onClick={() => {
    setSalesRecords((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, freeCoatingDone: true }
          : item
      )
    );
  }}
>
  Free Coating Complete
</button>
          </div>
        </div>
      ))}
    </div>
  </section>
) : null}

            {activePage === "quotation" ? (
              <section className="page-grid">
                <div className="two-column">
                  <div className="panel-card">
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">Estimate builder</p>
                        <h3>Create Quotation</h3>
                      </div>
                    </div>

                    <div className="form-grid">
                      <input
                        name="customer"
                        placeholder="Customer name"
                        value={quotationCustomer.customer}
                        onChange={(event) => handleCustomerChange(event, setQuotationCustomer)}
                      />
                      <input
                        name="mobile"
                        placeholder="Mobile number"
                        value={quotationCustomer.mobile}
                        onChange={(event) => handleCustomerChange(event, setQuotationCustomer)}
                      />
                      <input
                        name="vehicle"
                        placeholder="Vehicle number"
                        value={quotationCustomer.vehicle}
                        onChange={(event) => handleCustomerChange(event, setQuotationCustomer)}
                      />
                      <input
                        name="model"
                        placeholder="Vehicle model"
                        value={quotationCustomer.model}
                        onChange={(event) => handleCustomerChange(event, setQuotationCustomer)}
                      />
                    </div>

                    <div className="line-items">
                      {quotationItems.map((item, index) => (
                        <div key={`quotation-item-${index}`} className="line-item-row">
                          <input
                            placeholder={`Work item ${index + 1}`}
                            value={item.description}
                            onChange={(event) =>
                              handleLineItemChange(index, "description", event.target.value, setQuotationItems)
                            }
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(event) => handleLineItemChange(index, "amount", event.target.value, setQuotationItems)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="action-row">
                      <button className="primary-button" type="button" onClick={handleGenerateQuotation}>
                        Generate Quotation
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => sharePreview(quotationPreview, "Quotation")}
                      >
                        Share WhatsApp
                      </button>
                    </div>
                  </div>

                  <PreviewCard
                    title="Quotation Preview"
                    subtitle="Customer-ready output"
                    actions={
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => downloadPreview(quotationPreviewRef, "quotation.pdf")}
                        disabled={!quotationPreview}
                      >
                        Download PDF
                      </button>
                    }
                  >
                    {quotationPreview ? (
                      <DocumentPreview preview={quotationPreview} settings={settings} ref={quotationPreviewRef} />
                    ) : (
                      <p className="empty-state">Generate a quotation to preview and export it here.</p>
                    )}
                  </PreviewCard>
                </div>
              </section>
            ) : null}

            {activePage === "billing" ? (
              <section className="page-grid">
                <div className="two-column">
                  <div className="panel-card">
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">Cash desk</p>
                        <h3>Create Invoice</h3>
                      </div>
                    </div>

                    <div className="form-grid">
                      <input
                        name="customer"
                        placeholder="Customer name"
                        value={billCustomer.customer}
                        onChange={(event) => handleCustomerChange(event, setBillCustomer)}
                      />
                      <input
                        name="mobile"
                        placeholder="Mobile number"
                        value={billCustomer.mobile}
                        onChange={(event) => handleCustomerChange(event, setBillCustomer)}
                      />
                      <input
                        name="vehicle"
                        placeholder="Vehicle number"
                        value={billCustomer.vehicle}
                        onChange={(event) => handleCustomerChange(event, setBillCustomer)}
                      />
                      <input
                        name="model"
                        placeholder="Vehicle model"
                        value={billCustomer.model}
                        onChange={(event) => handleCustomerChange(event, setBillCustomer)}
                      />
                    </div>

                    <div className="line-items">
                      {billItems.map((item, index) => (
                        <div key={`bill-item-${index}`} className="line-item-row">
                          <input
                            placeholder={`Work item ${index + 1}`}
                            value={item.description}
                            onChange={(event) => handleLineItemChange(index, "description", event.target.value, setBillItems)}
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(event) => handleLineItemChange(index, "amount", event.target.value, setBillItems)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="action-row">
                      <button className="primary-button" type="button" onClick={handleGenerateBill}>
                        Generate Invoice
                      </button>
                      <button className="ghost-button" type="button" onClick={() => sharePreview(billPreview, "Invoice")}>
                        Share WhatsApp
                      </button>
                    </div>
                  </div>

                  <PreviewCard
                    title="Invoice Preview"
                    subtitle="Print-ready output"
                    actions={
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => downloadPreview(billPreviewRef, "invoice.pdf")}
                        disabled={!billPreview}
                      >
                        Download PDF
                      </button>
                    }
                  >
                    {billPreview ? (
                      <DocumentPreview preview={billPreview} settings={settings} ref={billPreviewRef} />
                    ) : (
                      <p className="empty-state">Generate an invoice to preview and export it here.</p>
                    )}
                  </PreviewCard>
                </div>
              </section>
            ) : null}

            {activePage === "settings" ? (
              <section className="page-grid">
                <div className="panel-card">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Brand setup</p>
                      <h3>Workshop Settings</h3>
                    </div>
                  </div>

                  <div className="form-grid">
                    <input
                      name="companyName"
                      placeholder="Company name"
                      value={settings.companyName}
                      onChange={(event) => handleCustomerChange(event, setSettings)}
                    />
                    <input
                      name="tagline"
                      placeholder="Tagline"
                      value={settings.tagline}
                      onChange={(event) => handleCustomerChange(event, setSettings)}
                    />
                    <input
                      name="ownerName"
                      placeholder="Owner name"
                      value={settings.ownerName}
                      onChange={(event) => handleCustomerChange(event, setSettings)}
                    />
                    <input
                      name="ownerMobile"
                      placeholder="Owner mobile"
                      value={settings.ownerMobile}
                      onChange={(event) => handleCustomerChange(event, setSettings)}
                    />
                    <input
                      name="ownerEmail"
                      placeholder="Owner email"
                      value={settings.ownerEmail}
                      onChange={(event) => handleCustomerChange(event, setSettings)}
                    />
                    <input
                      name="address"
                      placeholder="Address"
                      value={settings.address}
                      onChange={(event) => handleCustomerChange(event, setSettings)}
                    />
                  </div>

                  <label className="check-card">
                    <input
                      name="greyMode"
                      type="checkbox"
                      checked={settings.greyMode}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, greyMode: event.target.checked }))
                      }
                    />
                    Enable grey mode
                  </label>
                </div>
              </section>
            ) : null}
          </main>
        </div>
      )}
    </div>
  );
}

const DocumentPreview = forwardRef(function DocumentPreview({ preview, settings }, ref) {
  return (
    <article className="document-preview" ref={ref}>
      <div className="document-header">
        <div>
          <p className="eyebrow">{preview.type === "invoice" ? "Tax Invoice" : "Service Estimate"}</p>
          <h2>{settings.companyName}</h2>
          <span>{settings.address}</span>
        </div>
        <div className="document-meta">
          <strong>{preview.id}</strong>
          <span>{formatDateTime(preview.date)}</span>
          <span>{settings.ownerMobile || settings.ownerEmail || settings.ownerName}</span>
        </div>
      </div>

      <div className="customer-grid">
        <div>
          <p>Customer</p>
          <strong>{preview.customer.customer || "Walk-in customer"}</strong>
          <span>{preview.customer.mobile || "Mobile not provided"}</span>
        </div>
        <div>
          <p>Vehicle</p>
          <strong>{preview.customer.vehicle || "Vehicle not provided"}</strong>
          <span>{preview.customer.model || "Model not provided"}</span>
        </div>
      </div>

      <table className="document-table">
        <thead>
          <tr>
            <th>Sr</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {preview.items.length ? (
            preview.items.map((item, index) => (
              <tr key={`${preview.id}-${index}`}>
                <td>{index + 1}</td>
                <td>{item.description}</td>
                <td>{formatCurrency(item.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No line items added.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="document-footer">
        <div>
          <p>Prepared by</p>
          <strong>{settings.ownerName}</strong>
        </div>
        <div className="document-total">
          <span>Total</span>
          <strong>{formatCurrency(preview.total)}</strong>
        </div>
      </div>
    </article>
  );
});

export default App;

