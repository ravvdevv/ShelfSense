const API = "/api/inventory";
let inventory = [];

//Category 
const CATEGORY_LABEL = { Book: "Books", Magazine: "Magazines", Stationery: "Stationery" };

const LOW_STOCK_THRESHOLD = 5;

// UI REFERENCES
const tableBody    = document.querySelector(".table");
const dateLine     = document.getElementById("dateLine");
const timeLine     = document.getElementById("timeLine");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle   = document.getElementById("modalTitle");
const filterSelect = document.querySelector(".filter");
const searchInput  = document.querySelector(".search input");

//SIDEBAR TOGGLES
function toggleSidebar() {
  const app = document.getElementById("app");
  if (app) app.classList.toggle("collapsed");
}

//  LIVE CLOCK
function updateClock() {
  const now = new Date();
  if (dateLine) {
    const date    = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
    dateLine.textContent = `${date} | ${weekday}`;
  }
  if (timeLine) {
    timeLine.textContent = now
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      .toLowerCase()
      .replace(" ", "");
  }
}

// LOAD INVENTORY FROM API
async function loadInventory() {
  try {
    const res = await fetch(API);
    inventory  = await res.json();
    renderTable();
  } catch (err) {
    console.error("Failed to load inventory:", err);
  }
}

// TABLE
function renderTable() {
  if (!tableBody) return;

  const header = tableBody.querySelector(".table-head");
  tableBody.innerHTML = "";
  if (header) tableBody.appendChild(header);

  const filterVal = filterSelect ? filterSelect.value : "All";
  const searchVal = searchInput  ? searchInput.value.toLowerCase().trim() : "";

  const filtered = inventory.filter(item => {
    const matchesFilter =
      filterVal === "All" ||
      CATEGORY_LABEL[item.category] === filterVal ||
      item.category === filterVal;
    const matchesSearch =
      !searchVal || item.name.toLowerCase().includes(searchVal);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "table-row";
    empty.innerHTML = `<div class="muted" style="grid-column:1/-1;text-align:center;padding:12px 0;">No products found.</div>`;
    tableBody.appendChild(empty);
  } else {
    filtered.forEach(item => {
      const globalIdx = inventory.indexOf(item);
      const isLow     = item.quantity <= LOW_STOCK_THRESHOLD;
      const row       = document.createElement("div");
      row.className   = "table-row";
      row.innerHTML   = `
        <div>${item.name}</div>
        <div>&#8369;${parseFloat(item.price).toFixed(2)}</div>
        <div style="color:${isLow ? "#c0392b" : "inherit"};font-weight:${isLow ? "600" : "400"}">
          ${item.quantity}${isLow ? " &#9888;" : ""}
        </div>
        <div><button class="pill view-btn" data-idx="${globalIdx}">View</button></div>
        <div>${CATEGORY_LABEL[item.category] || item.category}</div>
      `;
      tableBody.appendChild(row);
    });

    tableBody.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => openViewModal(inventory[parseInt(btn.dataset.idx)]));
    });
  }

  updateCategoryCounts();
}

//CATEGORY COUNT UPDATESS
function updateCategoryCounts() {
  const counts = { Books: 0, Magazines: 0, Stationery: 0 };
  inventory.forEach(item => {
    const label = CATEGORY_LABEL[item.category] || item.category;
    if (counts.hasOwnProperty(label)) counts[label] += item.quantity;
  });
  document.querySelectorAll(".card").forEach(card => {
    const labelEl = card.querySelector(".label");
    if (!labelEl) return;
    const label = labelEl.textContent.trim();
    if (counts[label] !== undefined) {
      card.querySelector(".count").textContent = counts[label];
    }
  });
}


//  MODAL UTILITIES
function getFreshConfirmBtn() {
  const old   = document.getElementById("modalConfirmBtn");
  const fresh = old.cloneNode(true);
  old.parentNode.replaceChild(fresh, old);
  return fresh;
}

function setModalBody(html) {
  const body = modalOverlay.querySelector(".modal-body");
  if (body) body.innerHTML = html;
}

function closeModal() {
  modalOverlay.style.display = "none";
}

