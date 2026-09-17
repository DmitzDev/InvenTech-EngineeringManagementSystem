import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageOrientation,
  Header,
  Footer,
  PageNumber,
} from 'docx';

const DEPT_CONFIGS = {
  ALL: {
    title: 'ALL ENGINEERING DEPARTMENTS MASTER INVENTORY',
    room: 'F201, F301, F303-F304, F204-F205',
    programs: 'BSCE, BSCpE, BSEE, BSECE',
  },
  CE: {
    title: 'CIVIL ENGINEERING LABORATORY',
    room: 'F301 CIVIL ENGINEERING LAB',
    programs: 'BSCE',
  },
  DIGITAL: {
    title: 'DIGITAL & MICROCONTROLLER LABORATORY',
    room: 'F303-F304 DIGITAL LAB',
    programs: 'BSCpE, BSEE',
  },
  ECE: {
    title: 'ELECTRONICS & COMMUNICATIONS ENGINEERING (ECE) LABORATORY',
    room: 'F303-F304 / Fame Bldg',
    programs: 'BSECE',
  },
  CHEM: {
    title: 'CHEMISTRY LABORATORY',
    room: 'F201 CHEMISTRY LAB',
    programs: 'BSEC, BSCE, BSEE, BSCPE, BSN, BSC',
  },
  PHYSICS: {
    title: 'PHYSICS & MECHANICS LABORATORY',
    room: 'F204 – F205 PHYSICS LAB',
    programs: 'BSCE, BSEE, BSCPE',
  },
};

/**
 * Generate official UdD-RM-LM-01A-02 Microsoft Word (.docx) document
 * matching InventorySlip.docx in A4 Landscape format.
 */
