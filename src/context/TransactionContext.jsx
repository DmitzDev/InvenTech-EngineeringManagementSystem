import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  getIncidentLogs,
  createIncidentLog,
  resolveIncidentLog,
  updateInventoryItem,
  getStudentClearanceHolds,
  addStudentClearanceHold,
  removeStudentClearanceHold,
  isItemConsumable,
} from '../data/equipmentData';

const TransactionContext = createContext();

const getInitialDateStrings = () => {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = now.toLocaleDateString('en-US', options);
  return {
    date: formatted,
    actualDate: formatted,
  };
};

const RESERVATIONS_STORAGE_KEY = 'udd_kiosk_reservations_v2';
const TRANSACTIONS_STORAGE_KEY = 'udd_kiosk_transactions_v2';

// Clean old test cache keys
try {
  ['udd_kiosk_reservations', 'udd_kiosk_transactions', 'udd_kiosk_transactions_v1'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch {
  // ignore
}

export const getStoredReservations = () => {
  try {
    const data = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return [];
};

export const saveStoredReservations = (reservations) => {
  try {
    localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));
  } catch {
    // ignore
  }
};

export const getStoredTransactions = () => {
  try {
    const data = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
};

export const saveStoredTransactions = (transactions) => {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // ignore
  }
};

/**
 * Real-Time Philippine Time (Asia/Manila / PHT) Theme Resolver
 * - 04:00 AM to 03:59 PM (Daytime) -> 'light'
 * - 04:00 PM to 03:59 AM (Nighttime) -> 'dark'
 */
export function getPhilippineTheme() {
  try {
    const now = new Date();
    const phtDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    const phtHour = new Date(phtDateStr).getHours();
    return (phtHour >= 4 && phtHour < 16) ? 'light' : 'dark';
  } catch {
    const hour = new Date().getHours();
    return (hour >= 4 && hour < 16) ? 'light' : 'dark';
  }
}

const initialState = {
  currentStep: 0, // 0 = Welcome, 1 = Borrower Form, 2 = Lab Selector, 3 = Catalog/Cart, 4 = Commit/Print
  theme: getPhilippineTheme(), // Real-time automatic: 4AM-4PM Light, 4PM-4AM Dark
  borrower: {
    studentId: '',
    program: '',
    courseCode: '',
    subjectCode: '',
    groupNo: '1',
    groupLeader: '',
    groupMembers: [], // List of member Student IDs
    instructor: '',
    labTime: '',
    ...getInitialDateStrings(),
  },
  selectedLab: null, // 'CE' | 'DIGITAL' | 'CHEM'
  cart: [], // [{ id, name, tagCode, category, qty, unit, description, isConsumable, isDamaged, damageNote }]
  isCartDrawerOpen: false,
  safetyAgreement: false,
  reservations: getStoredReservations(),
  activeTransactions: getStoredTransactions(),
  activeClearanceRecord: null,
  incidentLogs: getIncidentLogs(),
  studentClearanceHolds: getStudentClearanceHolds(),
  transactionId: null,
  timestamp: null,
  toast: null,
};

function transactionReducer(state, action) {
  switch (action.type) {
    case 'SET_CART_DRAWER':
      return {
        ...state,
        isCartDrawerOpen: Boolean(action.payload),
      };

    case 'TOGGLE_CART_DRAWER':
      return {
        ...state,
        isCartDrawerOpen: !state.isCartDrawerOpen,
      };

    case 'SET_SAFETY_AGREEMENT':
      return {
        ...state,
        safetyAgreement: Boolean(action.payload),
      };

    case 'TOGGLE_SAFETY_AGREEMENT':
      return {
        ...state,
        safetyAgreement: !state.safetyAgreement,
      };

    case 'ADD_GROUP_MEMBER': {
      const memberId = (action.payload || '').trim().toUpperCase();
      if (!memberId || (state.borrower.groupMembers || []).includes(memberId)) return state;
      if ((state.borrower.groupMembers || []).length >= 8) {
        return {
          ...state,
          toast: {
            id: Date.now(),
            type: 'error',
            message: 'Maximum 8 group members allowed per borrower slip.',
          },
        };
      }
      return {
        ...state,
        borrower: {
          ...state.borrower,
          groupMembers: [...(state.borrower.groupMembers || []), memberId],
        },
      };
    }

    case 'REMOVE_GROUP_MEMBER': {
      const memberToRemove = action.payload;
      return {
        ...state,
        borrower: {
          ...state.borrower,
          groupMembers: (state.borrower.groupMembers || []).filter((m) => m !== memberToRemove),
        },
      };
    }

    case 'TOGGLE_THEME': {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('udd_kiosk_theme', nextTheme);
      return {
        ...state,
        theme: nextTheme,
      };
    }

    case 'SET_THEME': {
      localStorage.setItem('udd_kiosk_theme', action.payload);
      return {
        ...state,
        theme: action.payload,
      };
    }

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'SET_BORROWER_FIELD':
      return {
        ...state,
        borrower: {
          ...state.borrower,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'SET_FULL_BORROWER':
      return {
        ...state,
        borrower: {
          ...state.borrower,
          ...action.payload,
        },
      };

    case 'SET_LAB':
      return {
        ...state,
        selectedLab: action.payload,
      };

    case 'ADD_TO_CART': {
      const item = action.payload;
      const existingIndex = state.cart.findIndex((i) => i.id === item.id);

      if (existingIndex === -1 && state.cart.length >= 15) {
        return {
          ...state,
          toast: {
            id: Date.now(),
            type: 'error',
            message: 'Borrower Sheet limit reached! Maximum 15 distinct items per slip.',
          },
        };
      }

      let newCart;
      if (existingIndex > -1) {
        newCart = state.cart.map((cartItem, idx) =>
          idx === existingIndex
            ? { ...cartItem, qty: cartItem.qty + (item.qty || 1) }
            : cartItem
        );
      } else {
        newCart = [
          ...state.cart,
          {
            id: item.id,
            name: item.name,
            tagCode: item.tagCode,
            category: item.category,
            unit: item.unit || 'pc',
            description: item.description || '',
            qty: item.qty || 1,
            isConsumable: isItemConsumable(item),
            isDamaged: false,
            damageNote: '',
          },
        ];
      }

      return {
        ...state,
        cart: newCart,
        toast: {
          id: Date.now(),
          type: 'success',
          message: `Added "${item.name}" ${isItemConsumable(item) ? '(Consumable)' : ''} to cart`,
        },
      };
    }

    case 'ADD_MULTIPLE_TO_CART': {
      const itemsToAdd = action.payload;
      let newCart = [...state.cart];
      let addedCount = 0;

      for (const item of itemsToAdd) {
        const existingIndex = newCart.findIndex((i) => i.id === item.id);
        if (existingIndex > -1) {
          newCart = newCart.map((ci, idx) =>
            idx === existingIndex ? { ...ci, qty: ci.qty + 1 } : ci
          );
          addedCount++;
        } else if (newCart.length < 15) {
          newCart.push({
            id: item.id,
            name: item.name,
            tagCode: item.tagCode,
            category: item.category,
            unit: item.unit || 'pc',
            description: item.description || '',
            qty: 1,
            isConsumable: isItemConsumable(item),
            isDamaged: false,
            damageNote: '',
          });
          addedCount++;
        }
      }

      return {
        ...state,
        cart: newCart,
        toast: {
          id: Date.now(),
          type: 'success',
          message: `Added ${addedCount} apparatus preset items to cart`,
        },
      };
    }

    case 'UPDATE_CART_QTY': {
      const { id, delta } = action.payload;
      const newCart = state.cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);

      return {
        ...state,
        cart: newCart,
      };
    }

    case 'TOGGLE_ITEM_DAMAGE': {
      const { id, note } = action.payload;
      const newCart = state.cart.map((item) => {
        if (item.id === id) {
          const nextState = !item.isDamaged;
          return {
            ...item,
            isDamaged: nextState,
            damageNote: nextState ? (note || 'Reported pre-existing issue / damage') : '',
          };
        }
        return item;
      });

      const targetItem = state.cart.find((i) => i.id === id);
      const isNowDamaged = !targetItem?.isDamaged;

      return {
        ...state,
        cart: newCart,
        toast: {
          id: Date.now(),
          type: isNowDamaged ? 'info' : 'success',
          message: isNowDamaged
            ? `Flagged "${targetItem?.name}" for Custodian Damage Review`
            : `Cleared damage flag for "${targetItem?.name}"`,
        },
      };
    }

    case 'REMOVE_FROM_CART': {
      const filtered = state.cart.filter((item) => item.id !== action.payload);
      return {
        ...state,
        cart: filtered,
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
      };

    case 'ADD_RESERVATION': {
      const newRes = {
        ...action.payload,
        status: action.payload.status || 'PENDING',
      };
      const updatedReservations = [newRes, ...state.reservations];
      saveStoredReservations(updatedReservations);

      return {
        ...state,
        reservations: updatedReservations,
        toast: {
          id: Date.now(),
          type: 'success',
          message: `Equipment Reserved! Ref: ${newRes.id}`,
        },
      };
    }

    case 'CANCEL_RESERVATION': {
      const updatedReservations = state.reservations.map((r) =>
        r.id === action.payload ? { ...r, status: 'CANCELLED' } : r
      );
      saveStoredReservations(updatedReservations);

      return {
        ...state,
        reservations: updatedReservations,
        toast: {
          id: Date.now(),
          type: 'info',
          message: `Reservation ${action.payload} marked as Cancelled`,
        },
      };
    }

    case 'UPDATE_RESERVATION_STATUS': {
      const { id, status } = action.payload;
      let targetReservation = null;
      const updatedReservations = state.reservations.map((r) => {
        if (r.id === id) {
          targetReservation = { ...r, status };
          return targetReservation;
        }
        return r;
      });
      saveStoredReservations(updatedReservations);

      let updatedTransactions = [...state.activeTransactions];

      // If marked as COMPLETED (Claimed at counter), record the official transaction as BORROWED
      if (status === 'COMPLETED' && targetReservation) {
        const txId = targetReservation.id.replace('RES-', 'UDD-RES-');
        const alreadyExists = updatedTransactions.some((t) => t.txId === txId);
        if (!alreadyExists) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const newTx = {
            txId,
            status: 'BORROWED',
            borrower: {
              program: targetReservation.program || 'BSCE',
              courseCode: targetReservation.courseCode || 'CEMAT1L',
              groupNo: targetReservation.groupNo || '1',
              groupLeader: targetReservation.studentName || 'STUDENT RESERVATION',
              instructor: targetReservation.instructor || 'Engr. Jin Benir Macaranas',
              labTime: targetReservation.timeSlot || '10:00 AM - 12:00 NN',
              date: targetReservation.reserveDate || now.toLocaleDateString('en-US'),
              actualDate: now.toLocaleDateString('en-US'),
            },
            items: [
              {
                id: targetReservation.itemId || 'res-item',
                name: targetReservation.name,
                tagCode: targetReservation.tagCode,
                category: 'Advance Reservation',
                qty: targetReservation.qty || 1,
                unit: targetReservation.unit || 'pc',
                description: `Claimed Advance Reservation (${targetReservation.id})`,
                isDamaged: false,
                damageNote: '',
              },
            ],
            borrowedAt: `${now.toLocaleDateString('en-US')} • ${timeStr}`,
            returnedAt: null,
            custodianNotes: `Advance Reservation claimed at counter (${targetReservation.id})`,
          };
          updatedTransactions = [newTx, ...updatedTransactions];
          saveStoredTransactions(updatedTransactions);
        }
      }

      return {
        ...state,
        reservations: updatedReservations,
        activeTransactions: updatedTransactions,
        toast: {
          id: Date.now(),
          type: 'success',
          message: `Reservation ${id} marked as ${status}${status === 'COMPLETED' ? ' (Recorded in Borrowing History)' : ''}`,
        },
      };
    }

    case 'PREPARE_RESERVATION_TO_SLIP': {
      const res = action.payload;
      // Convert reservation into active borrower & cart session
      const preparedBorrower = {
        program: res.program || 'BSCE',
        courseCode: res.courseCode || 'CEMAT1L',
        groupNo: res.groupNo || '1',
        groupLeader: res.studentName || 'STUDENT RESERVATION',
        instructor: res.instructor || 'Engr. Jin Benir Macaranas',
        labTime: res.timeSlot || '10:00 AM - 12:00 NN',
        date: res.reserveDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        actualDate: res.reserveDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      };

      const preparedCartItem = {
        id: res.itemId || 'res-item',
        name: res.name,
        tagCode: res.tagCode,
        category: 'Tools & Assets',
        qty: res.qty || 1,
        unit: res.unit || 'pc',
        description: `Advance Reservation (${res.id})`,
        isDamaged: false,
        damageNote: '',
      };

      // Mark reservation as PREPARED
      const updatedReservations = state.reservations.map((r) =>
        r.id === res.id ? { ...r, status: 'PREPARED' } : r
      );
      saveStoredReservations(updatedReservations);

      return {
        ...state,
        reservations: updatedReservations,
        borrower: preparedBorrower,
        cart: [preparedCartItem],
        transactionId: res.id.replace('RES-', 'UDD-RES-'),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        toast: {
          id: Date.now(),
          type: 'success',
          message: `Loaded Reservation ${res.id} into Official Printable Slip!`,
        },
      };
    }

    case 'SYNC_STORED_RESERVATIONS':
      return {
        ...state,
        reservations: action.payload,
      };

    case 'RETURN_EQUIPMENT_TRANSACTION': {
      const { txId, returnedItems, custodianNotes } = action.payload;
      const now = new Date();
      const returnTimestamp = now.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const hasIncidents = returnedItems.some(
        (i) => i.returnCondition === 'damaged' || i.returnCondition === 'needs_repair' || i.returnCondition === 'lost'
      );

      const status = hasIncidents ? 'INCIDENT_REPORTED' : 'RETURNED_CLEARED';

      let updatedRecord = null;

      const updatedTransactions = state.activeTransactions.map((tx) => {
        if (tx.txId === txId) {
          updatedRecord = {
            ...tx,
            status,
            returnedAt: returnTimestamp,
            returnedItems,
            custodianNotes: custodianNotes || '',
          };
          return updatedRecord;
        }
        return tx;
      });

      saveStoredTransactions(updatedTransactions);

      // Automatically update inventory item status & create incident logs for any damaged / repair items
      returnedItems.forEach((item) => {
        if (item.returnCondition && item.returnCondition !== 'good') {
          const conditionLabel =
            item.returnCondition === 'needs_repair'
              ? 'Needs Calibration / Repair'
              : item.returnCondition === 'lost'
                ? 'Missing / Lost Parts'
                : 'Damaged / Broken Parts';

          const note = item.damageDescription || custodianNotes || `Marked as ${conditionLabel} upon return`;

          // 1. Update inventory item to Under Maintenance
          updateInventoryItem(item.id, {
            status: 'Under Maintenance',
            condition: conditionLabel,
            maintenanceNotes: note,
            lastIncidentTxId: txId,
            lastIncidentDate: returnTimestamp,
          });

          // 2. Create official incident log entry
          createIncidentLog({
            txId,
            itemId: item.id,
            itemName: item.name,
            tagCode: item.tagCode,
            condition: item.returnCondition,
            damageDescription: item.damageDescription || '',
            severity: item.severity || 'Moderate',
            borrowerName: updatedRecord?.borrower?.groupLeader || 'Unknown',
            borrowerProgram: updatedRecord?.borrower?.program || 'N/A',
            borrowerCourse: updatedRecord?.borrower?.courseCode || 'N/A',
            instructor: updatedRecord?.borrower?.instructor || 'N/A',
            custodianNotes: custodianNotes || '',
            timestamp: returnTimestamp,
            status: 'OPEN_INVESTIGATION',
          });
        }
      });

      const updatedLogs = getIncidentLogs();

      return {
        ...state,
        activeTransactions: updatedTransactions,
        activeClearanceRecord: updatedRecord,
        incidentLogs: updatedLogs,
        toast: {
          id: Date.now(),
          type: hasIncidents ? 'warning' : 'success',
          message: hasIncidents
            ? `Equipment Returned! Incidents logged & compromised items flagged Under Maintenance.`
            : `Equipment Returned! Borrower clearance generated (CLEARED)`,
        },
      };
    }

    case 'RESTORE_INVENTORY_ITEM': {
      const { itemId, resolutionNotes } = action.payload;

      // Reset inventory item status to Passed Inspection & Functional
      updateInventoryItem(itemId, {
        status: 'Passed Inspection',
        condition: 'Functional',
        maintenanceNotes: resolutionNotes || 'Repaired and restored to active service',
        restoredAt: new Date().toLocaleString('en-US'),
      });

      // Find and resolve any open incident logs for this item
      const currentLogs = getIncidentLogs();
      const targetLog = currentLogs.find((l) => l.itemId === itemId && l.status !== 'RESOLVED_REPAIRED');
      if (targetLog) {
        resolveIncidentLog(targetLog.id, resolutionNotes || 'Repaired and restored to active inventory');
      }

      const updatedLogs = getIncidentLogs();

      return {
        ...state,
        incidentLogs: updatedLogs,
        toast: {
          id: Date.now(),
          type: 'success',
          message: `Apparatus restored! Unlocked for Kiosk borrowing.`,
        },
      };
    }

    case 'SET_ACTIVE_CLEARANCE_RECORD':
      return {
        ...state,
        activeClearanceRecord: action.payload,
      };

    case 'SYNC_STORED_TRANSACTIONS':
      return {
        ...state,
        activeTransactions: action.payload,
      };

    case 'COMMIT_TRANSACTION': {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const today = new Date();
      const dateCode = today.toISOString().slice(0, 10).replace(/-/g, '');
      const txId = `UDD-${state.selectedLab || 'ENG'}-${dateCode}-${randomSuffix}`;
      const timeStr = today.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newTxRecord = {
        txId,
        status: 'BORROWED',
        borrower: { ...state.borrower },
        items: [...state.cart],
        borrowedAt: `${state.borrower.date} • ${timeStr}`,
        returnedAt: null,
        custodianNotes: '',
      };

      const updatedTransactions = [newTxRecord, ...state.activeTransactions];
      saveStoredTransactions(updatedTransactions);

      return {
        ...state,
        transactionId: txId,
        timestamp: timeStr,
        activeTransactions: updatedTransactions,
        currentStep: 4,
      };
    }

    case 'RESET_TRANSACTION':
      return {
        ...initialState,
        theme: state.theme,
        reservations: state.reservations,
        activeTransactions: state.activeTransactions,
        currentStep: 1,
        borrower: {
          ...initialState.borrower,
          ...getInitialDateStrings(),
        },
        toast: {
          id: Date.now(),
          type: 'info',
          message: 'Started a fresh transaction session.',
        },
      };

    case 'GO_TO_WELCOME':
      return {
        ...initialState,
        theme: state.theme,
        reservations: state.reservations,
        activeTransactions: state.activeTransactions,
        currentStep: 0,
        borrower: {
          ...initialState.borrower,
          ...getInitialDateStrings(),
        },
      };

    case 'SHOW_TOAST':
      return {
        ...state,
        toast: {
          id: Date.now(),
          type: action.payload.type || 'info',
          message: action.payload.message,
        },
      };

    case 'CLEAR_TOAST':
      return {
        ...state,
        toast: null,
      };

    default:
      return state;
  }
}

export function TransactionProvider({ children }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState);

  // Sync data-theme attribute on root HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Real-Time Philippine Time (Asia/Manila) Automated Theme Engine
  // 04:00 AM - 03:59 PM: Light Theme
  // 04:00 PM - 03:59 AM: Dark Theme
  useEffect(() => {
    const checkAndSyncTheme = () => {
      const scheduledTheme = getPhilippineTheme();
      if (state.theme !== scheduledTheme) {
        dispatch({ type: 'SET_THEME', payload: scheduledTheme });
      }
    };

    checkAndSyncTheme();
    const interval = setInterval(checkAndSyncTheme, 15000);
    return () => clearInterval(interval);
  }, [state.theme]);

  // Sync live transactions and reservations across browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === TRANSACTIONS_STORAGE_KEY) {
        dispatch({ type: 'SYNC_STORED_TRANSACTIONS', payload: getStoredTransactions() });
      }
      if (e.key === RESERVATIONS_STORAGE_KEY) {
        dispatch({ type: 'SYNC_STORED_RESERVATIONS', payload: getStoredReservations() });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_TOAST' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  // Check double-booking conflicts
  const checkReservationConflict = (itemId, date, timeSlot, requestedQty, totalStock) => {
    const existingCount = state.reservations
      .filter((r) => r.itemId === itemId && r.reserveDate === date && r.timeSlot === timeSlot && r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + r.qty, 0);

    const availableSlots = totalStock - existingCount;
    const hasConflict = requestedQty > availableSlots;

    return {
      hasConflict,
      existingCount,
      availableSlots: Math.max(0, availableSlots),
      totalStock,
    };
  };

  // Instant validation check for overdue or unreturned apparatus and active clearance holds
  const checkStudentOverdueClearance = (studentName, studentId) => {
    const sName = (studentName || '').trim().toLowerCase();
    const rawSId = (studentId || '').trim().toLowerCase();
    const cleanSId = rawSId.replace(/[^a-z0-9]/gi, '');

    if (!sName && !cleanSId) {
      return { isRestricted: false, overdueCount: 0, overdueItems: [], reason: '', unreturnedTxs: [] };
    }

    // 1. Query active unreturned transactions in activeTransactions
    const unreturnedTxs = (state.activeTransactions || []).filter((tx) => {
      if (tx.status !== 'BORROWED') return false;
      const txBorrowerName = (tx.borrower?.groupLeader || '').trim().toLowerCase();
      const rawTxId = (tx.borrower?.studentId || '').trim().toLowerCase();
      const cleanTxId = rawTxId.replace(/[^a-z0-9]/gi, '');

      const idMatch =
        cleanSId &&
        cleanTxId &&
        (cleanTxId === cleanSId ||
          cleanTxId.includes(cleanSId) ||
          cleanSId.includes(cleanTxId));

      const nameMatch =
        sName &&
        txBorrowerName &&
        (txBorrowerName === sName ||
          txBorrowerName.includes(sName) ||
          sName.includes(txBorrowerName));

      return Boolean(idMatch || nameMatch);
    });

    // 2. Query administrative clearance holds
    const matchedClearanceHolds = (state.studentClearanceHolds || []).filter((h) => {
      const holdName = (h.studentName || '').trim().toLowerCase();
      const rawHoldId = (h.studentId || '').trim().toLowerCase();
      const cleanHoldId = rawHoldId.replace(/[^a-z0-9]/gi, '');

      const idMatch =
        cleanSId &&
        cleanHoldId &&
        (cleanHoldId === cleanSId ||
          cleanHoldId.includes(cleanSId) ||
          cleanSId.includes(cleanHoldId));

      const nameMatch =
        sName &&
        holdName &&
        (holdName === sName ||
          holdName.includes(sName) ||
          sName.includes(holdName));

      return Boolean(idMatch || nameMatch);
    });

    const overdueItems = [];
    unreturnedTxs.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        overdueItems.push({
          txId: tx.txId,
          itemId: item.id,
          name: item.name,
          tagCode: item.tagCode,
          qty: item.qty || 1,
          date: tx.borrower?.date || tx.borrowedAt || 'Previous Session',
          dueDate: tx.borrower?.date || tx.borrowedAt || 'Previous Session',
          instructor: tx.borrower?.instructor || 'Lab Custodian',
          labTime: tx.borrower?.labTime || '',
        });
      });
    });

    matchedClearanceHolds.forEach((hold) => {
      if (Array.isArray(hold.items) && hold.items.length > 0) {
        hold.items.forEach((item, idx) => {
          overdueItems.push({
            txId: hold.id || `HOLD-${idx + 1}`,
            name: item.name || hold.reason || 'Unreturned Equipment',
            tagCode: item.tagCode || 'HOLD-TAG',
            qty: item.qty || 1,
            date: item.dueDate || hold.date || 'Active Term',
            dueDate: item.dueDate || hold.date || 'Active Term',
            instructor: 'Lab Custodian Office',
          });
        });
      } else {
        overdueItems.push({
          txId: hold.id || 'HOLD-ADM',
          name: hold.reason || 'Administrative Clearance Lockout',
          tagCode: 'CLEARANCE-HOLD',
          qty: 1,
          date: hold.date || 'Active Term',
          dueDate: hold.date || 'Active Term',
          instructor: 'Lab Custodian Office',
        });
      }
    });

    const isRestricted = overdueItems.length > 0 || matchedClearanceHolds.length > 0;

    let reason = '';
    if (isRestricted) {
      const firstItem = overdueItems[0];
      reason = `Borrowing Restricted: You have ${overdueItems.length} unreturned item(s) (${firstItem?.name || 'Apparatus'} - Due ${firstItem?.dueDate || firstItem?.date || 'Prior Session'}). Please settle with the lab custodian.`;
    }

    return {
      isRestricted,
      overdueCount: overdueItems.length,
      overdueItems,
      reason,
      unreturnedTxs,
      clearanceHold: matchedClearanceHolds[0] || null,
    };
  };

  const value = {
    ...state,
    toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    setStep: (step) => dispatch({ type: 'SET_STEP', payload: step }),
    setBorrowerField: (field, value) =>
      dispatch({ type: 'SET_BORROWER_FIELD', payload: { field, value } }),
    setFullBorrower: (data) =>
      dispatch({ type: 'SET_FULL_BORROWER', payload: data }),
    setLab: (labId) => dispatch({ type: 'SET_LAB', payload: labId }),
    addToCart: (item) => dispatch({ type: 'ADD_TO_CART', payload: item }),
    addMultipleToCart: (items) =>
      dispatch({ type: 'ADD_MULTIPLE_TO_CART', payload: items }),
    updateCartQty: (id, delta) =>
      dispatch({ type: 'UPDATE_CART_QTY', payload: { id, delta } }),
    toggleItemDamage: (id, note) =>
      dispatch({ type: 'TOGGLE_ITEM_DAMAGE', payload: { id, note } }),
    removeFromCart: (id) =>
      dispatch({ type: 'REMOVE_FROM_CART', payload: id }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    openCartDrawer: () => dispatch({ type: 'SET_CART_DRAWER', payload: true }),
    closeCartDrawer: () => dispatch({ type: 'SET_CART_DRAWER', payload: false }),
    toggleCartDrawer: () => dispatch({ type: 'TOGGLE_CART_DRAWER' }),
    addReservation: (reservationData) =>
      dispatch({ type: 'ADD_RESERVATION', payload: reservationData }),
    cancelReservation: (id) =>
      dispatch({ type: 'CANCEL_RESERVATION', payload: id }),
    updateReservationStatus: (id, status) =>
      dispatch({ type: 'UPDATE_RESERVATION_STATUS', payload: { id, status } }),
    prepareReservationToSlip: (reservation) =>
      dispatch({ type: 'PREPARE_RESERVATION_TO_SLIP', payload: reservation }),
    returnEquipmentTransaction: (payload) =>
      dispatch({ type: 'RETURN_EQUIPMENT_TRANSACTION', payload }),
    restoreInventoryItem: (itemId, resolutionNotes) =>
      dispatch({ type: 'RESTORE_INVENTORY_ITEM', payload: { itemId, resolutionNotes } }),
    setActiveClearanceRecord: (record) =>
      dispatch({ type: 'SET_ACTIVE_CLEARANCE_RECORD', payload: record }),
    addClearanceHold: (hold) =>
      dispatch({ type: 'ADD_CLEARANCE_HOLD', payload: hold }),
    removeClearanceHold: (id) =>
      dispatch({ type: 'REMOVE_CLEARANCE_HOLD', payload: id }),
    checkReservationConflict,
    checkStudentOverdueClearance,
    commitTransaction: () => dispatch({ type: 'COMMIT_TRANSACTION' }),
    setSafetyAgreement: (val) => dispatch({ type: 'SET_SAFETY_AGREEMENT', payload: val }),
    toggleSafetyAgreement: () => dispatch({ type: 'TOGGLE_SAFETY_AGREEMENT' }),
    addGroupMember: (memberId) => dispatch({ type: 'ADD_GROUP_MEMBER', payload: memberId }),
    removeGroupMember: (memberId) => dispatch({ type: 'REMOVE_GROUP_MEMBER', payload: memberId }),
    resetTransaction: () => dispatch({ type: 'RESET_TRANSACTION' }),
    goToWelcome: () => dispatch({ type: 'GO_TO_WELCOME' }),
    showToast: (message, type) =>
      dispatch({ type: 'SHOW_TOAST', payload: { message, type } }),
    clearToast: () => dispatch({ type: 'CLEAR_TOAST' }),
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}
