const API = "/api/inventory";
let inventory = [];

//Category 
const CATEGORY_LABEL = { Book: "Books", Magazine: "Magazines", Stationery: "Stationery" };

const LOW_STOCK_THRESHOLD = 5;

// UI REFERENCES
const tableBody    = document.getElementById("inventoryBody");
const dateLine     = document.getElementById("dateLine");
const timeLine     = document.getElementById("timeLine");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle   = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const filterSelect = document.getElementById("filterSelect");
const searchInput  = document.getElementById("searchInput");

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
    inventory = await res.json();
    renderTable();
    lucide.createIcons();
  } catch (err) {
    console.error("Failed to load inventory:", err);
  }
}

// TABLE
function getProductAvatar(name, category) {
  const initial = name.charAt(0).toUpperCase();
  let bgColor = "var(--brand-light)";
  let textColor = "var(--brand-primary)";
  
  if (category === "Book") { bgColor = "#fef3c7"; textColor = "#d97706"; }
  if (category === "Magazine") { bgColor = "#e9d5ff"; textColor = "#7c3aed"; }
  if (category === "Stationery") { bgColor = "#fed7aa"; textColor = "#ea580c"; }

  return `
    <div class="product-avatar" style="background:${bgColor}; color:${textColor};">
      ${initial}
    </div>`;
}

function renderTable() {
  if (!tableBody) return;

  tableBody.innerHTML = "";

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
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
            <i data-lucide="package-search" style="width:48px; height:48px; opacity:0.2;"></i>
            <span>No products found matching your criteria.</span>
          </div>
        </td>
      </tr>`;
    lucide.createIcons();
  } else {
    filtered.forEach(item => {
      const globalIdx = inventory.indexOf(item);
      const isLow     = item.quantity <= LOW_STOCK_THRESHOLD;
      const row       = document.createElement("tr");
      row.innerHTML   = `
        <td style="font-weight:600;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${getProductAvatar(item.name, item.category)}
            <span>${item.name}</span>
          </div>
        </td>
        <td>&#8369;${parseFloat(item.price).toFixed(2)}</td>
        <td>
          <span class="badge ${isLow ? "badge-low" : "badge-ok"}">
            ${isLow ? '<i data-lucide="alert-triangle" style="width:12px; height:12px; margin-right:4px;"></i>' : ""}
            ${item.quantity} ${isLow ? "Low Stock" : "In Stock"}
          </span>
        </td>
        <td style="color:var(--text-secondary);">${CATEGORY_LABEL[item.category] || item.category}</td>
        <td class="actions-cell">
          <button class="btn-ghost view-btn" data-idx="${globalIdx}" title="View Details">
            <i data-lucide="eye"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    tableBody.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => openViewModal(inventory[parseInt(btn.dataset.idx)]));
    });
    lucide.createIcons();
  }

  updateCategoryCounts();
  updateAlertCount();
}

//CATEGORY COUNT UPDATESS
function updateCategoryCounts() {
  const counts = { Books: 0, Magazines: 0, Stationery: 0 };
  inventory.forEach(item => {
    const label = CATEGORY_LABEL[item.category] || item.category;
    if (counts.hasOwnProperty(label)) counts[label] += item.quantity;
  });
  
  document.querySelectorAll(".stat-card").forEach(card => {
    const category = card.dataset.category;
    const valEl = card.querySelector(".stat-value");
    if (valEl && counts[category] !== undefined) {
      valEl.textContent = counts[category];
    }
  });
}

function updateAlertCount() {
  const lowItems = inventory.filter(i => i.quantity <= LOW_STOCK_THRESHOLD);
  const countEl = document.getElementById("alertCount");
  if (countEl) {
    if (lowItems.length > 0) {
      countEl.textContent = lowItems.length;
      countEl.style.display = "flex";
    } else {
      countEl.style.display = "none";
    }
  }
}


//  MODAL UTILITIES
function getFreshConfirmBtn() {
  const old = document.getElementById("modalConfirmBtn");
  const fresh = old.cloneNode(true);
  fresh.style.display = ""; // Reset display if hidden by showLoading
  fresh.textContent = "Confirm"; // Default text
  old.parentNode.replaceChild(fresh, old);

  // Also ensure the standard Cancel button is visible
  const cancelBtn = modalOverlay.querySelector(".btn-secondary:not(#modalConfirmBtn)");
  if (cancelBtn) cancelBtn.style.display = "";

  return fresh;
}