//  SPECIFIC FIELDS
function toggleSpecificFields() {
  const type      = document.getElementById("pType")?.value;
  const container = document.getElementById("specificFields");
  if (!container || !type) return;
  container.innerHTML = "";

  if (type === "Book") {
    container.innerHTML = `
      <div class="input-row">
        <div class="input-group">
          <label>Author</label>
          <input type="text" id="pAuthor" placeholder="e.g. J.K. Rowling">
        </div>
        <div class="input-group">
          <label>ISBN</label>
          <input type="text" id="pISBN" placeholder="978-0-306-40615-7">
        </div>
      </div>
      <div class="input-group">
        <label>Genre</label>
        <input type="text" id="pGenre" placeholder="e.g. Fantasy">
      </div>`;
  } else if (type === "Magazine") {
    container.innerHTML = `
      <div class="input-row">
        <div class="input-group">
          <label>Issue Number</label>
          <input type="number" id="pIssue" placeholder="42">
        </div>
        <div class="input-group">
          <label>Publication Date</label>
          <input type="date" id="pPubDate">
        </div>
      </div>`;
  } else if (type === "Stationery") {
    container.innerHTML = `
      <div class="input-row">
        <div class="input-group">
          <label>Brand</label>
          <input type="text" id="pBrand" placeholder="e.g. Faber-Castell">
        </div>
        <div class="input-group">
          <label>Size</label>
          <input type="text" id="pSize" placeholder="e.g. A4 or 0.7mm">
        </div>
      </div>`;
  }
}

function readSpecificFields(type) {
  if (type === "Book") {
    return {
      author: document.getElementById("pAuthor")?.value.trim() || "",
      isbn:   document.getElementById("pISBN")?.value.trim()   || "",
      genre:  document.getElementById("pGenre")?.value.trim()  || "",
    };
  }
  if (type === "Magazine") {
    return {
      issue:  document.getElementById("pIssue")?.value   || null,
      pubDate: document.getElementById("pPubDate")?.value || null,
    };
  }
  if (type === "Stationery") {
    return {
      brand: document.getElementById("pBrand")?.value.trim() || "",
      size:  document.getElementById("pSize")?.value.trim()  || "",
    };
  }
  return {};
}


//  ADD PRODUCT
function openAddModal() {
  modalTitle.textContent = "Add Product";
  setModalBody(`
    <div class="input-group">
      <label>Product Name</label>
      <input type="text" id="pName" placeholder="e.g. C# Programming">
    </div>
    <div class="input-row">
      <div class="input-group">
        <label>Price (PHP)</label>
        <input type="number" id="pPrice" step="0.01" placeholder="0.00" min="0">
      </div>
      <div class="input-group">
        <label>Quantity</label>
        <input type="number" id="pQty" placeholder="0" min="0">
      </div>
    </div>
    <div class="input-group">
      <label>Category Type</label>
      <select id="pType" onchange="toggleSpecificFields()">
        <option value="Book">Book</option>
        <option value="Magazine">Magazine</option>
        <option value="Stationery">Stationery</option>
      </select>
    </div>
    <div id="specificFields" class="specific-fields-area"></div>
  `);
  toggleSpecificFields();
  modalOverlay.style.display = "flex";

  const btn = getFreshConfirmBtn();
  btn.onclick = async () => {
    const name  = document.getElementById("pName")?.value.trim();
    const price = parseFloat(document.getElementById("pPrice")?.value) || 0;
    const qty   = parseInt(document.getElementById("pQty")?.value)     || 0;
    const type  = document.getElementById("pType")?.value;

    if (!name) { alert("Product Name is required!"); return; }

    const product = { name, price, quantity: qty, category: type, ...readSpecificFields(type) };

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });

    await loadInventory();
    closeModal();
  };
}

