import { jsPDF } from 'jspdf';

/**
 * Generates and downloads an authentic 80mm POS Thermal Fastfood-Style Receipt PDF.
 * Styled with monospace typography, dashed cut lines, itemized matrix, and clear
 * Return & Custodian Verification stamps.
 *
 * @param {Object} receiptData
 */
export function generateReturnReceiptPdf(receiptData = {}) {
  const {
    txId = 'UDD-RET-RECEIPT',
    studentName = 'STUDENT BORROWER',
    studentId = 'N/A',
    program = 'ENGINEERING',
    courseCode = 'LAB-CLASS',
    groupNo = '1',
    instructor = 'Laboratory Professor',
    date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    items = [],
  } = receiptData;

  // Calculate dynamic roll height based on number of items (standard 80mm thermal receipt)
  const baseHeight = 150;
  const itemHeight = Math.max(items.length, 1) * 8.5;
  const totalHeight = Math.max(170, baseHeight + itemHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, totalHeight], // Standard 80mm thermal receipt roll width
  });

  const pageW = 80;
  const leftX = 4;
  const rightX = pageW - 4; // 76mm
  const centerX = pageW / 2; // 40mm

  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);

  let y = 7;

  // Helper function to draw receipt dashed rule (----------------)
  const drawDashedLine = (lineY) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text('------------------------------------------', centerX, lineY, { align: 'center' });
  };

  const drawDoubleDashedLine = (lineY) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text('==========================================', centerX, lineY, { align: 'center' });
  };

  // Top University & Laboratory Header (Fastfood Receipt Style)
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.text('UNIVERSIDAD DE DAGUPAN', centerX, y, { align: 'center' });
  y += 4.2;

  doc.setFontSize(8.5);
  doc.text('SCHOOL OF ENGINEERING', centerX, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('Arellano St., Dagupan City, Pangasinan', centerX, y, { align: 'center' });
  y += 3.2;
  doc.text('LABORATORY CUSTODY KIOSK STATION', centerX, y, { align: 'center' });
  y += 4;

  drawDoubleDashedLine(y);
  y += 4.5;

  // Receipt Slip Title
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text('** OFFICIAL RETURN RECEIPT **', centerX, y, { align: 'center' });
  y += 4;

  doc.setFontSize(7.5);
  doc.text('FORM UdD-FM-LM-RETURN-01', centerX, y, { align: 'center' });
  y += 3.5;

  drawDashedLine(y);
  y += 4.5;

  // Transaction & Student Details (Two-Column Monospace Print)
  const printKeyValue = (label, val, currY) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(label, leftX, currY);
    doc.setFont('courier', 'normal');
    doc.text(String(val || 'N/A').slice(0, 24), rightX, currY, { align: 'right' });
  };

  printKeyValue('TX REF NO :', txId, y);
  y += 3.8;
  printKeyValue('DATE / TIME:', `${date} ${timestamp}`, y);
  y += 3.8;
  printKeyValue('STUDENT ID :', studentId, y);
  y += 3.8;
  printKeyValue('BORROWER   :', String(studentName).toUpperCase().slice(0, 22), y);
  y += 3.8;
  printKeyValue('PROGRAM    :', `${program} (Grp ${groupNo || '1'})`, y);
  y += 3.8;
  printKeyValue('COURSE CODE:', courseCode, y);
  y += 3.8;
  printKeyValue('INSTRUCTOR :', instructor.slice(0, 22), y);
  y += 4;

  drawDoubleDashedLine(y);
  y += 4.5;

  // Table Column Header (ITEM / QTY / STATUS)
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITEM DESCRIPTION', leftX, y);
  doc.text('QTY', 54, y, { align: 'center' });
  doc.text('STATUS', rightX, y, { align: 'right' });
  y += 3.5;

  drawDashedLine(y);
  y += 4;

  // Itemized List
  let totalQty = 0;
  items.forEach((item, idx) => {
    const q = Number(item.qtyReturned || item.qty || 1);
    totalQty += q;
    const cond =
      item.returnCondition === 'damaged'
        ? 'DAMAGED'
        : item.returnCondition === 'needs_repair'
        ? 'REPAIR'
        : 'CLEARED';

    // Line 1: Item Number & Name
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    const itemName = `${idx + 1}. ${item.name || 'Apparatus'}`.slice(0, 26);
    doc.text(itemName, leftX, y);

    doc.setFont('courier', 'bold');
    doc.text(String(q), 54, y, { align: 'center' });
    doc.text(cond, rightX, y, { align: 'right' });
    y += 3.2;

    // Line 2: Tag Code & Locker Reference
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.text(`   TAG: ${item.tagCode || 'TAG-N/A'}`, leftX, y);
    y += 4.2;
  });

  drawDashedLine(y);
  y += 4.5;

  // Totals & Items Summary
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL RETURNED ITEMS:', leftX, y);
  doc.text(`${items.length} ITEM(S)`, rightX, y, { align: 'right' });
  y += 3.8;

  doc.text('TOTAL UNITS CLEARED :', leftX, y);
  doc.text(`${totalQty} UNIT(S)`, rightX, y, { align: 'right' });
  y += 4;

  drawDoubleDashedLine(y);
  y += 4.5;

  // Return Clearance Verification Stamp
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('*** RETURN CHECK-IN VERIFIED ***', centerX, y, { align: 'center' });
  y += 3.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.text('All listed apparatus have been officially', centerX, y, { align: 'center' });
  y += 3.2;
  doc.text('logged into the Laboratory Kiosk Database.', centerX, y, { align: 'center' });
  y += 3.2;
  doc.text('Show this receipt to your Professor / Custodian.', centerX, y, { align: 'center' });
  y += 5.5;

  // Barcode representation
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(`|||||||||||||||||||||||||||||||||||`, centerX, y, { align: 'center' });
  y += 3.5;
  doc.setFontSize(7);
  doc.text(`* ${txId} *`, centerX, y, { align: 'center' });
  y += 4.5;

  // Thermal Cut Line
  drawDashedLine(y);
  y += 4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.text('*** THANK YOU & KEEP LABS SAFE ***', centerX, y, { align: 'center' });

  const cleanFileId = String(studentId || txId).replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `UdD_Receipt_${cleanFileId}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(fileName);
  return fileName;
}
