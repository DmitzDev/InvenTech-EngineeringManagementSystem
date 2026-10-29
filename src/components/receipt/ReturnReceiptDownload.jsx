import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTransaction } from '../../context/TransactionContext';
import { fetchTransactionsFromSupabase } from '../../services/supabaseDataService';
import { generateReturnReceiptPdf } from '../../utils/generateReturnReceiptPdf';

/**
 * Decodes compact URL payload if present (?d=<base64>)
 */
function decodeCompactPayload(encoded) {
  if (!encoded) return null;
  try {
    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(jsonStr);
    if (!parsed) return null;
    return {
      txId: parsed.t || 'UDD-RETURN-RECEIPT',
      studentName: parsed.n || 'STUDENT BORROWER',
      studentId: parsed.s || 'N/A',
      program: parsed.p || 'ENGINEERING',
      courseCode: parsed.c || 'LAB-CLASS',
      groupNo: parsed.g || '1',
      instructor: parsed.i || 'Laboratory Professor',
      date:
        parsed.dt ||
        new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      timestamp:
        parsed.tm ||
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      items: Array.isArray(parsed.it)
        ? parsed.it.map((arr) => ({
            name: arr[0] || 'Apparatus',
            tagCode: arr[1] || 'N/A',
            qty: arr[2] || 1,
            qtyReturned: arr[2] || 1,
            unit: arr[3] || 'pc',
            returnCondition: 'good',
          }))
        : [],
    };
  } catch (e) {
    console.warn('Failed to decode compact QR receipt payload:', e);
    return null;
  }
}

