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
          month: 'long',
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
          month: 'long',
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

  // Automatically trigger PDF download once receiptData is ready
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
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoDownload, receiptData]);

  const handleManualDownload = () => {
    if (!receiptData) return;
    const fname = generateReturnReceiptPdf(receiptData);
    setDownloadedFileName(fname);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 px-4 py-6 sm:py-10 flex flex-col items-center justify-center font-sans select-none">
      <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl shadow-md overflow-hidden">
        {/* Top Institutional Header */}
        <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Form UdD-FM-LM-RETURN-01
            </span>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight mt-1">
              Official Return Clearance Receipt
            </h1>
            <p className="text-xs text-slate-300">
              Universidad de Dagupan • School of Engineering
            </p>
          </div>
          <img
            src="/images/udd_logo.png"
            alt="UdD Logo"
            className="w-12 h-12 object-contain shrink-0 bg-white rounded-full p-0.5"
          />
        </div>

        {isLoadingCloud ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">
              Generating Official Return Receipt PDF...
            </p>
            <p className="text-xs text-slate-500 font-mono">Ref: {txId}</p>
          </div>
        ) : !receiptData ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm font-bold text-rose-700">
              Receipt Record Not Found ({txId})
            </p>
            <p className="text-xs text-slate-600">
              Please scan the QR code again from the Kiosk Return Station screen.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Status Banner */}
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wide">
                  Status: Officially Returned & Cleared
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Present this PDF receipt to your Laboratory Professor or Custodian.
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-emerald-300 text-emerald-900 shrink-0">
                VERIFIED
              </span>
            </div>

            {downloadedFileName && (
              <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                PDF Receipt downloaded automatically:{' '}
                <span className="font-mono font-bold">{downloadedFileName}</span>
              </div>
            )}

            {/* Student & Session Metadata */}
            <div className="rounded-xl border border-slate-300 divide-y divide-slate-200 text-xs">
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-slate-500 font-semibold">Student Name</span>
                <span className="font-extrabold uppercase text-right">
                  {receiptData.studentName}
                </span>
              </div>
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-slate-500 font-semibold">Student ID Number</span>
                <span className="font-mono font-bold text-blue-700">
                  {receiptData.studentId}
                </span>
              </div>
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-slate-500 font-semibold">Program & Course</span>
                <span className="font-bold">
                  {receiptData.program} ({receiptData.courseCode})
                </span>
              </div>
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-slate-500 font-semibold">Instructor / Professor</span>
                <span className="font-bold text-right">
                  {receiptData.instructor}
                </span>
              </div>
              <div className="p-2.5 flex justify-between gap-2">
                <span className="text-slate-500 font-semibold">Date & Time Returned</span>
                <span className="font-mono font-bold text-right">
                  {receiptData.date} • {receiptData.timestamp}
                </span>
              </div>
              <div className="p-2.5 flex justify-between gap-2 bg-slate-50">
                <span className="text-slate-500 font-semibold">Transaction Ref</span>
                <span className="font-mono font-bold text-slate-900">
                  {receiptData.txId}
                </span>
              </div>
            </div>

            {/* Returned Apparatus Table */}
            <div className="rounded-xl border border-slate-300 overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                <span>Returned Apparatus List</span>
                <span className="font-mono">{receiptData.items.length} Item(s)</span>
              </div>
              <div className="divide-y divide-slate-200 max-h-52 overflow-y-auto text-xs">
                {receiptData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {idx + 1}. {item.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        Tag: {item.tagCode || 'N/A'} • Condition: GOOD / CLEARED
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 shrink-0">
                      {item.qtyReturned || item.qty || 1} {item.unit || 'pc'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Download PDF Button */}
            <button
              type="button"
              onClick={handleManualDownload}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider cursor-pointer active:scale-[0.99] transition-all shadow-sm"
            >
              Download Official Receipt PDF Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
