const receiptCard = document.getElementById("receiptCard");
const noDataNote = document.getElementById("noDataNote");
const pageActions = document.getElementById("pageActions");

const itemsList = document.getElementById("itemsList");
const metaReceiptNo = document.getElementById("metaReceiptNo");
const metaDate = document.getElementById("metaDate");
const metaTime = document.getElementById("metaTime");
const metaTotal = document.getElementById("metaTotal");

function formatRupees(num) {
  return "₹" + Math.round(num).toLocaleString("en-IN");
}

// jsPDF's default font can't render the ₹ symbol correctly, so PDF text uses "Rs." instead
function formatRupeesForPdf(num) {
  return "Rs. " + Math.round(num).toLocaleString("en-IN");
}

// ---- Load the bill saved by the calculator page ----
const raw = sessionStorage.getItem("rks_receipt");

if (!raw) {
  // No data found — hide the receipt card and actions, show a note instead
  receiptCard.style.display = "none";
  pageActions.style.display = "none";
  noDataNote.classList.remove("hidden");
} else {
  const data = JSON.parse(raw);
  const dt = new Date(data.dateTime);

  metaReceiptNo.textContent = data.receiptNo;
  metaDate.textContent = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  metaTime.textContent = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  metaTotal.textContent = formatRupees(data.total);

  itemsList.innerHTML = data.items
    .map(
      (item) => `
      <div class="item-row">
        <div>
          <div class="item-name">${item.label}</div>
          <div class="item-detail">${item.detail}</div>
        </div>
        <div class="item-amount">${formatRupees(item.lineTotal)}</div>
      </div>`
    )
    .join("");

  window.receiptData = data;
}

// ---- Download this receipt as PDF ----
document.getElementById("downloadPdfBtn").addEventListener("click", () => {
  if (!window.receiptData) return;
  const data = window.receiptData;
  const dt = new Date(data.dateTime);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageWidth = 210;
  const marginX = 16;
  const rightX = pageWidth - marginX;
  let y = 20;

  doc.setDrawColor(180);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, 260);

  doc.setFontSize(17);
  doc.setFont(undefined, "bold");
  doc.setTextColor(20);
  doc.text("Rohith Kitchen & Stone Fabrications", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(110);
  doc.text("Kuppam, Andhra Pradesh", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setDrawColor(200);
  doc.line(marginX, y, rightX, y);
  y += 8;

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.setTextColor(20);
  doc.text("PAYMENT RECEIPT", marginX, y);

  doc.setFontSize(9.5);
  doc.setFont(undefined, "normal");
  doc.setTextColor(90);
  const dateStr = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  doc.text(`Date: ${dateStr}   Time: ${timeStr}`, rightX, y - 4, { align: "right" });
  doc.text(`Receipt No: ${data.receiptNo}`, rightX, y + 2, { align: "right" });
  y += 12;

  doc.setFillColor(240, 236, 228);
  doc.rect(marginX, y, rightX - marginX, 8, "F");
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(40);
  doc.text("Description", marginX + 3, y + 5.5);
  doc.text("Amount", rightX - 3, y + 5.5, { align: "right" });
  y += 8;

  doc.setFont(undefined, "normal");
  data.items.forEach((line, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(250, 248, 244);
      doc.rect(marginX, y, rightX - marginX, 14, "F");
    }
    doc.setFontSize(10.5);
    doc.setTextColor(30);
    doc.text(line.label, marginX + 3, y + 6);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(line.detail, marginX + 3, y + 11);
    doc.setFontSize(10.5);
    doc.setTextColor(30);
    doc.text(formatRupeesForPdf(line.lineTotal), rightX - 3, y + 8.5, { align: "right" });
    y += 14;
  });

  y += 2;
  doc.setDrawColor(200);
  doc.line(marginX, y, rightX, y);
  y += 10;

  doc.setFillColor(217, 160, 91);
  doc.rect(marginX, y - 6, rightX - marginX, 12, "F");
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.setTextColor(30);
  doc.text("TOTAL", marginX + 3, y + 2);
  doc.text(formatRupeesForPdf(data.total), rightX - 3, y + 2, { align: "right" });
  y += 20;

  doc.setFontSize(9.5);
  doc.setFont(undefined, "italic");
  doc.setTextColor(120);
  doc.text("This is an estimate. Final price may vary based on site measurements.", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text("Thank you for choosing Rohith Kitchen & Stone Fabrications!", pageWidth / 2, y, { align: "center" });

  doc.save(`receipt-${data.receiptNo}.pdf`);
});

// ---- Print this receipt ----
document.getElementById("printReceiptBtn").addEventListener("click", () => {
  window.print();
});

// ---- Send this receipt on WhatsApp ----
document.getElementById("whatsappReceiptBtn").addEventListener("click", () => {
  if (!window.receiptData) return;
  const data = window.receiptData;
  const dt = new Date(data.dateTime);

  let message = "*Rohith Kitchen & Stone Fabrications*\n";
  message += `Receipt No: ${data.receiptNo}\n`;
  message += `Date: ${dt.toLocaleDateString("en-IN")}  Time: ${dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}\n\n`;

  data.items.forEach((line) => {
    message += `${line.label} — ${line.detail} = ${formatRupees(line.lineTotal)}\n`;
  });

  message += `\n*Total: ${formatRupees(data.total)}*`;

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
});