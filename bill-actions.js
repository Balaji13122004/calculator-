const downloadBtn = document.getElementById("downloadBtn");
const printBtn = document.getElementById("printBtn");
const whatsappBtn = document.getElementById("whatsappBtn");

// Format numbers as Rupees for text contexts (PDF / WhatsApp)
function formatRupeesForBill(num) {
  return "Rs. " + Math.round(num).toLocaleString("en-IN");
}

function hasBill() {
  if (!window.currentBill || window.currentBill.length === 0) {
    alert("Please add at least one item and click 'Get Total' first.");
    return false;
  }
  return true;
}

function getReceiptNumber() {
  // Simple receipt number based on today's date + a random 3-digit tail
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const tail = Math.floor(100 + Math.random() * 900);
  return `RKS-${y}${m}${day}-${tail}`;
}

// ---- Open the on-screen Receipt page in a new tab ----
downloadBtn.addEventListener("click", () => {
  if (!hasBill()) return;

  const receiptData = {
    receiptNo: getReceiptNumber(),
    dateTime: new Date().toISOString(),
    items: window.currentBill,
    total: window.currentBillTotal,
  };

  // Save the bill so receipt.html can read it after opening
  sessionStorage.setItem("rks_receipt", JSON.stringify(receiptData));

  window.open("receipt.html", "_blank");
});

// ---- Print ----
printBtn.addEventListener("click", () => {
  if (!hasBill()) return;
  window.print();
});

// ---- Send on WhatsApp ----
whatsappBtn.addEventListener("click", () => {
  if (!hasBill()) return;

  let message = "*Rohith Kitchen & Stone Fabrications*\n";
  message += "*Business Work — Receipt*\n\n";

  window.currentBill.forEach((line) => {
    message += `${line.label} — ${line.detail} = ${formatRupeesForBill(line.lineTotal)}\n`;
  });

  message += `\n*Total: ${formatRupeesForBill(window.currentBillTotal)}*`;

  const encodedMessage = encodeURIComponent(message);
  // No phone number pre-filled — opens WhatsApp so the customer picks who to send it to.
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
});
