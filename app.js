
// =========================
// NAVIGATION
// =========================

// index → role
const getStartedBtn = document.getElementById("getStartedBtn");
if (getStartedBtn) {
  getStartedBtn.addEventListener("click", () => {
    window.location.href = "role.html";
  });
}

// role → auth
const userBtn = document.getElementById("userBtn");
if (userBtn) {
  userBtn.addEventListener("click", () => {
    localStorage.setItem("selectedRole", "USER");
    window.location.href = "user_auth.html";
  });
}

const ownerBtn = document.getElementById("ownerBtn");
if (ownerBtn) {
  ownerBtn.addEventListener("click", () => {
    localStorage.setItem("selectedRole", "OWNER");
    window.location.href = "owner_auth.html";
  });
}

// =========================
// BUTTON ANIMATION
// =========================
document.addEventListener("click", (e) => {
  const linkBtn = e.target.closest("a.btn");
  if (!linkBtn) return;

  const href = linkBtn.getAttribute("href");
  if (!href || href.startsWith("#")) return;

  e.preventDefault();
  linkBtn.classList.add("btn-pressed");

  setTimeout(() => {
    window.location.href = href;
  }, 150);
});

// =========================
// PASSWORD TOGGLE
// =========================
document.addEventListener("DOMContentLoaded", function () {

  const showOwnerPass = document.getElementById("showOwnerPass");
  const ownerPassInput = document.getElementById("o_pass");

  if (showOwnerPass && ownerPassInput) {
    showOwnerPass.addEventListener("change", function () {
      ownerPassInput.type = this.checked ? "text" : "password";
    });
  }

  const showUserPass = document.getElementById("showuserPass");
  const userPassInput = document.getElementById("lu_pass");

  if (showUserPass && userPassInput) {
    showUserPass.addEventListener("change", function () {
      userPassInput.type = this.checked ? "text" : "password";
    });
  }
});

// =========================
// STORAGE HELPERS
// =========================
function getBookings() {
  return JSON.parse(localStorage.getItem("userBookings") || "[]");
}

function saveBookings(b) {
  localStorage.setItem("userBookings", JSON.stringify(b));
}

function getSpaces(){
  return JSON.parse(localStorage.getItem("ownerSpaces") || "[]");
}

function saveSpaces(arr){
  localStorage.setItem("ownerSpaces", JSON.stringify(arr));
}

function getOTPMap() {
  return JSON.parse(localStorage.getItem("bookingOTPMap") || "{}");
}

function saveOTPMap(m) {
  localStorage.setItem("bookingOTPMap", JSON.stringify(m));
}

// =========================
// GENERATE OTP
// =========================
function generateOTP(bookingId) {
  let otpMap = getOTPMap();

  const otp = Math.floor(1000 + Math.random() * 9000);

  otpMap[bookingId] = {
    code: otp,
    time: Date.now()
  };

  saveOTPMap(otpMap);

  alert("Your OTP: " + otp);
}

// =========================
// PAYMENT FLOW
// =========================
function payNow(id) {
  let bookings = getBookings();
  const i = bookings.findIndex(b => b.bookingId == id);

  if (i === -1) return;

  window.location.href = "payment.html?bid=" + id; // ✅ FIXED param
}

// =========================
// PAYMENT CHECK
// =========================
function checkPendingPayments() {
  let bookings = getBookings();

  bookings.forEach(b => {
    if (b.status === "ENDED" && b.paymentStatus !== "PAID") {
      alert("Complete payment for Booking ID: " + b.bookingId);
    }
  });
}

// =========================
// OTP VERIFY
// =========================
function verifyOTP(id) {
  let otpMap = getOTPMap();
  let bookings = getBookings();

  const i = bookings.findIndex(b => b.bookingId == id);
  if (i === -1) return;

  const entered = document.getElementById("otp_" + id)?.value;
  const data = otpMap[id];

  if (!data) {
    alert("OTP Expired ❌");
    return;
  }

  if (Date.now() - data.time > 5 * 60 * 1000) {
    alert("OTP Expired ⏰");
    delete otpMap[id];
    saveOTPMap(otpMap);
    return;
  }

  if (bookings[i].status === "STARTED") {
    alert("Already Started ❌");
    return;
  }

  if (entered == data.code) {
    bookings[i].status = "STARTED";
    bookings[i].startTime = new Date().toLocaleTimeString();

    saveBookings(bookings);

    delete otpMap[id];
    saveOTPMap(otpMap);

    alert("Parking Started ✅");
    location.reload();
  } else {
    alert("Invalid OTP ❌");
  }
}

// =========================
// END PARKING
// =========================
function endParking(id) {
  let bookings = getBookings();
  const i = bookings.findIndex(b => b.bookingId == id);

  if (i === -1) return;

  if (bookings[i].status !== "STARTED") {
    alert("Start parking first ❌");
    return;
  }

  bookings[i].status = "ENDED";
  bookings[i].endTime = new Date().toLocaleTimeString();

  saveBookings(bookings);

  alert("Parking Ended 🛑");
  location.reload();
}

// =========================
// OWNER EARNINGS
// =========================
function calculateEarnings(ownerName) {
  let bookings = getBookings();

  return bookings
    .filter(b => b.ownerName === ownerName && b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + Number(b.price || 0), 0);
}

// =========================
// EDIT PROFILE
// =========================
function goToEdit(){
  window.location.href = "owner_details.html";
}

const editBtn = document.getElementById("editOwnerProfileBtn");
if (editBtn) {
  editBtn.addEventListener("click", goToEdit);
}

// =========================
// USER SIDE SHOW SPACES
// =========================
document.addEventListener("DOMContentLoaded", function(){

  const container = document.getElementById("parkingList");
  if(!container) return; // 🔥 SAFE CHECK

  let spaces = getSpaces();

  // only available
  spaces = spaces.filter(s => s.status === "AVAILABLE");

  if(spaces.length === 0){
    container.innerHTML = "<p>No parking available ❌</p>";
    return;
  }

  container.innerHTML = spaces.map(s => `
    <div class="card">
      <img src="${s.photo}" style="width:100%; border-radius:10px;">
      <h3>${s.title}</h3>
      <p>₹ ${s.rate}/hr</p>
      <p>${s.size}</p>
      <p>${s.status}</p>
      <button class="btn btn-primary" onclick="bookNow('${s.id}')">Book</button>
    </div>
  `).join("");

});

// =========================
// BOOK NOW
// =========================
function bookNow(spaceId){

  let spaces = getSpaces();
  let bookings = getBookings();

  const space = spaces.find(s => s.id == spaceId);
  if(!space) return;

  const newBooking = {
    bookingId: "B" + Date.now(),
    parkingId: space.id,
    title: space.title,
    rate: space.rate,
    ownerName: space.ownerName,
    status: "BOOKED",
    paymentStatus: "PENDING",
    date: new Date().toLocaleDateString()
  };

  bookings.push(newBooking);
  saveBookings(bookings);

  alert("Booking Created ✅");

  window.location.href = "user_bookings.html";
}

// =========================
// PAYMENT NAVIGATION
// =========================
function goToBookings(){
  window.location.href = "user_bookings.html";
}

function goToHome(){
  window.location.href = "user_dashboard.html";
}
