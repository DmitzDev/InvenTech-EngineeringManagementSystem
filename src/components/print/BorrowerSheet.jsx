import React, { useEffect, useRef } from 'react';
import { useTransaction } from '../../context/TransactionContext';
import JsBarcode from 'jsbarcode';

export default function BorrowerSheet({ isScreenPreview = false }) {
  const { borrower, cart, transactionId, timestamp } = useTransaction();
  const barcodeRef = useRef(null);

  const activeTxCode = transactionId || 'UDD-DIGITAL-20260826-5725';

  // Render authentic Code128 Barcode for Transaction ID (Always active & visible)
  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, activeTxCode, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.0,
          height: 22,
          displayValue: true,
          fontSize: 8.5,
          textMargin: 1,
          margin: 0,
          font: 'monospace',
        });
      } catch (e) {
        console.error('Barcode render error', e);
      }
    }
  }, [activeTxCode]);

  // Create exactly 15 rows as per ISO format
  const rows = Array.from({ length: 15 }, (_, i) => {
    const item = cart[i];
    return {
      index: i + 1,
      qtyRequested: item ? `${item.qty} ${item.unit || ''}` : '',
      description: item
        ? `${item.name} (${item.tagCode})${item.isDamaged ? ' [FLAGGED DAMAGE]' : ''}`
        : '',
      dateBorrowed: item ? borrower.date : '',
      dateReturned: '',
      qtyReturned: '',
      isDamaged: item?.isDamaged || false,
      isGood: item ? !item.isDamaged : false,
    };
  });

  return (
    <div
      id={isScreenPreview ? 'screen-preview-borrower-sheet' : 'printable-borrower-sheet'}
      className={
        isScreenPreview
          ? 'w-full max-w-[210mm] bg-white text-black p-4 font-sans text-xs leading-normal mx-auto rounded-lg shadow-sm'
          : 'print-only w-full max-w-[210mm] bg-white text-black p-4 font-sans text-xs leading-normal mx-auto'
      }
      style={{ backgroundColor: '#ffffff', color: '#000000' }}
    >
      {/* Top ISO Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
        {/* Left: University Logo */}
        <div className="w-16 shrink-0 flex items-center justify-start">
          <img
            src="/images/udd_logo.png"
            alt="UdD Logo"
            className="w-14 h-14 object-contain"
          />
        </div>

        {/* Center: University Title & Details (Center-Aligned) */}
        <div className="flex-1 text-center px-3">
          <h1 className="text-base font-extrabold uppercase tracking-wider text-black leading-tight">
            Universidad de Dagupan
          </h1>
          <p className="text-[10px] text-gray-800 leading-tight mt-0.5">
            Arellano St., Dagupan City, Pangasinan 2400 Philippines
          </p>
          <p className="text-[10.5px] font-bold text-gray-900 mt-0.5">
            School of Engineering • Laboratory Department
          </p>
        </div>

        {/* Right: Official Document Control Code Box */}
        <div className="w-44 shrink-0 text-right text-[9.5px] font-mono border border-black p-1.5 leading-tight">
          <div><span className="font-bold">Doc Code:</span> UdD-FM-LM-01A-01</div>
          <div><span className="font-bold">Effectivity Date:</span> July 1, 2024</div>
          <div><span className="font-bold">Revision No.:</span> 0</div>
          <div><span className="font-bold">TX Ref:</span> {activeTxCode}</div>
        </div>
      </div>

      {/* Sheet Title */}
      <div className="text-center py-1 bg-gray-100 border border-black mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black">
          Laboratory Equipment Borrower's Sheet
        </h2>
      </div>

      {/* Metadata Grid */}
      <table className="w-full border-collapse border border-black mb-2 text-[10px]">
        <tbody>
          <tr>
            <td className="border border-black p-1 font-bold bg-gray-50 w-24">Program :</td>
            <td className="border border-black p-1 font-bold">{borrower.program || 'BSEE'}</td>
            <td className="border border-black p-1 font-bold bg-gray-50 w-20">Date :</td>
            <td className="border border-black p-1">{borrower.date}</td>
            <td className="border border-black p-1 font-bold bg-gray-50 w-28">Course Code:</td>
            <td className="border border-black p-1 font-bold">{borrower.courseCode || 'EEAC2L'}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-gray-50">Actual Date:</td>
            <td className="border border-black p-1">{borrower.actualDate || borrower.date}</td>
            <td className="border border-black p-1 font-bold bg-gray-50">Time of Laboratory:</td>
            <td className="border border-black p-1" colSpan={3}>{borrower.labTime}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-gray-50">Group No.:</td>
            <td className="border border-black p-1">Group {borrower.groupNo || '1'}</td>
            <td className="border border-black p-1 font-bold bg-gray-50">Group Leader:</td>
            <td className="border border-black p-1 uppercase font-bold" colSpan={3}>
              {borrower.groupLeader || '_______________________________'}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1 font-bold bg-gray-50">Instructor :</td>
            <td className="border border-black p-1 font-bold" colSpan={5}>
              {borrower.instructor || 'Engr. Jin Benir Macaranas'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 15-Row Equipment Table */}
      <table className="w-full border-collapse border border-black mb-2 text-[9.5px]">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border border-black p-1 w-7">#</th>
            <th rowSpan={2} className="border border-black p-1 w-16">Qty. Requested</th>
            <th rowSpan={2} className="border border-black p-1">Qty. Requested Item Description</th>
            <th colSpan={6} className="border border-black p-0.5 text-[8.5px]">
              REMARKS <br />
              <span className="font-normal italic">(To be filled up by the Laboratory Custodian)</span>
            </th>
          </tr>
          <tr className="bg-gray-50 text-center text-[8.5px]">
            <th className="border border-black p-0.5 w-16">Date Borrowed</th>
            <th className="border border-black p-0.5 w-16">Date Returned</th>
            <th className="border border-black p-0.5 w-14">Qty. Returned</th>
            <th className="border border-black p-0.5 w-10">Damage</th>
            <th className="border border-black p-0.5 w-10">Lost</th>
            <th className="border border-black p-0.5 w-10">Good</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.index} className="h-5">
              <td className="border border-black text-center font-bold p-0.5">{row.index}</td>
              <td className="border border-black text-center font-bold p-0.5">{row.qtyRequested}</td>
              <td className="border border-black px-1.5 p-0.5 font-medium truncate max-w-[200px]">
                {row.description}
              </td>
              <td className="border border-black text-center text-[8px] p-0.5">{row.dateBorrowed}</td>
              <td className="border border-black text-center text-[8px] p-0.5">{row.dateReturned}</td>
              <td className="border border-black text-center font-bold p-0.5">{row.qtyReturned}</td>
              <td className="border border-black text-center p-0.5 font-bold">
                {row.isDamaged ? '✓' : ''}
              </td>
              <td className="border border-black text-center p-0.5 font-bold"></td>
              <td className="border border-black text-center p-0.5 font-bold">
                {row.isGood ? '✓' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Custodian Sign-off & Inspection Blocks */}
      <div className="border border-black p-2 mb-2 text-[9px]">
        <div className="grid grid-cols-3 gap-3">
          {/* Received in good condition */}
          <div className="space-y-4">
            <p className="font-semibold">Received in good condition:</p>
            <div className="border-b border-black text-center pt-2 font-bold uppercase text-[9px]">
              {borrower.groupLeader || '______________________________'}
            </div>
            <p className="text-center text-[8px] text-gray-600">Group Leader's Signature Over Printed Name</p>
          </div>

          {/* Returned in condition */}
          <div className="space-y-4">
            <p className="font-semibold">Returned in:</p>
            <div className="flex items-center justify-center gap-4 pt-1 font-bold text-[8.5px]">
              <span>[ ] GOOD</span>
              <span>[ ] BAD condition</span>
            </div>
            <div className="border-b border-black text-center pt-1 font-bold text-[8px]">
              ______________________________
            </div>
            <p className="text-center text-[8px] text-gray-600">Laboratory Custodian's Signature</p>
          </div>

          {/* Noted */}
          <div className="space-y-4">
            <p className="font-semibold">Noted:</p>
            <div className="border-b border-black text-center pt-2 font-bold text-[9px]">
              {borrower.instructor || '______________________________'}
            </div>
            <p className="text-center text-[8px] text-gray-600">Instructor's Signature</p>
          </div>
        </div>
      </div>

      {/* Loss / Breakage Acknowledgement Box */}
      <div className="border border-black p-2 text-[9px]">
        <h3 className="font-bold uppercase tracking-wider text-center mb-1 text-[9.5px]">
          LOSS/ BREAKAGE ACKNOWLEDGEMENT
        </h3>
        <p className="text-justify leading-snug mb-3 text-[8.5px]">
          I/ We hereby acknowledge that I/We received the above listed tools and / or equipments in good condition. I/ We hereby declare that I/
          We will either replace or pay the item(s) I/ We borrowed in the incident that after thorough inspection by the laboratory custodian/
          instructor, it was determined that the items are damaged or lost. The group leader and members shall be responsible for the
          settlement of the obligation.
        </p>

        <div className="grid grid-cols-2 gap-8 pt-1">
          <div className="text-center">
            <div className="border-b border-black pb-1 font-bold uppercase text-[9px]">
              {borrower.groupLeader || '_________________________________'}
            </div>
            <p className="text-[8px] text-gray-600 mt-0.5">Group Leader's Signature Over Printed Name</p>
          </div>

          <div className="text-center">
            <div className="border-b border-black pb-1 text-[9px]">
              _________________________________
            </div>
            <p className="text-[8px] text-gray-600 mt-0.5">Laboratory Custodian's Signature</p>
          </div>
        </div>
      </div>

      {/* Official Scannable Barcode & Footer Block (Always Rendered & Centered) */}
      <div className="border-t border-black pt-1.5 mt-1.5 text-center flex flex-col items-center justify-center space-y-0.5">
        {/* Crisp Centered Code128 Barcode with Transaction ID */}
        <div className="flex justify-center py-0.5">
          <svg ref={barcodeRef} style={{ minHeight: '26px' }}></svg>
        </div>

        {/* Compact Centered Footer Instructions */}
        <div className="text-[7.5px] text-gray-600 leading-tight space-y-0.5 max-w-[440px] mx-auto text-center">
          <p className="font-bold text-black uppercase tracking-wider text-[8px]">
            OFFICIAL EQUIPMENT RETURN BARCODE:
          </p>
          <p className="text-[7.5px] text-gray-700">
            Scan this barcode at the Custodian Counter upon returning apparatus for instant digital clearance check-in.
          </p>
          <p className="text-[7px] text-gray-500 font-mono pt-0.5">
            Issued: {borrower.date} • {timestamp || 'SYSTEM OFFICIAL'}
          </p>
        </div>
      </div>
    </div>
  );
}