function setModalBody(html) {
  const body = modalOverlay.querySelector(".modal-body");
  if (body) body.innerHTML = html;
}

function closeModal() {
  modalOverlay.style.display = "none";
}

function showLoading(message = "Processing...") {
  modalTitle.textContent = "Please Wait";
  modalSubtitle.textContent = "";
  setModalBody(`
    <div style="text-align:center; padding: 32px 0;">
      <div class="spinner-container" style="margin-bottom: 20px;">
        <i data-lucide="loader-2" class="animate-spin" style="width:40px; height:40px; color:var(--brand-primary);"></i>
      </div>
      <p style="color:var(--text-secondary); font-size:14px; font-weight:500;">${message}</p>
    </div>
  `);
  modalOverlay.style.display = "flex";
  lucide.createIcons();
  
  const btn = getFreshConfirmBtn();
  btn.style.display = "none"; // Hide button during loading
}

/**
 * Custom Alert/Confirmation System
 * Replaces native alert() and confirm()
 */
function showAlert(title, message, type = "info", onConfirm = null) {
  modalTitle.textContent = title;
  modalSubtitle.textContent = "";
  
  let icon = "info";
  let color = "var(--brand-primary)";
  if (type === "success") { icon = "check-circle"; color = "var(--success)"; }
  if (type === "error") { icon = "x-circle"; color = "var(--error)"; }
  if (type === "warning") { icon = "alert-triangle"; color = "var(--warning)"; }

  setModalBody(`
    <div style="text-align:center; padding: 12px 0;">
      <div style="width:64px; height:64px; background:var(--brand-light); color:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
        <i data-lucide="${icon}" style="width:32px; height:32px;"></i>
      </div>
      <p style="font-size:15px; color:var(--text-secondary); line-height:1.6;">${message}</p>
    </div>
  `);

  modalOverlay.style.display = "flex";
  lucide.createIcons();

  // Handle the two buttons
  const confirmBtn = getFreshConfirmBtn();
  const cancelBtn  = modalOverlay.querySelector(".btn-secondary:not(#modalConfirmBtn)");
  
  if (onConfirm) {
    // Confirmation mode: show both
    if (cancelBtn) cancelBtn.style.display = "inline-flex";
    confirmBtn.textContent = "Confirm";
    confirmBtn.className = "btn btn-primary";
    confirmBtn.onclick = () => { closeModal(); onConfirm(); };
  } else {
    // Alert mode: hide cancel button, use confirmBtn as "Close"
    if (cancelBtn) cancelBtn.style.display = "none";
    confirmBtn.textContent = "Close";
    confirmBtn.className = "btn btn-secondary";
    confirmBtn.onclick = closeModal;
  }
}

