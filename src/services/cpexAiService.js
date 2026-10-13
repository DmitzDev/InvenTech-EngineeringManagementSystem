import { getInventory, AI_EXPERIMENT_PRESETS, LAB_OPTIONS } from '../data/equipmentData';

const API_KEY_STORAGE_KEY = 'cpex_gemini_api_key';
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export function getStoredApiKey() {
  try {
    const key =
      localStorage.getItem(API_KEY_STORAGE_KEY) ||
      localStorage.getItem('kairo_gemini_api_key') ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      '';
    return key.trim();
  } catch (e) {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }
}

export function saveApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
      localStorage.setItem('kairo_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem('kairo_gemini_api_key');
      localStorage.removeItem('cpex_active_model');
      localStorage.removeItem('kairo_active_model');
    }
  } catch (e) {
    console.error('[CPEX.SYS] Error saving API key to localStorage', e);
  }
}

/**
 * Deterministic Locker/Compartment Bin Mapper
 * Maps category and lab to standardized engineering storage bins
 */
export function getCompartmentBin(item) {
  if (!item) return 'BIN-GEN01';
  const tag = (item.tagCode || '').toUpperCase();
  const cat = (item.category || '').toUpperCase();
  const lab = (item.lab || '').toUpperCase();

  if (tag.includes('7400') || tag.includes('7402') || tag.includes('7408') || tag.includes('7432') || tag.includes('7485') || cat.includes('IC')) {
    return 'BIN-B04 (Logic IC Tray)';
  }
  if (tag.includes('DSO') || tag.includes('OSCI') || item.name?.toLowerCase().includes('oscilloscope')) {
    return 'BIN-A01 (Precision Benches)';
  }
  if (tag.includes('DIVO') || tag.includes('DCAM') || item.name?.toLowerCase().includes('multimeter')) {
    return 'BIN-A02 (Meter Stacks)';
  }
  if (tag.includes('BEE') || tag.includes('ETEK') || item.name?.toLowerCase().includes('trainer') || item.name?.toLowerCase().includes('module')) {
    return 'BIN-C02 (Modular Racks)';
  }
  if (cat.includes('PROTOTYPING') || tag.includes('DIPS') || tag.includes('SWIT')) {
    return 'BIN-B01 (Switch/Passive Components)';
  }
  if (lab.includes('CHEM') || cat.includes('GLASSWARE')) {
    return 'BIN-CH01 (Glassware Cabinet)';
  }
  if (lab.includes('CE') || lab.includes('CIVIL')) {
    return 'BIN-CE02 (Heavy Instruments)';
  }
  return 'BIN-A03 (General Hardware)';
}

function buildSystemInstruction(selectedLab) {
  const labContext = selectedLab
    ? `Active Sector: ${selectedLab === 'DIGITAL_ECE' ? 'Digital Logic, Microcontroller & ECE Communications Laboratory' : selectedLab}`
    : 'All Engineering Laboratories (Computer Engineering, ECE, Civil, Chemistry, Physics)';

  const inventory = getInventory();
  const apparatusList = (inventory || []).slice(0, 150).map(
    (item) => `• [${item.tagCode}] ${item.name} (${item.lab} Lab, Stock: ${item.stock} ${item.unit || 'pcs'}, Bin: ${getCompartmentBin(item)}) - ${item.description || item.category}`
  ).join('\n');

  const presetList = (AI_EXPERIMENT_PRESETS || []).map(
    (p) => `• [PRESET] "${p.title}" (${p.lab}): Items -> ${p.itemTagCodes?.join(', ')}. Spec: ${p.description}`
  ).join('\n');

  return `You are "CPEX" (Computer Programmed Engineering eXpert), the high-precision, engineering-grade laboratory copilot for the InvenTech Engineering Management Kiosk.
Telemetry ID: [CPEX.SYS // CpE-COPILOT v2.0]

SYSTEM DIRECTIVES:
1. Role: Computer Engineering & Laboratory Hardware Copilot.
2. Tone: Direct, concise, technical, precise, and professional. No fluff, no generic corporate filler.
3. Language: English or Filipino/Taglish, matching the user's inquiry style.
4. Equipment Referencing: Always format equipment with exact Tag Codes in square brackets, e.g. [ENG-CS-7400-888-26-13], [ENG-EQ-COMP-408-26], with Bin Compartments (e.g., BIN-A01, BIN-B04).
5. Technical Specs:
   - Digital Storage Oscilloscope: 50MHz-100MHz Dual Channel, 1GSa/s real-time sampling.
   - Digital Multimeter: True RMS Auto-ranging, continuity beep, 10A fused protection.
   - 74xx TTL Series: 7400 (Quad 2-Input NAND), 7402 (NOR), 7404 (Hex Inverter), 7408 (AND), 7432 (OR), 7485 (4-Bit Magnitude Comparator), 7486 (XOR).
6. Borrowing Rules:
   - Up to 5 items max per group.
   - Standard session return cutoff: End of class period (max 5:00 PM same day).
   - Pre-inspection required: Verify fuse, probe cables, and IC pins before leaving counter.
7. Return & Clearance Protocol:
   - Tap "Return" on the top header or kiosk home screen.
   - Enter Student ID number or scan official Transaction Ref barcode.
   - Custodian verifies item integrity; clearance status switches to "CLEARED".

ACTIVE CONTEXT:
${labContext}
Official Document ID: UdD-FM-LM-01A-01 (Laboratory Equipment Borrower's Sheet)

INVENTORY SAMPLING WITH BINS:
${apparatusList}

STANDARD EXPERIMENT PRESETS:
${presetList}`;
}

