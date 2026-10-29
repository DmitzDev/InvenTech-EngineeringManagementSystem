import { jsPDF } from 'jspdf';

/**
 * Generates and downloads an official Universidad de Dagupan Return Clearance Receipt PDF.
 * Designed with crisp vector lines (#000000) and zero AI slop so students can present
 * the PDF on their phone (or printed) to their Laboratory Professor / Custodian.
 *
 * @param {Object} receiptData
 * @param {string} receiptData.txId - Official Transaction ID (e.g. UDD-DIGITAL-20261029-1234)
 * @param {string} receiptData.studentName - Student Full Name
 * @param {string} receiptData.studentId - Student ID Number (e.g. 23-1374-693)
 * @param {string} receiptData.program - Academic Program (e.g. BSCPE)
 * @param {string} receiptData.courseCode - Course Code (e.g. 31-BSCPE-01)
 * @param {string} receiptData.groupNo - Group Number
 * @param {string} receiptData.instructor - Professor / Instructor In-Charge
 * @param {string} receiptData.date - Date Returned string
 * @param {string} receiptData.timestamp - Time Returned string
 * @param {Array}  receiptData.items - Returned apparatus list [{ name, tagCode, qty, unit, returnCondition }]
 */
export function generateReturnReceiptPdf(receiptData = {}) {
  const {
    txId = 'UDD-RETURN-RECEIPT',
    studentName = 'STUDENT BORROWER',
    studentId = 'N/A',
    program = 'ENGINEERING',
    courseCode = 'LAB-CLASS',
    groupNo = '1',
    instructor = 'Laboratory Professor / Instructor',
    date = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    items = [],
  } = receiptData;

  // Create A4 portrait document in mm (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = 210;
  const margin = 12;
  const contentW = pageW - margin * 2; // 186mm

  // Pure black vector stroke & text
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);

  // Outer institutional border frame
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, contentW, 273);

  // Top-right ISO control block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('UdD-FM-LM-RETURN-01', pageW - margin - 5, margin + 7, { align: 'right' });
  doc.text('Effectivity Date: July 1, 2024', pageW - margin - 5, margin + 11, { align: 'right' });
  doc.text(`Ref: ${txId}`, pageW - margin - 5, margin + 15, { align: 'right' });

  // Main Institutional Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LABORATORY EQUIPMENT RETURN CLEARANCE RECEIPT', pageW / 2, margin + 23, {
    align: 'center',
  });

  doc.setFontSize(11);
  doc.text('UNIVERSIDAD DE DAGUPAN', pageW / 2, margin + 28.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'School of Engineering • Laboratory Custody & Equipment Management System',
    pageW / 2,
    margin + 33,
    { align: 'center' }
  );

  // Header divider line
  doc.setLineWidth(0.5);
  doc.line(margin + 5, margin + 37, pageW - margin - 5, margin + 37);

  // Status Banner Box
  doc.setLineWidth(0.4);
  doc.rect(margin + 5, margin + 41, contentW - 10, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    'STATUS: OFFICIALLY RETURNED & RECORDED FOR PROFESSOR / CUSTODIAN VERIFICATION',
    pageW / 2,
    margin + 47.3,
    { align: 'center' }
  );

  // Student & Session Metadata Grid
  let y = margin + 58;
  const leftLabelX = margin + 6;
  const leftValX = margin + 36;
  const rightLabelX = margin + 102;
  const rightValX = margin + 136;

  const drawMetaRow = (lLabel, lVal, rLabel, rVal, rowY) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(lLabel, leftLabelX, rowY);
    doc.text(':', leftValX - 3, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(String(lVal || 'N/A').slice(0, 32), leftValX, rowY);
    doc.setLineWidth(0.3);
    doc.line(leftValX, rowY + 1.2, margin + 96, rowY + 1.2);

    doc.setFont('helvetica', 'bold');
    doc.text(rLabel, rightLabelX, rowY);
    doc.text(':', rightValX - 3, rowY);
    doc.text(String(rVal || 'N/A').slice(0, 28), rightValX, rowY);
    doc.line(rightValX, rowY + 1.2, pageW - margin - 6, rowY + 1.2);
  };

  drawMetaRow('Student Name', String(studentName).toUpperCase(), 'Student ID No.', studentId, y);
  y += 8;
  drawMetaRow('Program & Sec', `${program} (${courseCode || 'N/A'})`, 'Date Returned', date, y);
  y += 8;
  drawMetaRow('Instructor', instructor || 'Faculty In-Charge', 'Time Checked In', timestamp, y);
  y += 8;
  drawMetaRow('Group Number', `Group ${groupNo || '1'}`, 'Transaction Ref', txId, y);

  // Returned Apparatus Table Header
  y += 9;
  const tableX = margin + 5;
  const tableW = contentW - 10; // 176mm
  const colWidths = [12, 24, 82, 30, 28]; // # (12), Qty (24), Description (82), Tag Code (30), Condition (28) = 176mm
  const colX = [tableX];
  for (let i = 0; i < colWidths.length; i++) {
    colX.push(colX[i] + colWidths[i]);
  }

  const headerH = 9;
  doc.setLineWidth(0.45);
  doc.rect(tableX, y, tableW, headerH);
  for (let c = 1; c < colWidths.length; c++) {
    doc.line(colX[c], y, colX[c], y + headerH);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('#', (colX[0] + colX[1]) / 2, y + 5.8, { align: 'center' });
  doc.text('Qty Returned', (colX[1] + colX[2]) / 2, y + 5.8, { align: 'center' });
  doc.text('Returned Apparatus Description', (colX[2] + colX[3]) / 2, y + 5.8, {
    align: 'center',
  });
  doc.text('Tag Code', (colX[3] + colX[4]) / 2, y + 5.8, { align: 'center' });
  doc.text('Condition', (colX[4] + colX[5]) / 2, y + 5.8, { align: 'center' });

  y += headerH;

  // Render 12 fixed rows so the receipt looks like an official ledger sheet
  const totalRows = Math.max(10, Math.min(15, items.length || 10));
  const rowH = 8.5;

  for (let r = 0; r < totalRows; r++) {
    const item = items[r];
    doc.setLineWidth(0.35);
    doc.rect(tableX, y, tableW, rowH);
    for (let c = 1; c < colWidths.length; c++) {
      doc.line(colX[c], y, colX[c], y + rowH);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(String(r + 1), (colX[0] + colX[1]) / 2, y + 5.6, { align: 'center' });

    if (item) {
      const qtyStr = `${item.qtyReturned || item.qty || 1} ${item.unit || 'pc'}`;
      const condStr =
        item.returnCondition === 'damaged'
          ? 'DAMAGED'
          : item.returnCondition === 'needs_repair'
          ? 'NEEDS REPAIR'
          : 'GOOD / CLEARED';

      doc.setFont('helvetica', 'bold');
      doc.text(qtyStr, (colX[1] + colX[2]) / 2, y + 5.6, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.text(String(item.name || 'Apparatus').slice(0, 44), colX[2] + 2.5, y + 5.6);

      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.text(String(item.tagCode || 'N/A').slice(0, 16), (colX[3] + colX[4]) / 2, y + 5.6, {
        align: 'center',
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(condStr, (colX[4] + colX[5]) / 2, y + 5.6, { align: 'center' });
    }

    y += rowH;
  }

  // Summary Strip under table
  y += 5;
  const totalUnits = items.reduce((sum, it) => sum + Number(it.qtyReturned || it.qty || 1), 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `Total Distinct Apparatus Returned: ${items.length} Item(s)   •   Total Units Checked In: ${totalUnits} Unit(s)`,
    margin + 6,
    y
  );

  // Verification / Clearance Note Box
  y += 6;
  doc.setLineWidth(0.4);
  doc.rect(margin + 5, y, contentW - 10, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('OFFICIAL RETURN CLEARANCE & PROFESSOR VERIFICATION', pageW / 2, y + 5.5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'This digital/printable receipt certifies that the student identified above has completed the return check-in',
    pageW / 2,
    y + 11,
    { align: 'center' }
  );
  doc.text(
    'process at the School of Engineering Laboratory Kiosk. Present this receipt to your Laboratory Professor or',
    pageW / 2,
    y + 15.5,
    { align: 'center' }
  );
  doc.text(
    'Laboratory Custodian for final physical counter-verification and class clearance.',
    pageW / 2,
    y + 20,
    { align: 'center' }
  );

  // Signatures Block at bottom
  const sigY = 264;
  doc.setLineWidth(0.4);
  doc.line(margin + 10, sigY, margin + 84, sigY);
  doc.line(pageW - margin - 84, sigY, pageW - margin - 10, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(String(studentName).toUpperCase(), margin + 47, sigY - 2, { align: 'center' });
  if (instructor && instructor !== 'Laboratory Professor / Instructor') {
    doc.text(String(instructor).toUpperCase(), pageW - margin - 47, sigY - 2, {
      align: 'center',
    });
  }

  doc.setFontSize(8);
  doc.text("Student Borrower's Signature Over Printed Name", margin + 47, sigY + 4.5, {
    align: 'center',
  });
  doc.text('Laboratory Professor / Custodian Verification', pageW - margin - 47, sigY + 4.5, {
    align: 'center',
  });

  // Footer Timestamp
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `Generated by InvenTech Engineering Kiosk • Ref: ${txId} • ${date} ${timestamp}`,
    pageW / 2,
    281,
    { align: 'center' }
  );

  const cleanFileId = String(studentId || txId).replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `UdD_Return_Receipt_${cleanFileId}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(fileName);
  return fileName;
}