//  SPECIFIC FIELDS
function toggleSpecificFields() {
  const type      = document.getElementById("pType")?.value;
  const container = document.getElementById("specificFields");
  if (!container || !type) return;
  container.innerHTML = "";

  if (type === "Book") {
    container.innerHTML = `
      <div class="field-divider"></div>
      <div class="form-row">
        <div class="form-group">
          <label>Author</label>
          <input type="text" id="pAuthor" placeholder="e.g. J.K. Rowling">
        </div>
        <div class="form-group">
          <label>ISBN</label>
          <input type="text" id="pISBN" placeholder="978-0-306-40615-7">
        </div>
      </div>
      <div class="form-group">
        <label>Genre</label>
        <input type="text" id="pGenre" placeholder="e.g. Fantasy">
      </div>`;
  } else if (type === "Magazine") {
    container.innerHTML = `
      <div class="field-divider"></div>
      <div class="form-row">
        <div class="form-group">
          <label>Issue Number</label>
          <input type="number" id="pIssue" placeholder="42">
        </div>
        <div class="form-group">
          <label>Publication Date</label>
          <input type="date" id="pPubDate">
        </div>
      </div>`;
  } else if (type === "Stationery") {
    container.innerHTML = `
      <div class="field-divider"></div>
      <div class="form-row">
        <div class="form-group">
          <label>Brand</label>
          <input type="text" id="pBrand" placeholder="e.g. Faber-Castell">
        </div>
        <div class="form-group">
          <label>Size</label>
          <input type="text" id="pSize" placeholder="e.g. A4">
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
  modalSubtitle.textContent = "Enter the details of the new inventory item.";
  setModalBody(`
    <div class="form-group">
      <label>Product Name</label>
      <input type="text" id="pName" placeholder="e.g. C# Programming">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Price (PHP)</label>
        <input type="number" id="pPrice" step="0.01" placeholder="0.00" min="0">
      </div>
      <div class="form-group">
        <label>Quantity</label>
        <input type="number" id="pQty" placeholder="0" min="0">
      </div>
    </div>
    <div class="form-group">
      <label>Category Type</label>
      <select id="pType" onchange="toggleSpecificFields()">
        <option value="Book">Book</option>
        <option value="Magazine">Magazine</option>
        <option value="Stationery">Stationery</option>
      </select>
    </div>
    <div id="specificFields"></div>
  `);
  toggleSpecificFields();
  modalOverlay.style.display = "flex";

  const btn = getFreshConfirmBtn();
  btn.textContent = "Add Product";
  btn.onclick = async () => {
    const name  = document.getElementById("pName")?.value.trim();
    const price = parseFloat(document.getElementById("pPrice")?.value) || 0;
    const qty   = parseInt(document.getElementById("pQty")?.value)     || 0;
    const type  = document.getElementById("pType")?.value;

    if (!name) { 
      showAlert("Missing Information", "Please provide a product name before continuing.", "warning");
      return; 
    }

    const product = { name, price, quantity: qty, category: type, ...readSpecificFields(type) };

    showLoading("Adding product to inventory...");

    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });

      await loadInventory();
      showAlert("Product Added", `${name} has been successfully added to your inventory.`, "success");
    } catch (err) {
      showAlert("Error", "Failed to add product. Please try again.", "error");
    }
  };
}

//  UPDATE PRODUCT
function openUpdateModal() {
  modalTitle.textContent = "Update Product";
  modalSubtitle.textContent = "Modify an existing product's stock or pricing.";
  
  const options = inventory.map(item => `<option value="${item.id}">${item.name}</option>`).join("");

  setModalBody(`
    <div class="form-group">
      <label>Select Product</label>
      <select id="updateId">
        <option value="" disabled selected>Choose a product...</option>
        ${options}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>New Quantity</label>
        <input type="number" id="newQty" placeholder="0" min="0">
      </div>
      <div class="form-group">
        <label>New Price (PHP) <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
        <input type="number" id="newPrice" step="0.01" placeholder="Leave blank to keep current" min="0">
      </div>
    </div>
  `);
  modalOverlay.style.display = "flex";

  const btn = getFreshConfirmBtn();
  btn.textContent = "Update Product";
  btn.onclick = async () => {
    const targetId = document.getElementById("updateId")?.value;
    const newQty   = document.getElementById("newQty")?.value;
    const newPrice = document.getElementById("newPrice")?.value;

    const item = inventory.find(i => i.id == targetId);
    if (!item) { 
      showAlert("Selection Required", "Please select a product to update.", "warning");
      return; 
    }

    showLoading("Updating product details...");

    try {
      await fetch(`${API}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: newQty   !== "" ? parseInt(newQty)        : item.quantity,
          price:    newPrice !== "" ? parseFloat(newPrice)    : parseFloat(item.price)
        })
      });

      await loadInventory();
      showAlert("Update Successful", "The product details have been updated.", "success");
    } catch (err) {
      showAlert("Error", "Failed to update product.", "error");
    }
  };
}

//  DELETE PRODUCT
function openDeleteModal() {
  modalTitle.textContent = "Delete Product";
  modalSubtitle.textContent = "Select an item to permanently remove it from inventory.";
  
  const options = inventory.map(item => `<option value="${item.id}">${item.name} (${CATEGORY_LABEL[item.category] || item.category})</option>`).join("");

  setModalBody(`
    <div class="form-group">
      <label>Select Product</label>
      <select id="delId">
        <option value="" disabled selected>Choose a product...</option>
        ${options}
      </select>
    </div>
    <div style="display:flex; align-items:center; gap:8px; color:var(--error); font-size:12px; font-weight:600; margin-top: 8px;">
      <i data-lucide="alert-circle" style="width:14px; height:14px;"></i>
      <span>This action is irreversible.</span>
    </div>
  `);
  modalOverlay.style.display = "flex";
  lucide.createIcons();

  const btn = getFreshConfirmBtn();
  btn.textContent = "Delete Product";
  btn.onclick = async () => {
    const targetId = document.getElementById("delId")?.value;
    const item = inventory.find(i => i.id == targetId);

    if (!item) { 
      showAlert("Selection Required", "Please select a product to delete.", "warning");
      return; 
    }

    showAlert("Confirm Deletion", `Are you sure you want to remove ${item.name} from your inventory?`, "warning", async () => {
      try {
        showLoading(`Removing ${item.name}...`);
        await fetch(`${API}/${item.id}`, { method: "DELETE" });
        await loadInventory();
        showAlert("Deleted", "Product has been removed.", "success");
      } catch (err) {
        showAlert("Error", "Failed to delete product.", "error");
      }
    });
  };
}