export function extractApparatusItemsFromText(text) {
  if (!text) return [];
  const foundItems = [];
  const inventory = getInventory();
  const tagRegex = /\[([A-Z0-9-_\s]+)\]/g;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const rawCode = match[1].trim().replace(/\s+/g, ' ');
    const item = inventory.find(
      (i) => i.tagCode && i.tagCode.toUpperCase().replace(/\s+/g, ' ') === rawCode.toUpperCase()
    );
    if (item && !foundItems.some((f) => f.id === item.id)) {
      foundItems.push(item);
    }
  }

  if (foundItems.length === 0) {
    inventory.forEach((item) => {
      if (item.name && item.name.length > 3 && text.toLowerCase().includes(item.name.toLowerCase())) {
        if (!foundItems.some((f) => f.id === item.id)) {
          foundItems.push(item);
        }
      }
    });
  }

  return foundItems;
}

/**
 * High-Precision Offline Rule-Engine for CPEX Copilot
 */
export function generateOfflineCpexResponse(userMessage, selectedLab) {
  const query = (userMessage || '').trim().toLowerCase();
  const inventory = getInventory();
  const isReservationIntent = /(pa[- ]?reserve|magpa[- ]?reserve|ipareserve|reservation|reserve|booking|pa[- ]?book)/i.test(query);

  // 1. Tool Availability / Specific Catalog Search
  if (query.includes('tool availability') || query.includes('check tool') || query.includes('available') || query.includes('stock')) {
    const digitalMatches = inventory.filter((i) => i.lab === 'DIGITAL' || i.lab === 'ECE' || i.category?.includes('Logic') || i.category?.includes('Equipment')).slice(0, 4);
    const list = digitalMatches.map((i) => `• [${i.tagCode}] **${i.name}**\n  Loc: \`${getCompartmentBin(i)}\` | Available: \`${i.stock} ${i.unit || 'pcs'}\``).join('\n');
    return {
      text: `### Available Laboratory Tools & Equipment\nHere are currently available apparatus in the active laboratory sector:\n\n${list}\n\nSelect items above or tap "+ Add All to Borrow Cart" to add them to your borrowing slip. Maximum 5 items per student group.`,
      source: 'offline',
      recommendedItems: digitalMatches,
      isReservationIntent: false,
    };
  }

  // 2. Return Equipment Protocol
  if (query.includes('how to return') || query.includes('return equipment') || query.includes('sauli') || query.includes('ibalik') || query.includes('return procedure')) {
    return {
      text: `### How to Return Laboratory Equipment\nFollow these steps to return borrowed apparatus and receive clearance:\n\n1. **Open Return Station:** Tap the **"Return"** button on the top header dock or Welcome Screen.\n2. **Enter Student ID:** Input your 11-digit Student ID (e.g., \`23-1374-693\`) or scan the barcode from your slip.\n3. **Physical Inspection:** Bring the items to the Custodian Counter for inspection.\n4. **Custodian Sign-off:** Once confirmed, your borrowing status will immediately update to **CLEARED**.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 3. Report Damaged Hardware
  if (query.includes('report damaged') || query.includes('damaged hardware') || query.includes('sira') || query.includes('basag') || query.includes('defect') || query.includes('broken')) {
    return {
      text: `### Reporting Damaged Hardware & Defects\nPre-Inspection and safety protocols:\n\n• **Check Before Leaving:** Always inspect probes, multimeter fuses, and IC pins before leaving the dispensing counter.\n• **Immediate Report:** If an item is already damaged upon checkout, inform the Custodian right away so it is logged under maintenance.\n• **Student Accountability:** Items damaged during the class period must be reported to the Laboratory Custodian (Form UdD-FM-LM-01A-01).`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 4. Laboratory Clearance Guide
  if (query.includes('laboratory clearance') || query.includes('clearance guide') || query.includes('clearance') || query.includes('hold') || query.includes('restriction')) {
    return {
      text: `### Laboratory Clearance Guidelines\nClearance reminders for engineering students:\n\n• **RESTRICTED STATUS:** Happens when borrowed apparatus is not returned before the 5:00 PM cutoff.\n• **Borrowing Lock:** Students with unreturned items cannot borrow new equipment until previous items are cleared.\n• **Settlement:** Visit the Department of Computer Engineering / School of Engineering Custodian Desk to clear pending loans.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 5. Syllabus Experiment Presets
  const matchedPreset = AI_EXPERIMENT_PRESETS.find(
    (p) =>
      query.includes(p.title.toLowerCase()) ||
      (p.tags && p.tags.some((t) => query.includes(t.toLowerCase())))
  );

  if (matchedPreset) {
    const matchedItems = inventory.filter((i) =>
      matchedPreset.itemTagCodes.some((tc) => i.tagCode.replace(/\s+/g, '') === tc.replace(/\s+/g, ''))
    );
    const tagsFormatted = matchedItems.map((i) => `• [${i.tagCode}] **${i.name}** (\`${getCompartmentBin(i)}\`)`).join('\n');

    return {
      text: `### Preset Syllabus Bundle: ${matchedPreset.title}\nHere are the recommended items for this experiment in ${matchedPreset.lab} Lab:\n\n${tagsFormatted}\n\n**Experiment Description:** ${matchedPreset.description}\n\nTap the button below to add all items directly to your borrow cart.`,
      source: 'offline',
      recommendedItems: matchedItems,
      isReservationIntent,
      matchedReservationItem: matchedItems[0] || null,
    };
  }

  // 6. Direct Hardware Pattern Matcher
  const matchedApparatus = inventory.filter((item) => {
    const name = item.name.toLowerCase();
    const tag = item.tagCode.toLowerCase();
    if (query.includes(name) || (tag.length > 5 && query.includes(tag))) return true;
    if (query.includes('oscilloscope') && (name.includes('oscilloscope') || tag.includes('dso') || tag.includes('osci'))) return true;
    if (query.includes('multimeter') && (name.includes('multimeter') || tag.includes('divo') || tag.includes('dcam') || tag.includes('meter'))) return true;
    if (query.includes('logic probe') && (name.includes('logic') || tag.includes('probe'))) return true;
    if (query.includes('ic') && (tag.includes('7400') || tag.includes('7402') || tag.includes('7404') || tag.includes('7408') || tag.includes('7432') || tag.includes('7485'))) return true;
    if (query.includes('gate') && (name.includes('gate') || tag.includes('7400') || tag.includes('7408') || tag.includes('7432'))) return true;
    if (query.includes('relay') && (tag.includes('bulb') || name.includes('relay'))) return true;
    if (query.includes('switch') && (tag.includes('dips') || name.includes('switch') || name.includes('sw'))) return true;
    if (query.includes('power supply') && (name.includes('power') || tag.includes('agen') || tag.includes('dcps'))) return true;
    if (query.includes('trainer') && (tag.includes('bee') || name.includes('module') || name.includes('etek'))) return true;
    if (query.includes('beaker') && tag.includes('bekr')) return true;
    return false;
  });

  if (isReservationIntent) {
    const targetItem = matchedApparatus[0] || null;
    return {
      text: targetItem
        ? `### Equipment Advance Reservation\nSelected Apparatus: **${targetItem.name}** ([${targetItem.tagCode}]) located at \`${getCompartmentBin(targetItem)}\`.\nFill out the reservation form below to queue your booking with the Laboratory Custodian.`
        : `### Equipment Advance Reservation\nReady to schedule your equipment reservation. Specify the laboratory apparatus and required session timeslot below.`,
      source: 'offline',
      recommendedItems: targetItem ? [targetItem] : [],
      isReservationIntent: true,
      matchedReservationItem: targetItem,
    };
  }

  if (matchedApparatus.length > 0) {
    const topMatches = matchedApparatus.slice(0, 4);
    const itemsList = topMatches
      .map(
        (i) =>
          `• [${i.tagCode}] **${i.name}**\n  Bin: \`${getCompartmentBin(i)}\` | Available: \`${i.stock} ${i.unit || 'pcs'}\` (${i.category})`
      )
      .join('\n');

    return {
      text: `### Matched Equipment in Inventory\nFound ${matchedApparatus.length} matching item(s) in active laboratory stock:\n\n${itemsList}\n\n*All items are verified under Official Document Code UdD-FM-LM-01A-01.*`,
      source: 'offline',
      recommendedItems: topMatches,
      isReservationIntent: false,
    };
  }

  // 7. General Greetings
  if (query.includes('hi') || query.includes('hello') || query.includes('kumusta') || query.includes('kamusta') || query.includes('cpex') || query.includes('who are you')) {
    return {
      text: `Hello! I am **CPEX** (Computer Programmed Engineering eXpert), your laboratory assistant.\n\n• **Equipment & Stock:** Oscilloscopes, multimeters, 74xx TTL ICs, microcontrollers, and apparatus bins.\n• **Rules & Guidelines:** Maximum 5 items per student group, return within class period.\n• **Procedures:** Equipment return clearance and reporting damaged hardware.\n\nHow can I help you today?`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 8. Default Direct Technical Fallback
  return {
    text: `How can I assist you with the laboratory? You can ask about available apparatus, syllabi experiments, reservation rules, or return procedures. You may also select any of the quick action buttons below.`,
    source: 'offline',
    recommendedItems: [],
    isReservationIntent: false,
  };
}

// Online Gemini Query Caller for CPEX
export async function askCpexAi(userMessage, selectedLab, chatHistory = []) {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    return generateOfflineCpexResponse(userMessage, selectedLab);
  }

  const systemPrompt = buildSystemInstruction(selectedLab);
  const contents = [];

  if (chatHistory && chatHistory.length > 0) {
    let expectedRole = 'user';
    for (const m of chatHistory.slice(-6)) {
      const role = m.sender === 'user' ? 'user' : 'model';
      if (role !== expectedRole) {
        if (expectedRole === 'user' && contents.length === 0) {
          expectedRole = 'model';
        }
      }
      contents.push({
        role,
        parts: [{ text: m.text }],
      });
      expectedRole = expectedRole === 'user' ? 'model' : 'user';
    }
  }

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const savedModel = localStorage.getItem('cpex_active_model') || localStorage.getItem('kairo_active_model');
  const modelsToTry = savedModel
    ? [savedModel, ...CANDIDATE_MODELS.filter((m) => m !== savedModel)]
    : CANDIDATE_MODELS;

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.25,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawText) {
        localStorage.setItem('cpex_active_model', model);
        const recommendedItems = extractApparatusItemsFromText(rawText);
        const isReservationIntent = /(pa[- ]?reserve|magpa[- ]?reserve|ipareserve|reservation|reserve)/i.test(userMessage);

        return {
          text: rawText,
          source: 'gemini',
          modelUsed: model,
          recommendedItems,
          isReservationIntent,
          matchedReservationItem: recommendedItems[0] || null,
        };
      }
    } catch (err) {
      console.warn(`[CPEX.SYS] Model ${model} failed, testing fallback:`, err.message);
      lastError = err;
    }
  }

  console.warn('[CPEX.SYS] All online models failed, deploying local offline telemetry:', lastError);
  const fallback = generateOfflineCpexResponse(userMessage, selectedLab);
  fallback.warning = 'Online telemetry unavailable. Fallback to offline rule engine.';
  return fallback;
}

export async function testGeminiApiKey(candidateKey) {
  if (!candidateKey || !candidateKey.trim()) {
    return { success: false, message: 'Please provide a valid Gemini API Key.' };
  }

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${candidateKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'PING CPEX TEST' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      if (response.ok) {
        localStorage.setItem('cpex_active_model', model);
        return {
          success: true,
          message: `CPEX Telemetry Online! Model calibrated: ${model}`,
          workingModel: model,
        };
      }
    } catch {
      // try next
    }
  }

  return {
    success: false,
    message: 'Authentication failed. Please verify API Key credentials.',
  };
}