export async function exportInventoryToDocx(items, filterLab = 'ALL') {
  const dept = DEPT_CONFIGS[filterLab] || DEPT_CONFIGS.ALL;
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  const equipmentItems = items.filter((i) => (i.category || '').toLowerCase() !== 'consumables');
  const consumableItems = items.filter((i) => (i.category || '').toLowerCase() === 'consumables');

  // ==========================================
  // TABLE 1: Department Metadata Matrix (Matching InventorySlip.docx Table 1)
  // ==========================================
  const table1 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
    },
    rows: [
      new TableRow({
        children: [
          createMetaLabelCell('School:', 1800),
          createMetaValueCell('SCHOOL OF ENGINEERING', 5500, true),
          createMetaLabelCell('Program:', 1800),
          createMetaValueCell(dept.programs, 6500),
        ],
      }),
      new TableRow({
        children: [
          createMetaLabelCell('Semester/AY:', 1800),
          createMetaValueCell('2ND SEM / 2025 - 2026', 5500, true),
          createMetaLabelCell('Room:', 1800),
          createMetaValueCell(dept.room, 6500, true, '003366'),
        ],
      }),
      new TableRow({
        children: [
          createMetaLabelCell('Review Cycle:', 1800),
          createMetaValueCell('Semi-Annual', 5500),
          createMetaLabelCell('Date:', 1800),
          createMetaValueCell(currentDate, 6500, true),
        ],
      }),
    ],
  });

  // ==========================================
  // TABLE 2: 11-Column Inventory Table (Matching InventorySlip.docx Table 2)
  // ==========================================
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      createHeaderCell('Inventory Control ID', 2000),
      createHeaderCell('Description', 3400, AlignmentType.LEFT),
      createHeaderCell('Date of Acquisition', 1200),
      createHeaderCell('Available Quantity', 1200),
      createHeaderCell('CHED Requirement', 1200),
      createHeaderCell('Status', 1200),
      createHeaderCell('Condition', 1100),
      createHeaderCell('Safety Clearance', 1200),
      createHeaderCell('Last Calibration', 1100),
      createHeaderCell('Calibration Certificate', 1100),
      createHeaderCell('Preventive Maintenance Schedule', 1300),
    ],
  });

  const table2Rows = [headerRow];

  // Section A: Equipment / Apparatus
  if (equipmentItems.length > 0) {
    table2Rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 11,
            shading: { type: ShadingType.CLEAR, fill: 'E5E5E5' },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `A.  EQUIPMENT / APPARATUS (${equipmentItems.length} items)`,
                    bold: true,
                    size: 17,
                    font: 'Calibri',
                    color: '003366',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    equipmentItems.forEach((item, index) => {
      const bg = index % 2 === 0 ? 'FAFAFA' : 'FFFFFF';
      table2Rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createDataCell(item.tagCode || '—', 2000, AlignmentType.CENTER, bg, true),
            createDataCell(item.name || '—', 3400, AlignmentType.LEFT, bg),
            createDataCell('N/A', 1200, AlignmentType.CENTER, bg),
            createDataCell(`${item.stock} ${item.unit || 'pc'}`, 1200, AlignmentType.CENTER, bg, true),
            createDataCell(item.chedReq || '5 pcs', 1200, AlignmentType.CENTER, bg),
            createDataCell(item.status || 'Passed Inspection', 1200, AlignmentType.CENTER, bg),
            createDataCell(item.condition || 'Functional', 1100, AlignmentType.CENTER, bg),
            createDataCell(item.safetyClearance || 'Safe for Use', 1200, AlignmentType.CENTER, bg),
            createDataCell('N/A', 1100, AlignmentType.CENTER, bg),
            createDataCell('N/A', 1100, AlignmentType.CENTER, bg),
            createDataCell('Semi-Annual', 1300, AlignmentType.CENTER, bg),
          ],
        })
      );
    });
  }

  // Section B: Consumables
  if (consumableItems.length > 0) {
    table2Rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 11,
            shading: { type: ShadingType.CLEAR, fill: 'E5E5E5' },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `B.  CONSUMABLES (${consumableItems.length} items)`,
                    bold: true,
                    size: 17,
                    font: 'Calibri',
                    color: '003366',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    consumableItems.forEach((item, index) => {
      const bg = index % 2 === 0 ? 'FAFAFA' : 'FFFFFF';
      table2Rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            createDataCell(item.tagCode || '—', 2000, AlignmentType.CENTER, bg, true),
            createDataCell(item.name || '—', 3400, AlignmentType.LEFT, bg),
            createDataCell('N/A', 1200, AlignmentType.CENTER, bg),
            createDataCell(`${item.stock} ${item.unit || 'pc'}`, 1200, AlignmentType.CENTER, bg, true),
            createDataCell(item.chedReq || '10 pcs', 1200, AlignmentType.CENTER, bg),
            createDataCell(item.status || 'Available', 1200, AlignmentType.CENTER, bg),
            createDataCell(item.condition || 'Good', 1100, AlignmentType.CENTER, bg),
            createDataCell(item.safetyClearance || 'Safe for Use', 1200, AlignmentType.CENTER, bg),
            createDataCell('N/A', 1100, AlignmentType.CENTER, bg),
            createDataCell('N/A', 1100, AlignmentType.CENTER, bg),
            createDataCell('Semi-Annual', 1300, AlignmentType.CENTER, bg),
          ],
        })
      );
    });
  }

  const table2 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D0D0D0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'D0D0D0' },
    },
    rows: table2Rows,
  });

  // ==========================================
  // TABLE 3: Official Signatories Matrix (Matching InventorySlip.docx Table 3)
  // ==========================================
  const table3 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          createSignatoryCell('Prepared by:', 'Mr. Ronald Allan Bandong', 'Laboratory Custodian', 7500),
          createSignatoryCell('Checked by:', 'Engr. Romulo Roel U. Pinlac', 'Head, Laboratory Management', 8500),
        ],
      }),
      new TableRow({
        children: [
          createSignatoryCell('Noted:', 'Engr. Bryan Jumer S. Resuello', 'Property Officer', 7500),
          createSignatoryCell('Approved & Confirmed by:', 'ENGR. JOSE JAY R. DE VERA, ECE, MEngg-ECE, Ph. D', 'Dean, School of Engineering', 8500),
        ],
      }),
    ],
  });

  // ==========================================
  // DOCUMENT CONSTRUCTION (A4 Landscape)
  // ==========================================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838, // A4 Landscape DXA
              height: 11906,
            },
            margin: {
              top: 576, // 0.4 inch
              right: 576,
              bottom: 576,
              left: 576,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'UdD-RM-LM-01A-02 | Official Laboratory Management Inventory',
                    size: 15,
                    color: '666666',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Universidad de Dagupan — School of Engineering • Page ',
                    size: 15,
                    color: '888888',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: '888888',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 15,
                    color: '888888',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: '888888',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Institutional Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: 'UNIVERSIDAD DE DAGUPAN',
                bold: true,
                size: 26,
                color: '003366',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: 'Arellano St., Dagupan City, Pangasinan',
                size: 17,
                color: '444444',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'LABORATORY MANAGEMENT INVENTORY',
                bold: true,
                size: 21,
                color: '000000',
                font: 'Calibri',
              }),
            ],
          }),

          // Table 1
          table1,

          // Spacing
          new Paragraph({ spacing: { after: 120 } }),

          // Table 2
          table2,

          // Spacing
          new Paragraph({ spacing: { after: 160 } }),

          // Table 3 (Signatories)
          table3,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `UdD-RM-LM-01A-02_Inventory_${filterLab}_${new Date().toISOString().slice(0, 10)}.docx`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return fileName;
}

// Helpers
function createMetaLabelCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 16, font: 'Calibri' })],
      }),
    ],
  });
}

function createMetaValueCell(text, width, isBold = false, color = '000000') {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: isBold, color, size: 16, font: 'Calibri' })],
      }),
    ],
  });
}

function createHeaderCell(text, width, alignment = AlignmentType.CENTER) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: '003366' },
    verticalAlign: AlignmentType.CENTER,
    margins: { top: 100, bottom: 100, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment,
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 15, font: 'Calibri' })],
      }),
    ],
  });
}

function createDataCell(text, width, alignment, bgHex, isBold = false) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: bgHex },
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment,
        children: [new TextRun({ text, bold: isBold, color: '222222', size: 15, font: 'Calibri' })],
      }),
    ],
  });
}

function createSignatoryCell(label, name, title, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: label, bold: true, size: 16, font: 'Calibri', color: '444444' })],
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: `  ${name}  `,
            bold: true,
            size: 16,
            font: 'Calibri',
            color: '000000',
          }),
        ],
      }),
      new Paragraph({
        children: [new TextRun({ text: title, size: 15, font: 'Calibri', color: '666666' })],
      }),
    ],
  });
}