//  UPDATE PRODUCT
function openUpdateModal() {
  modalTitle.textContent = "Update Product";
  setModalBody(`
    <div class="input-group">
      <label>Product to Update</label>
      <input type="text" id="updateSearch" placeholder="Enter exact product name...">
    </div>
    <div class="input-group">
      <label>New Quantity</label>
      <input type="number" id="newQty" placeholder="0" min="0">
    </div>
    <div class="input-group">
      <label>New Price (PHP) <span style="font-weight:400;color:#b9a08a">(optional)</span></label>
      <input type="number" id="newPrice" step="0.01" placeholder="Leave blank to keep current" min="0">
    </div>
  `);
  modalOverlay.style.display = "flex";

  const btn = getFreshConfirmBtn();
  btn.onclick = async () => {
    const target   = document.getElementById("updateSearch")?.value.trim().toLowerCase();
    const newQty   = document.getElementById("newQty")?.value;
    const newPrice = document.getElementById("newPrice")?.value;

    const item = inventory.find(i => i.name.toLowerCase() === target);
    if (!item) { alert("Product not found!"); return; }

    await fetch(`${API}/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: newQty   !== "" ? parseInt(newQty)        : item.quantity,
        price:    newPrice !== "" ? parseFloat(newPrice)    : parseFloat(item.price)
      })
    });

    await loadInventory();
    closeModal();
  };
}

//  DELETE PRODUCT
function openDeleteModal() {
  modalTitle.textContent = "Delete Product";
  setModalBody(`
    <div class="input-group">
      <label>Product to Delete</label>
      <input type="text" id="delName" placeholder="Enter exact product name...">
    </div>
    <p style="color:#c0392b;font-size:0.85rem;margin:0;">This action cannot be undone.</p>
  `);
  modalOverlay.style.display = "flex";

  const btn = getFreshConfirmBtn();
  btn.onclick = async () => {
    const target = document.getElementById("delName")?.value.trim().toLowerCase();
    const item   = inventory.find(i => i.name.toLowerCase() === target);

    if (!item) { alert("Product not found!"); return; }

    await fetch(`${API}/${item.id}`, { method: "DELETE" });
    await loadInventory();
    closeModal();
  };
}

//CHECK ALERTS
async function openAlertsModal() {
  modalTitle.textContent = "Stock Alerts";

  const res      = await fetch(`${API}/alerts`);
  const lowItems = await res.json();

  let bodyHtml = "";
  if (lowItems.length === 0) {
    bodyHtml = `<p style="text-align:center;color:#6a4b37;padding:12px 0;">&#10003; All products are sufficiently stocked.</p>`;
  } else {
    bodyHtml = `
      <p style="color:#c0392b;font-size:0.85rem;margin:0 0 12px;">
        ${lowItems.length} product(s) at or below ${LOW_STOCK_THRESHOLD} units:
      </p>
      ${lowItems.map(i => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5ccb2;">
          <span>${i.name}</span>
          <span style="color:#c0392b;font-weight:600;">${i.quantity} left</span>
        </div>`).join("")}
    `;
  }

  setModalBody(bodyHtml);
  modalOverlay.style.display = "flex";

  const btn = getFreshConfirmBtn();
  btn.textContent = "Close";
  btn.onclick = closeModal;
}

//  VIEW PRODUCT
function openViewModal(item) {
  modalTitle.textContent = "Product Details";

  let specificHtml = "";
  if (item.category === "Book") {
    specificHtml = `
      <div class="input-row">
        <div class="input-group"><label>Author</label><input type="text" value="${item.author || "—"}" readonly></div>
        <div class="input-group"><label>ISBN</label><input type="text" value="${item.isbn || "—"}" readonly></div>
      </div>
      <div class="input-group"><label>Genre</label><input type="text" value="${item.genre || "—"}" readonly></div>`;
  } else if (item.category === "Magazine") {
    specificHtml = `
      <div class="input-row">
        <div class="input-group"><label>Issue</label><input type="text" value="${item.issue || "—"}" readonly></div>
        <div class="input-group"><label>Pub. Date</label><input type="text" value="${item.pubDate || "—"}" readonly></div>
      </div>`;
  } else if (item.category === "Stationery") {
    specificHtml = `
      <div class="input-row">
        <div class="input-group"><label>Brand</label><input type="text" value="${item.brand || "—"}" readonly></div>
        <div class="input-group"><label>Size</label><input type="text" value="${item.size || "—"}" readonly></div>
      </div>`;
  }

  setModalBody(`
    <div class="input-group"><label>Product Name</label><input type="text" value="${item.name}" readonly></div>
    <div class="input-row">
      <div class="input-group"><label>Price (PHP)</label><input type="text" value="&#8369;${parseFloat(item.price).toFixed(2)}" readonly></div>
      <div class="input-group"><label>Quantity</label><input type="text" value="${item.quantity}" readonly></div>
    </div>
    <div class="input-group"><label>Category</label><input type="text" value="${CATEGORY_LABEL[item.category] || item.category}" readonly></div>
    <div class="specific-fields-area" style="margin-top:0;">${specificHtml}</div>
  `);
  modalOverlay.style.display = "flex";

  const btn = getFreshConfirmBtn();
  btn.textContent = "Close";
  btn.onclick = closeModal;
}

// EVENT LISTENERS
document.querySelectorAll(".nav-item").forEach(item => {
  const label = item.querySelector(".nav-label")?.textContent.trim();
  if (!label) return;
  if (label === "Add Product")    item.addEventListener("click", openAddModal);
  if (label === "Update Product") item.addEventListener("click", openUpdateModal);
  if (label === "Delete Product") item.addEventListener("click", openDeleteModal);
  if (label === "Check Alerts")   item.addEventListener("click", openAlertsModal);
});

filterSelect?.addEventListener("change", renderTable);
searchInput?.addEventListener("input", renderTable);

modalOverlay?.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

document.querySelector(".exit")?.addEventListener("click", () => {
  if (confirm("Exit ShelfSense?")) window.close();
});

//  TIME
setInterval(updateClock, 1000);
updateClock();
loadInventory();