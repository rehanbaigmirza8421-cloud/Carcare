let vehicles = JSON.parse(localStorage.getItem("vehicles")) || [];
let bills = JSON.parse(localStorage.getItem("bills")) || [];
let freeCoating = JSON.parse(localStorage.getItem("freeCoating")) || [];
let billCounter = JSON.parse(localStorage.getItem("billCounter")) || 1;
let settings = JSON.parse(localStorage.getItem("settings")) || {};

// ===================== ENTER WORKSHOP =====================
function enterWorkshop(){
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "flex";

    loadVehicles();
    loadFreeCoating();
    updateDashboard();
}

// ===================== PAGE SWITCH =====================
function showPage(page){
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

// ===================== VEHICLE =====================
function saveVehicle(){

    let v = {
        customerName: customerName.value,
        mobileNumber: mobileNumber.value,
        vehicleNumber: vehicleNumber.value,
        vehicleModel: vehicleModel.value,work: document.getElementById("vehicleWork").value,
        status: document.getElementById("vehicleStatus").value,
        date: new Date().toLocaleString()
    };

    vehicles.push(v);
    localStorage.setItem("vehicles", JSON.stringify(vehicles));

    clearVehicle();
    loadVehicles();
}

function clearVehicle(){
    customerName.value = "";
    mobileNumber.value = "";
    vehicleNumber.value = "";
    vehicleModel.value = "";
    document.getElementById("vehicleWork").value = "";
    document.getElementById("vehicleStatus").value = "Pending";
}

function loadVehicles(){

    let box = document.getElementById("vehicleTable");
    box.innerHTML = "";

    vehicles.forEach(v=>{
        box.innerHTML += `
        <div style="padding:10px;border:1px solid #d4af37;margin:10px 0">
            <b>${v.vehicleNumber}</b><br>
            ${v.customerName}<br>
            ${v.mobileNumber}<br>
            ${v.vehicleModel}<br>
<b>Work:</b> ${v.work}<br>
${v.status}
        </div>`;
    });

    updateDashboard();
}

// ===================== DASHBOARD =====================
function updateDashboard(){

    document.getElementById("totalVehicles").innerText = vehicles.length;
    document.getElementById("pendingVehicles").innerText = vehicles.length;
    document.getElementById("completedVehicles").innerText = 0;
    document.getElementById("freeCoatingCount").innerText = freeCoating.length;
}

// ===================== SEARCH =====================
document.addEventListener("input",(e)=>{
    if(e.target.id !== "searchBox") return;

    let val = e.target.value.toLowerCase();

    let filtered = vehicles.filter(v =>
        (v.customerName||"").toLowerCase().includes(val) ||
        (v.vehicleNumber||"").toLowerCase().includes(val) ||
        (v.mobileNumber||"").toLowerCase().includes(val)
    );

    let box = document.getElementById("vehicleTable");
    box.innerHTML = "";

    filtered.forEach(v=>{
        box.innerHTML += `
        <div style="padding:10px;border:1px solid #d4af37;margin:10px 0">
            <b>${v.vehicleNumber}</b><br>
            ${v.customerName}<br>
            ${v.mobileNumber}
        </div>`;
    });
});

// ===================== FREE COATING =====================
function saveFreeCoating(){

    let f = {
        name: fcName.value,
        mobile: fcMobile.value,
        vehicle: fcVehicle.value,
        model: fcModel.value,
        done: fcDone.checked
    };

    freeCoating.push(f);
    localStorage.setItem("freeCoating", JSON.stringify(freeCoating));

    loadFreeCoating();
}

function loadFreeCoating(){

    let box = document.getElementById("freeCoatingList");
    box.innerHTML = "";

    freeCoating.forEach(f=>{
        box.innerHTML += `
        <div style="padding:10px;border:1px solid #d4af37;margin:10px 0">
            ${f.vehicle} - ${f.name} - ${f.done ? "Done":"Pending"}
        </div>`;
    });
}

// ===================== BILL =====================
function generateBill(){

let customer = document.getElementById("bCustomer").value;
let mobile = document.getElementById("bMobile").value;
let vehicle = document.getElementById("bVehicle").value;
let model = document.getElementById("bModel").value;

let work1 = document.getElementById("work1").value;
let rate1 = Number(document.getElementById("rate1").value) || 0;

let work2 = document.getElementById("work2").value;
let rate2 = Number(document.getElementById("rate2").value) || 0;

let work3 = document.getElementById("work3").value;
let rate3 = Number(document.getElementById("rate3").value) || 0;

let total = rate1 + rate2 + rate3;

let billNo = "PCC-" + String(billCounter++).padStart(4,"0");
localStorage.setItem("billCounter", JSON.stringify(billCounter));

let date = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

document.getElementById("billPreview").innerHTML = `
<div class="invoice-box">

    <div class="invoice-header">
        <div>
            <div class="invoice-title">PROFESSIONAL CAR CARE</div>
            <p>Professional Workshop Management</p>
        </div>

        <div>
            <b>Invoice No:</b> ${billNo}<br>
            <b>Date:</b> ${date}
        </div>
    </div>

    <h3>Customer Details</h3>

    <p><b>Name:</b> ${customer}</p>
    <p><b>Mobile:</b> ${mobile}</p>
    <p><b>Vehicle No:</b> ${vehicle}</p>
    <p><b>Vehicle Model:</b> ${model}</p>

    <table class="invoice-table">
        <tr>
            <th>Sr</th>
            <th>Description</th>
            <th>Amount</th>
        </tr>

        ${work1 ? `<tr><td>1</td><td>${work1}</td><td>₹${rate1}</td></tr>` : ""}
        ${work2 ? `<tr><td>2</td><td>${work2}</td><td>₹${rate2}</td></tr>` : ""}
        ${work3 ? `<tr><td>3</td><td>${work3}</td><td>₹${rate3}</td></tr>` : ""}
    </table>

    <div class="invoice-total">
        TOTAL : ₹${total}
    </div>

    <div class="invoice-sign">
        Authorized Signature
    </div>

</div>
`;

}

// ===================== QUOTATION =====================
function generateQuotation(){

let customer = document.getElementById("qCustomer").value;
let mobile = document.getElementById("qMobile").value;
let vehicle = document.getElementById("qVehicle").value;
let model = document.getElementById("qModel").value;

let work1 = document.getElementById("qWork1").value;
let rate1 = Number(document.getElementById("qRate1").value) || 0;

let work2 = document.getElementById("qWork2").value;
let rate2 = Number(document.getElementById("qRate2").value) || 0;

let work3 = document.getElementById("qWork3").value;
let rate3 = Number(document.getElementById("qRate3").value) || 0;

let work4 = document.getElementById("qWork4").value;
let rate4 = Number(document.getElementById("qRate4").value) || 0;

let work5 = document.getElementById("qWork5").value;
let rate5 = Number(document.getElementById("qRate5").value) || 0;

let total = rate1 + rate2 + rate3 + rate4 + rate5;

let qNo = "QT-" + Date.now().toString().slice(-6);

let date = new Date().toLocaleString('en-IN', {
    day:'2-digit',
    month:'2-digit',
    year:'numeric',
    hour:'2-digit',
    minute:'2-digit'
});

document.getElementById("quotationPreview").innerHTML = `
<div class="invoice-box">

    <div class="invoice-header">
        <div>
            <div class="invoice-title">
                PROFESSIONAL CAR CARE
            </div>
            <p>QUOTATION</p>
        </div>

        <div>
            <b>Quotation No:</b> ${qNo}<br>
            <b>Date:</b> ${date}
        </div>
    </div>

    <p><b>Customer:</b> ${customer}</p>
    <p><b>Mobile:</b> ${mobile}</p>
    <p><b>Vehicle No:</b> ${vehicle}</p>
    <p><b>Vehicle Model:</b> ${model}</p>

    <table class="invoice-table">

        <tr>
            <th>Sr</th>
            <th>Description</th>
            <th>Amount</th>
        </tr>

        ${work1 ? `<tr><td>1</td><td>${work1}</td><td>₹${rate1}</td></tr>` : ""}
        ${work2 ? `<tr><td>2</td><td>${work2}</td><td>₹${rate2}</td></tr>` : ""}
        ${work3 ? `<tr><td>3</td><td>${work3}</td><td>₹${rate3}</td></tr>` : ""}
        ${work4 ? `<tr><td>4</td><td>${work4}</td><td>₹${rate4}</td></tr>` : ""}
        ${work5 ? `<tr><td>5</td><td>${work5}</td><td>₹${rate5}</td></tr>` : ""}

    </table>

    <div class="invoice-total">
        TOTAL : ₹${total}
    </div>

    <div class="invoice-sign">
        Authorized Signature
    </div>

</div>`;

}

// ===================== SETTINGS =====================
function saveSettings(){

    settings = {
        companyName: companyName.value,
        ownerName: ownerName.value,
        ownerMobile: ownerMobile.value,
        ownerEmail: ownerEmail.value,
        greyMode: greyMode.checked
    };

    localStorage.setItem("settings", JSON.stringify(settings));
    applySettings();
}

function applySettings(){

    if(settings.darkMode){
        document.body.style.background = "#000";
        document.body.style.color = "#fff";
    }else{
        document.body.style.background = "#0b0b0b";
        document.body.style.color = "#fff";
    }
}

// ===================== INIT =====================
loadVehicles();
loadFreeCoating();
updateDashboard();
applySettings();function downloadBillPDF(){

    const element = document.getElementById("billPreview");

    if(!element.innerHTML){
        alert("Generate Bill First");
        return;
    }

    let opt = {
        margin: 0.5,
        filename: 'Invoice.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    html2pdf().set(opt).from(element).save();
}function downloadQuotationPDF(){

const element =
document.getElementById("quotationPreview");

if(!element.innerHTML){
    alert("Generate Quotation First");
    return;
}

html2pdf()
.set({
    margin:0.5,
    filename:'Quotation.pdf',
    image:{type:'jpeg',quality:1},
    html2canvas:{scale:2},
    jsPDF:{
        unit:'in',
        format:'a4',
        orientation:'portrait'
    }
})
.from(element)
.save();

}function toggleGreyMode(){
    document.body.classList.toggle("grey-mode");
}