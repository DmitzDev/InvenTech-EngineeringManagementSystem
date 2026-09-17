import React, { createContext, useContext, useReducer, useEffect } from 'react';

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

const RESERVATIONS_STORAGE_KEY = 'udd_kiosk_reservations';

const DEFAULT_SAMPLE_RESERVATIONS = [
  {
    id: 'RES-2026-8801',
    itemId: 'ce-001',
    tagCode: 'CE-SLP-01',
    name: 'Slump Cone Mold with Base Plate',
    reserveDate: '2026-08-30',
    timeSlot: '10:00 AM - 12:00 NN',
    qty: 2,
    unit: 'set',
    studentName: 'Juan Dela Cruz',
    program: 'BSCE',
    groupNo: '2',
    instructor: 'Engr. Rolando De Guzman',
    courseCode: 'CEMAT1L',
    status: 'PENDING', // 'PENDING' | 'PREPARED' | 'COMPLETED' | 'CANCELLED'
    createdAt: 'Aug 29, 2026 • 09:30 AM',
  },
  {
    id: 'RES-2026-8802',
    itemId: 'dig-001',
    tagCode: 'ECE-BRD-01',
    name: 'Solderless Breadboard (830 Points)',
    reserveDate: '2026-08-30',
    timeSlot: '01:00 PM - 03:00 PM',
    qty: 4,
    unit: 'pc',
    studentName: 'Maria Nicole Reyes',
    program: 'BSCpE',
    groupNo: '4',
    instructor: 'Engr. Jin Benir Macaranas',
    courseCode: 'CPE-LOGIC',
    status: 'PENDING',
    createdAt: 'Aug 29, 2026 • 11:15 AM',
  },
];

export const getStoredReservations = () => {
  try {
    const data = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  // Initialize with sample reservations on first run
  localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_RESERVATIONS));
  return DEFAULT_SAMPLE_RESERVATIONS;
};

export const saveStoredReservations = (reservations) => {
  try {
    localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));
  } catch {
    // ignore
  }
};

const TRANSACTIONS_STORAGE_KEY = 'udd_kiosk_transactions';

export const getStoredTransactions = () => {
  try {
    const data = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // start empty if error
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
    program: '',
    courseCode: '',
    groupNo: '1',
    groupLeader: '',
    instructor: '',
    labTime: '',
    ...getInitialDateStrings(),
  },
  selectedLab: null, // 'CE' | 'DIGITAL' | 'CHEM'
  cart: [], // [{ id, name, tagCode, category, qty, unit, description, isDamaged, damageNote }]
  reservations: getStoredReservations(),
  activeTransactions: getStoredTransactions(),
  activeClearanceRecord: null,
  transactionId: null,
  timestamp: null,
  toast: null,
};

function transactionReducer(state, action) {
  switch (action.type) {
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
          message: `Added "${item.name}" to cart`,
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
          message: `Added ${addedCount} suggested apparatus to cart`,
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
        (i) => i.returnCondition === 'damaged' || i.returnCondition === 'lost'
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

      return {
        ...state,
        activeTransactions: updatedTransactions,
        activeClearanceRecord: updatedRecord,
        toast: {
          id: Date.now(),
          type: 'success',
          message: `Equipment Returned! Borrower clearance generated (${status})`,
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
    setActiveClearanceRecord: (record) =>
      dispatch({ type: 'SET_ACTIVE_CLEARANCE_RECORD', payload: record }),
    checkReservationConflict,
    commitTransaction: () => dispatch({ type: 'COMMIT_TRANSACTION' }),
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