//CHECK ALERTS
async function openAlertsModal() {
  modalTitle.textContent = "Stock Alerts";
  modalSubtitle.textContent = "Items currently at or below threshold.";

  const res      = await fetch(`${API}/alerts`);
  const lowItems = await res.json();

  let bodyHtml = "";
  if (lowItems.length === 0) {
    bodyHtml = `
      <div style="text-align:center; padding: 24px 0;">
        <div style="width:64px; height:64px; background:var(--brand-light); color:var(--brand-primary); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
          <i data-lucide="check-circle" style="width:32px; height:32px;"></i>
        </div>
        <p style="font-weight:600;">Inventory Healthy</p>
        <p style="font-size:13px; color:var(--text-secondary);">All products are sufficiently stocked.</p>
      </div>`;
  } else {
    bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${lowItems.map(i => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-radius:var(--radius-sm); background:#fff5f5; border:1px solid #fed7d7;">
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:600; font-size:14px;">${i.name}</span>
              <span style="font-size:12px; color:var(--text-secondary);">${CATEGORY_LABEL[i.category] || i.category}</span>
            </div>
            <span class="badge badge-low">${i.quantity} left</span>
          </div>`).join("")}
      </div>
    `;
  }

  setModalBody(bodyHtml);
  modalOverlay.style.display = "flex";
  lucide.createIcons();

  const btn = getFreshConfirmBtn();
  btn.textContent = "Close";
  btn.onclick = closeModal;
}

//  VIEW PRODUCT
function openViewModal(item) {
  modalTitle.textContent = "Product Details";
  modalSubtitle.textContent = "Complete specifications for this inventory item.";

  let specificHtml = "";
  if (item.category === "Book") {
    specificHtml = `
      <div class="field-divider"></div>
      <div class="form-row">
        <div class="form-group"><label>Author</label><input type="text" value="${item.author || "—"}" readonly></div>
        <div class="form-group"><label>ISBN</label><input type="text" value="${item.isbn || "—"}" readonly></div>
      </div>
      <div class="form-group"><label>Genre</label><input type="text" value="${item.genre || "—"}" readonly></div>`;
  } else if (item.category === "Magazine") {
    specificHtml = `
      <div class="field-divider"></div>
      <div class="form-row">
        <div class="form-group"><label>Issue</label><input type="text" value="${item.issue || "—"}" readonly></div>
        <div class="form-group"><label>Pub. Date</label><input type="text" value="${item.pubDate || "—"}" readonly></div>
      </div>`;
  } else if (item.category === "Stationery") {
    specificHtml = `
      <div class="field-divider"></div>
      <div class="form-row">
        <div class="form-group"><label>Brand</label><input type="text" value="${item.brand || "—"}" readonly></div>
        <div class="form-group"><label>Size</label><input type="text" value="${item.size || "—"}" readonly></div>
      </div>`;
  }

  setModalBody(`
    <div class="form-group"><label>Product Name</label><input type="text" value="${item.name}" readonly></div>
    <div class="form-row">
      <div class="form-group"><label>Price (PHP)</label><input type="text" value="&#8369;${parseFloat(item.price).toFixed(2)}" readonly></div>
      <div class="form-group"><label>Quantity</label><input type="text" value="${item.quantity}" readonly></div>
    </div>
    <div class="form-group"><label>Category</label><input type="text" value="${CATEGORY_LABEL[item.category] || item.category}" readonly></div>
    ${specificHtml}
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
document.getElementById("alertsBtn")?.addEventListener("click", openAlertsModal);

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    searchInput?.focus();
  }
});

modalOverlay?.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

document.getElementById("exitBtn")?.addEventListener("click", () => {
  showAlert("Exit System", "Are you sure you want to exit ShelfSense? Any unsaved form data will be lost.", "warning", () => {
    window.close();
  });
});

//  TIME
setInterval(updateClock, 1000);
updateClock();
loadInventory();