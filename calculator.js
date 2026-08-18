// ---- Quantity-based items (sinks) ----
const QTY_ITEMS = [
  { id: "jointSink", label: "Joint Sink", rate: 3000, unit: "pc" },
  { id: "moldSink",  label: "Mold Sink",  rate: 6000, unit: "pc" },
];

// ---- Sqft-based items, calculated from Length x Width ----
const LW_ITEMS = [
  { id: "slab",     label: "Slab",                rate: 180 },
  { id: "nosing30", label: "Nosing (30mm slab)",   rate: 80  },
  { id: "nosing20", label: "Nosing (20mm slab)",   rate: 40  },
  { id: "beeding",  label: "Beeding",              rate: 140 },
];

const form = document.getElementById("calcForm");
const resultBox = document.getElementById("resultBox");
const resultLines = document.getElementById("resultLines");
const resultTotal = document.getElementById("resultTotal");
const clearBtn = document.getElementById("clearBtn");

// Format numbers as Indian Rupees (e.g. 1,23,000)
function formatRupees(num) {
  return "₹" + Math.round(num).toLocaleString("en-IN");
}

// +/- steppers for sink quantities
document.querySelectorAll(".stepper").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const step = parseInt(btn.getAttribute("data-step"), 10);
    const input = document.getElementById(targetId);
    const current = parseFloat(input.value) || 0;
    const next = Math.max(0, current + step);
    input.value = next === 0 ? "" : next;
  });
});

// Live sqft preview under each Length x Width row
function getSqft(itemId) {
  const l = parseFloat(document.getElementById(`${itemId}_l`).value) || 0;
  const w = parseFloat(document.getElementById(`${itemId}_w`).value) || 0;
  return l * w;
}

function updatePreview(itemId) {
  const preview = document.getElementById(`${itemId}_preview`);
  const sqft = getSqft(itemId);
  if (sqft > 0) {
    preview.textContent = `= ${sqft.toFixed(2)} sqft`;
    preview.classList.add("filled");
  } else {
    preview.textContent = "";
    preview.classList.remove("filled");
  }
}

LW_ITEMS.forEach((item) => {
  document.getElementById(`${item.id}_l`).addEventListener("input", () => updatePreview(item.id));
  document.getElementById(`${item.id}_w`).addEventListener("input", () => updatePreview(item.id));
});

// Clear all fields and hide result
clearBtn.addEventListener("click", () => {
  form.reset();
  LW_ITEMS.forEach((item) => updatePreview(item.id));
  resultBox.classList.add("hidden");
});

// Calculate and show bill on submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  let total = 0;
  let html = "";
  let anyFilled = false;
  const billLines = [];

  // Quantity items (sinks)
  QTY_ITEMS.forEach((item) => {
    const qty = parseFloat(document.getElementById(item.id).value) || 0;
    if (qty > 0) {
      anyFilled = true;
      const lineTotal = qty * item.rate;
      total += lineTotal;
      html += `
        <div class="result-line">
          <span>${item.label} · ${qty} ${item.unit} × ${formatRupees(item.rate)}</span>
          <span>${formatRupees(lineTotal)}</span>
        </div>`;
      billLines.push({
        label: item.label,
        detail: `${qty} ${item.unit} × ${formatRupees(item.rate)}`,
        lineTotal,
      });
    }
  });

  // Sqft items (slab / nosing / beeding), from Length x Width
  LW_ITEMS.forEach((item) => {
    const sqft = getSqft(item.id);
    if (sqft > 0) {
      anyFilled = true;
      const lineTotal = sqft * item.rate;
      total += lineTotal;
      const l = parseFloat(document.getElementById(`${item.id}_l`).value) || 0;
      const w = parseFloat(document.getElementById(`${item.id}_w`).value) || 0;
      html += `
        <div class="result-line">
          <span>${item.label} · ${l}ft × ${w}ft = ${sqft.toFixed(2)} sqft × ${formatRupees(item.rate)}</span>
          <span>${formatRupees(lineTotal)}</span>
        </div>`;
      billLines.push({
        label: item.label,
        detail: `${l}ft × ${w}ft = ${sqft.toFixed(2)} sqft × ${formatRupees(item.rate)}/sqft`,
        lineTotal,
      });
    }
  });

  if (!anyFilled) {
    html = `<div class="empty-note">Enter at least one item to get a total.</div>`;
  }

  resultLines.innerHTML = html;
  resultTotal.textContent = formatRupees(total);
  resultBox.classList.remove("hidden");

  // Store current bill data globally so PDF/print/WhatsApp can use it
  window.currentBill = billLines;
  window.currentBillTotal = total;

  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
});