export default function ReturnReceiptDownload() {
  const { txId } = useParams();
  const [searchParams] = useSearchParams();
  const { activeTransactions } = useTransaction();

  const encodedData = searchParams.get('d');
  const shouldAutoDownload = searchParams.get('auto') === '1';

  const decodedPayload = useMemo(() => decodeCompactPayload(encodedData), [encodedData]);

  // Look up in local context first
  const localMatch = useMemo(() => {
    if (!txId || !Array.isArray(activeTransactions)) return null;
    return activeTransactions.find(
      (t) => (t.txId || t.transactionId || t.id) === txId
    );
  }, [txId, activeTransactions]);

  const needsCloudFetch = !decodedPayload && !localMatch;
  const [cloudRecord, setCloudRecord] = useState(null);
  const [cloudFetchDone, setCloudFetchDone] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState('');
  const hasTriggeredAutoDownload = useRef(false);

  // Fetch from Supabase if not found in compact payload or local context
  useEffect(() => {
    let isMounted = true;
    if (!needsCloudFetch) {
      return () => {
        isMounted = false;
      };
    }

    async function loadFromCloud() {
      try {
        const list = await fetchTransactionsFromSupabase();
        if (!isMounted) return;
        if (Array.isArray(list)) {
          const found = list.find(
            (t) => (t.txId || t.transactionId || t.id) === txId
          );
          if (found) setCloudRecord(found);
        }
      } catch (err) {
        console.warn('Cloud receipt lookup failed:', err);
      } finally {
        if (isMounted) setCloudFetchDone(true);
      }
    }

    loadFromCloud();
    return () => {
      isMounted = false;
    };
  }, [txId, needsCloudFetch]);

  const isLoadingCloud = needsCloudFetch && !cloudFetchDone;

  // Consolidate final receipt data
  const receiptData = useMemo(() => {
    if (decodedPayload) return decodedPayload;

    const record = localMatch || cloudRecord;
    if (!record) return null;

    return {
      txId: record.txId || record.transactionId || record.id || txId,
      studentName: record.borrower?.groupLeader || record.studentName || 'STUDENT BORROWER',
      studentId: record.borrower?.studentId || record.studentId || 'N/A',
      program: record.borrower?.program || record.program || 'ENGINEERING',
      courseCode: record.borrower?.courseCode || record.courseCode || 'LAB-CLASS',
      groupNo: record.borrower?.groupNo || record.groupNo || '1',
      instructor: record.borrower?.instructor || record.instructor || 'Laboratory Professor',
      date:
        record.borrower?.date ||
        new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      timestamp:
        record.returnedAt ||
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      items: record.returnedItems || record.items || [],
    };
  }, [decodedPayload, localMatch, cloudRecord, txId]);

  // Automatically trigger thermal PDF download once receiptData is ready
  useEffect(() => {
    if (shouldAutoDownload && receiptData && !hasTriggeredAutoDownload.current) {
      hasTriggeredAutoDownload.current = true;
      const timer = setTimeout(() => {
        try {
          const fname = generateReturnReceiptPdf(receiptData);
          setDownloadedFileName(fname);
        } catch (err) {
          console.error('Auto PDF download failed:', err);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoDownload, receiptData]);

  const handleManualDownload = () => {
    if (!receiptData) return;
    const fname = generateReturnReceiptPdf(receiptData);
    setDownloadedFileName(fname);
  };

  const totalUnits = (receiptData?.items || []).reduce(
    (sum, it) => sum + Number(it.qtyReturned || it.qty || 1),
    0
  );

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 px-3 py-6 sm:py-10 flex flex-col items-center justify-center font-mono select-none">
      {/* Fastfood Thermal Paper Slip Card (White Paper Container) */}
      <div className="w-full max-w-[340px] sm:max-w-[360px] bg-white text-slate-950 p-5 rounded-lg shadow-2xl border border-slate-300 relative text-xs leading-relaxed">
        {/* Jagged thermal receipt top tear effect */}
        <div className="text-center font-bold text-sm tracking-wider uppercase mb-1">
          Universidad de Dagupan
        </div>
        <div className="text-center font-bold text-[11px] text-slate-800">
          SCHOOL OF ENGINEERING
        </div>
        <div className="text-center text-[10px] text-slate-600 mb-2">
          Arellano St., Dagupan City, Pangasinan
          <br />
          LABORATORY CUSTODY KIOSK
        </div>

        <div className="border-b-2 border-dashed border-slate-400 my-2" />

        <div className="text-center font-extrabold text-xs tracking-wider uppercase py-0.5">
          ** OFFICIAL RETURN RECEIPT **
        </div>
        <div className="text-center text-[10px] text-slate-600">
          FORM UdD-FM-LM-RETURN-01
        </div>

        <div className="border-b border-dashed border-slate-400 my-2" />

        {isLoadingCloud ? (
          <div className="py-8 text-center text-xs font-bold text-slate-600">
            Printing Official Thermal Receipt...
          </div>
        ) : !receiptData ? (
          <div className="py-6 text-center text-xs font-bold text-rose-700">
            Receipt record not found ({txId}).
          </div>
        ) : (
          <>
            {/* Monospace Metadata List */}
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between">
                <span className="font-bold">TX REF NO:</span>
                <span className="font-bold">{receiptData.txId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">DATE/TIME:</span>
                <span>
                  {receiptData.date} {receiptData.timestamp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">STUDENT ID:</span>
                <span className="font-extrabold text-blue-800">
                  {receiptData.studentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">BORROWER:</span>
                <span className="font-bold uppercase truncate max-w-[170px]">
                  {receiptData.studentName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">PROGRAM:</span>
                <span>
                  {receiptData.program} (Grp {receiptData.groupNo})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">COURSE:</span>
                <span>{receiptData.courseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">INSTRUCTOR:</span>
                <span className="truncate max-w-[170px]">
                  {receiptData.instructor}
                </span>
              </div>
            </div>

            <div className="border-b-2 border-dashed border-slate-400 my-2.5" />

            {/* Column Header */}
            <div className="flex justify-between text-[10.5px] font-extrabold pb-1 border-b border-slate-300">
              <span className="w-40 truncate">ITEM DESCRIPTION</span>
              <span className="w-10 text-center">QTY</span>
              <span className="w-16 text-right">STATUS</span>
            </div>

            {/* Itemized List */}
            <div className="divide-y divide-dashed divide-slate-200 py-1 space-y-1.5 text-[11px]">
              {receiptData.items.map((item, idx) => (
                <div key={idx} className="pt-1">
                  <div className="flex justify-between font-bold">
                    <span className="w-44 truncate">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="w-10 text-center font-extrabold">
                      {item.qtyReturned || item.qty || 1}
                    </span>
                    <span className="w-16 text-right text-emerald-700 font-extrabold">
                      CLEARED
                    </span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 pl-3">
                    TAG: {item.tagCode || 'N/A'}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-b-2 border-dashed border-slate-400 my-2.5" />

            {/* Summary Totals */}
            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between">
                <span>TOTAL ITEMS:</span>
                <span>{receiptData.items.length} ITEM(S)</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold">
                <span>TOTAL UNITS CLEARED:</span>
                <span>{totalUnits} UNIT(S)</span>
              </div>
            </div>

            <div className="border-b-2 border-dashed border-slate-400 my-3" />

            {/* Verification Stamp & Barcode */}
            <div className="text-center space-y-1 text-[10px]">
              <div className="font-extrabold text-[11px] uppercase tracking-wider text-emerald-800">
                *** RETURN CHECK-IN VERIFIED ***
              </div>
              <p className="text-slate-600 leading-tight">
                All listed apparatus have been officially logged into the Kiosk
                Database. Present this receipt to your Professor / Custodian.
              </p>
              <div className="pt-2 font-bold tracking-widest text-xs">
                ||||||||||||||||||||||||||||||||||
              </div>
              <div className="text-[9px] text-slate-500 font-bold">
                * {receiptData.txId} *
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 my-3" />

            <div className="text-center text-[9.5px] text-slate-600 font-bold">
              *** THANK YOU & KEEP LABS SAFE ***
            </div>

            {/* Download Again Button */}
            <button
              type="button"
              onClick={handleManualDownload}
              className="mt-4 w-full h-10 rounded bg-slate-950 text-white font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
            >
              Download PDF Slip Again
            </button>
          </>
        )}
      </div>

      {downloadedFileName && (
        <div className="mt-3 text-center text-xs text-slate-400">
          Receipt file: <span className="text-white font-bold">{downloadedFileName}</span>
        </div>
      )}
    </div>
  );
}
