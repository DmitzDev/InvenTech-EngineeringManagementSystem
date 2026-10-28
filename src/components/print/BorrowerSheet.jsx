import React from 'react';
import { useTransaction } from '../../context/TransactionContext';

export default function BorrowerSheet({ isScreenPreview = false }) {
  const { borrower, cart, transactionId } = useTransaction();

  const activeTxCode = transactionId || 'UDD-DIGITAL-20260826-5725';

  // Create exactly 15 rows as per official UdD-FM-LM-01A-01 ISO format
  const rows = Array.from({ length: 15 }, (_, i) => {
    const item = cart[i];
    return {
      index: i + 1,
      qtyRequested: item ? `${item.qty} ${item.unit || ''}`.trim() : '',
      description: item
        ? `${item.name} (${item.tagCode}) • [${
            item.lab === 'DIGITAL'
              ? 'Digital Lab'
              : item.lab === 'ECE'
              ? 'ECE Lab'
              : item.lab === 'CE'
              ? 'CE Lab'
              : item.lab === 'CHEM'
              ? 'Chem Lab'
              : item.lab === 'PHYSICS'
              ? 'Physics Lab'
              : `${item.lab} Lab`
          }]${item.isDamaged ? ' [NOTED DEFECT]' : ''}`
        : '',
      dateBorrowed: item ? borrower.date : '',
      dateReturned: '',
      qtyReturned: '',
      isDamaged: false,
      isGood: false,
    };
  });

  const programDisplay = borrower.program
    ? `${borrower.program}${borrower.yearLevel ? ` ${borrower.yearLevel}-${borrower.section || '01'}` : ''}`
    : '';

  const dateCourseDisplay = [borrower.date, borrower.courseCode]
    .filter(Boolean)
    .join('   •   ');

  const groupLeaderDisplay = borrower.groupLeader
    ? `${borrower.groupLeader}${borrower.studentId ? ` (${borrower.studentId})` : ''}`
    : '';

  return (
    <div
      id={isScreenPreview ? 'screen-preview-borrower-sheet' : 'printable-borrower-sheet'}
      className={
        isScreenPreview
          ? 'w-full max-w-[210mm] min-h-[286mm] bg-white text-black p-6 font-sans text-xs leading-normal mx-auto border-2 border-black flex flex-col justify-between box-border'
          : 'print-only w-[200mm] min-h-[286mm] h-[286mm] bg-white text-black font-sans text-xs leading-normal mx-auto border-2 border-black flex flex-col justify-between box-border'
      }
      style={{
        backgroundColor: '#ffffff',
        color: '#000000',
        borderColor: '#000000',
      }}
    >
      {/* ========================================================= */}
      {/* 1. TOP DOCUMENT CONTROL CODE & UNIVERSITY HEADER          */}
      {/* ========================================================= */}
      <div>
        {/* Top-Right ISO Document Control Block */}
        <div className="flex justify-end text-right text-[9.5px] font-bold leading-snug text-black mb-1">
          <div>
            <div>UdD-FM-LM-01A-01</div>
            <div>Effectivity Date: July 1, 2024</div>
            <div>Revision No.: 0</div>
            <div className="font-mono text-[8.5px] font-semibold">Ref: {activeTxCode}</div>
          </div>
        </div>

        {/* University Crest + Centered Sheet Title */}
        <div className="relative flex items-center justify-center pb-3">
          <div className="absolute left-2 top-0 flex items-center">
            <img
              src="/images/udd_logo.png"
              alt="Universidad de Dagupan Logo"
              className="w-20 h-20 object-contain"
            />
          </div>

          <div className="text-center px-24">
            <h1 className="text-[18px] font-extrabold tracking-tight text-black leading-tight">
              Laboratory Equipment Borrower&apos;s Sheet
            </h1>
            <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-black mt-0.5">
              UNIVERSIDAD DE DAGUPAN
            </h2>
            <p className="text-[10.5px] font-normal text-black mt-0.5">
              Arellano St., Dagupan City, Pangasinan
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. TWO-COLUMN UNDERLINED METADATA FIELDS                  */}
        {/* ========================================================= */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-2 text-[11px] text-black mt-2 mb-3 px-1">
          {/* Left Column */}
          <div className="col-span-6 space-y-2">
            <div className="flex items-end">
              <span className="font-bold w-24 shrink-0 flex justify-between pr-1">
                <span>Program</span>
                <span>:</span>
              </span>
              <div
                className="flex-1 font-bold uppercase px-1.5 pb-0.5 min-h-[18px]"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {programDisplay}
              </div>
            </div>

            <div className="flex items-end">
              <span className="font-bold w-24 shrink-0 flex justify-between pr-1">
                <span>Actual Date</span>
                <span>:</span>
              </span>
              <div
                className="flex-1 font-semibold px-1.5 pb-0.5 min-h-[18px]"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {borrower.actualDate || borrower.date || ''}
              </div>
            </div>

            <div className="flex items-end">
              <span className="font-bold w-24 shrink-0 flex justify-between pr-1">
                <span>Group No.</span>
                <span>:</span>
              </span>
              <div
                className="flex-1 font-bold px-1.5 pb-0.5 min-h-[18px]"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {borrower.groupNo ? `Group ${borrower.groupNo}` : ''}
              </div>
            </div>

            <div className="flex items-end">
              <span className="font-bold w-24 shrink-0 flex justify-between pr-1">
                <span>Instructor</span>
                <span>:</span>
              </span>
              <div
                className="flex-1 font-bold px-1.5 pb-0.5 min-h-[18px]"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {borrower.instructor || ''}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-6 space-y-2">
            <div className="flex items-end">
              <span className="font-bold w-36 shrink-0">Date : Course Code:</span>
              <div
                className="flex-1 font-bold px-1.5 pb-0.5 min-h-[18px]"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {dateCourseDisplay}
              </div>
            </div>

            <div className="flex items-end">
              <span className="font-bold w-36 shrink-0">Time of Laboratory:</span>
              <div
                className="flex-1 font-semibold px-1.5 pb-0.5 min-h-[18px]"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {borrower.labTime || ''}
              </div>
            </div>

            <div className="flex items-end">
              <span className="font-bold w-36 shrink-0">Group Leader:</span>
              <div
                className="flex-1 font-bold uppercase px-1.5 pb-0.5 min-h-[18px] truncate"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {groupLeaderDisplay}
              </div>
            </div>

            <div className="flex items-end">
              <span className="font-bold w-36 shrink-0"></span>
              <div
                className="flex-1 font-semibold px-1.5 pb-0.5 min-h-[18px] text-[9.5px] truncate"
                style={{ borderBottom: '1.5px solid #000000' }}
              >
                {borrower.purpose || ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. 15-ROW EQUIPMENT TABLE (CRISP PURE BLACK 1.5PX LINES)  */}
      {/* ========================================================= */}
      <div className="my-1 flex-1 flex flex-col justify-center">
        <table
          className="borrower-sheet-table w-full border-collapse text-[10px] text-black"
          style={{ border: '1.5px solid #000000' }}
        >
          <thead>
            <tr className="text-center font-bold">
              <th
                rowSpan={2}
                className="p-1.5 w-8 text-center font-extrabold"
                style={{ border: '1.5px solid #000000' }}
              >
                #
              </th>
              <th
                rowSpan={2}
                className="p-1.5 w-24 text-center font-extrabold leading-tight"
                style={{ border: '1.5px solid #000000' }}
              >
                Qty.
                <br />
                Requested
              </th>
              <th
                rowSpan={2}
                className="p-1.5 text-center font-extrabold leading-tight"
                style={{ border: '1.5px solid #000000' }}
              >
                Qty. Requested
                <br />
                Item Description
              </th>
              <th
                colSpan={6}
                className="py-1 px-1.5 text-center leading-tight"
                style={{ border: '1.5px solid #000000' }}
              >
                <div className="font-extrabold text-[9.5px] uppercase">REMARKS</div>
                <div className="font-normal text-[8px]">
                  (To be filled up by the Laboratory Custodian)
                </div>
              </th>
            </tr>
            <tr className="text-center font-bold text-[9px] leading-tight">
              <th className="py-1 px-1 w-16" style={{ border: '1.5px solid #000000' }}>
                Date
                <br />
                Borrowed
              </th>
              <th className="py-1 px-1 w-16" style={{ border: '1.5px solid #000000' }}>
                Date
                <br />
                Returned
              </th>
              <th className="py-1 px-1 w-16" style={{ border: '1.5px solid #000000' }}>
                Qty.
                <br />
                Returned
              </th>
              <th className="py-1 px-1 w-14" style={{ border: '1.5px solid #000000' }}>
                Damage
              </th>
              <th className="py-1 px-1 w-12" style={{ border: '1.5px solid #000000' }}>
                Lost
              </th>
              <th className="py-1 px-1 w-12" style={{ border: '1.5px solid #000000' }}>
                Good
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.index} className="h-[26px]">
                <td
                  className="text-center font-extrabold px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.index}
                </td>
                <td
                  className="text-center font-bold px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.qtyRequested}
                </td>
                <td
                  className="px-2 py-0.5 font-semibold text-[9.5px] leading-tight max-w-[260px] truncate"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.description}
                </td>
                <td
                  className="text-center text-[8.5px] font-medium px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.dateBorrowed}
                </td>
                <td
                  className="text-center text-[8.5px] px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.dateReturned}
                </td>
                <td
                  className="text-center font-bold px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.qtyReturned}
                </td>
                <td
                  className="text-center font-bold px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.isDamaged ? '✓' : ''}
                </td>
                <td
                  className="text-center font-bold px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                ></td>
                <td
                  className="text-center font-bold px-1 py-0.5"
                  style={{ border: '1.5px solid #000000' }}
                >
                  {row.isGood ? '✓' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* 4. RECEIVED / RETURNED / LOSS & BREAKAGE ACKNOWLEDGEMENT  */}
      {/* ========================================================= */}
      <div className="pt-2 space-y-2.5 text-black">
        {/* Received in good condition & Returned in GOOD / BAD condition */}
        <div className="grid grid-cols-2 gap-8 px-2 text-[10px]">
          <div>
            <div className="font-bold mb-5">Received in good condition:</div>
            <div
              className="relative text-center font-bold uppercase text-[9.5px] min-h-[20px] flex items-center justify-center pb-0.5"
              style={{ borderBottom: '1.5px solid #000000' }}
            >
              {borrower.signature && (
                <img
                  src={borrower.signature}
                  alt="Student Digital Signature"
                  className="h-9 max-w-[150px] object-contain absolute -top-5 pointer-events-none"
                  style={{ filter: 'grayscale(100%) contrast(250%)' }}
                />
              )}
              <span>{borrower.groupLeader || ''}</span>
            </div>
            <div className="text-center font-bold text-[9px] mt-0.5">
              Group Leader&apos;s Signature Over Printed Name
            </div>
            <div className="font-bold text-[9.5px] mt-1.5">Noted:</div>
          </div>

          <div>
            <div className="flex items-center gap-3 font-bold mb-5">
              <span>Returned in</span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-3.5 h-3.5"
                  style={{ border: '1.5px solid #000000' }}
                />
                <span>GOOD</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-3.5 h-3.5"
                  style={{ border: '1.5px solid #000000' }}
                />
                <span>BAD condition:</span>
              </span>
            </div>
            <div
              className="text-center font-bold text-[9.5px] min-h-[20px] pb-0.5"
              style={{ borderBottom: '1.5px solid #000000' }}
            />
            <div className="text-center font-bold text-[9px] mt-0.5">
              Laboratory Custodian&apos;s Signature
            </div>
          </div>
        </div>

        {/* LOSS / BREAKAGE ACKNOWLEDGEMENT BOX */}
        <div
          className="px-4 py-2.5 text-[9.5px]"
          style={{ border: '1.5px solid #000000' }}
        >
          <h3 className="font-extrabold uppercase tracking-wide text-center mb-1.5 text-[10.5px] text-black">
            LOSS/ BREAKAGE ACKNOWLEDGEMENT
          </h3>
          <p className="text-justify leading-snug text-black font-normal">
            I/ We hereby acknowledge that I/We received the above listed tools and / or equipments
            in good condition. I/ We hereby declare that I/ We will either replace or pay the
            item(s) I/ We borrowed in the incident that after thorough inspection by the laboratory
            custodian/ instructor, it was determined that the items are damaged or lost. The group
            leader and members shall be responsible for the settlement of the obligation.
          </p>
        </div>

        {/* Bottom Signatures: Instructor's Signature & Group Leader's Signature */}
        <div className="grid grid-cols-2 gap-10 px-4 pt-5 pb-1 text-[9.5px]">
          <div className="text-center">
            <div
              className="font-bold uppercase min-h-[20px] flex items-center justify-center pb-0.5"
              style={{ borderBottom: '1.5px solid #000000' }}
            >
              <span>{borrower.instructor || ''}</span>
            </div>
            <div className="font-bold text-[9.5px] mt-0.5">Instructor&apos;s Signature</div>
          </div>

          <div className="text-center">
            <div
              className="relative font-bold uppercase min-h-[20px] flex items-center justify-center pb-0.5"
              style={{ borderBottom: '1.5px solid #000000' }}
            >
              {borrower.signature && (
                <img
                  src={borrower.signature}
                  alt="Student Digital Signature"
                  className="h-9 max-w-[150px] object-contain absolute -top-5 pointer-events-none"
                  style={{ filter: 'grayscale(100%) contrast(250%)' }}
                />
              )}
              <span>{borrower.groupLeader || ''}</span>
            </div>
            <div className="font-bold text-[9.5px] mt-0.5">Group Leader&apos;s Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
