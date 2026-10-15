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
    (item) => `• [${item.tagCode}] ${item.name} (${item.lab} Lab, Stock: ${item.stock} ${item.unit || 'pcs'}, Bin: ${getCompartmentBin(item)})`
  ).join('\n');

  return `You are CPEX (Computer Programmed Engineering eXpert), the laboratory AI assistant of the School of Engineering, Universidad de Dagupan.

CRITICAL DIRECTIVES:
1. BE DIRECT TO THE POINT: Always answer the student's or professor's inquiry directly in 1 to 3 concise, clear sentences.
2. NO ROBOTIC HEADERS OR FILLER: Do NOT use robotic headers like "### [CPEX.SYS // TELEMETRY]" or introductory fluff like "Hello! As an AI...". Give the direct answer immediately.
3. EQUIPMENT & STOCK:
   - If asked about an item, state directly if it is available, the exact stock count, and the exact Bin Compartment (e.g. "Yes, we have 4 units of [ENG-EQ-COMP-408-26] Digital Multimeter available in BIN-A02.").
4. BORROWING & CLEARANCE RULES:
   - Maximum of 5 items per student group.
   - Return cutoff: End of class period or before 5:00 PM on the same day.
   - To return: Go to Return Station, enter 9-digit Student ID, and present equipment to the laboratory custodian.
   - Damaged items or unreturned apparatus result in a temporary clearance hold.
5. LANGUAGE: Match the user's inquiry language naturally (Tagalog, English, or Taglish).

ACTIVE LABORATORY INVENTORY:
${apparatusList}
Context: ${labContext}`;
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
 * Direct-to-the-Point Intelligent Engine for CPEX Copilot
 * Delivers immediate, precise answers for students and faculty
 */
export function generateOfflineCpexResponse(userMessage, selectedLab) {
  const query = (userMessage || '').trim().toLowerCase();
  const inventory = getInventory();
  const isReservationIntent = /(pa[- ]?reserve|magpa[- ]?reserve|ipareserve|reservation|reserve|booking|pa[- ]?book)/i.test(query);

  // 1. Advance Reservation Intent
  if (isReservationIntent) {
    const matched = inventory.find((i) => query.includes(i.name.toLowerCase()) || (i.tagCode && query.includes(i.tagCode.toLowerCase())));
    return {
      text: matched
        ? `Nakahanda na ang reservation para sa **${matched.name}** ([${matched.tagCode}]) sa ${getCompartmentBin(matched)}. Sagutan ang form sa ibaba para maipila sa Custodian.`
        : `Maaari kang magpa-reserve ng kagamitan. Piliin ang apparatus at oras sa form sa ibaba.`,
      source: 'offline',
      recommendedItems: matched ? [matched] : [],
      isReservationIntent: true,
      matchedReservationItem: matched || null,
    };
  }

  // 2. Specific Apparatus Search & Availability Check
  const matchedApparatus = inventory.filter((item) => {
    const name = item.name.toLowerCase();
    const tag = (item.tagCode || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();

    if (query.includes(name) || (tag.length > 4 && query.includes(tag))) return true;
    if (query.includes('oscilloscope') && (name.includes('oscilloscope') || tag.includes('dso') || tag.includes('osci'))) return true;
    if ((query.includes('multimeter') || query.includes('tester') || query.includes('voltmeter') || query.includes('ammeter')) && (name.includes('multimeter') || tag.includes('divo') || tag.includes('dcam') || tag.includes('meter'))) return true;
    if (query.includes('logic probe') && (name.includes('logic') || tag.includes('probe'))) return true;
    if (query.includes('breadboard') && (name.includes('breadboard') || tag.includes('brd') || cat.includes('prototyping'))) return true;
    if ((query.includes('jumper') || query.includes('wire') || query.includes('cable')) && (name.includes('wire') || tag.includes('wire') || tag.includes('lead') || tag.includes('probe'))) return true;
    if (query.includes('power supply') && (name.includes('power') || tag.includes('dcps') || tag.includes('agen'))) return true;
    if (query.includes('function generator') && (name.includes('generator') || tag.includes('fgen') || tag.includes('agen'))) return true;
    if (query.includes('trainer') && (tag.includes('bee') || name.includes('module') || name.includes('etek') || name.includes('trainer'))) return true;
    if (query.includes('relay') && (tag.includes('bulb') || name.includes('relay'))) return true;
    if (query.includes('switch') && (tag.includes('dips') || name.includes('switch') || name.includes('sw'))) return true;
    if (query.includes('beaker') && tag.includes('bekr')) return true;
    if (query.includes('flask') && tag.includes('flsk')) return true;

    // Logic ICs
    if (query.includes('7400') && tag.includes('7400')) return true;
    if (query.includes('7402') && tag.includes('7402')) return true;
    if (query.includes('7404') && tag.includes('7404')) return true;
    if (query.includes('7408') && tag.includes('7408')) return true;
    if (query.includes('7432') && tag.includes('7432')) return true;
    if (query.includes('7485') && tag.includes('7485')) return true;
    if (query.includes('7486') && tag.includes('7486')) return true;
    if ((query.includes('nand') || query.includes('nor') || query.includes('xor') || query.includes('logic gate') || query.includes('ic')) && (cat.includes('ic') || cat.includes('logic'))) return true;

    return false;
  });

  if (matchedApparatus.length > 0) {
    const topMatches = matchedApparatus.slice(0, 3);
    const primary = topMatches[0];

    // Check if query is asking for definition ("ano ang", "what is")
    const isDefinition = query.includes('ano ang') || query.includes('what is') || query.includes('ano po ang') || query.includes('para saan') || query.includes('gamit ng');

    let responseText = '';
    if (isDefinition && primary) {
      responseText = `Ang **${primary.name}** ay ${primary.description || 'kagamitan sa laboratoryo'}. Kasalukuyang may **${primary.stock} ${primary.unit || 'pcs'}** na available sa **${getCompartmentBin(primary)}**.`;
    } else {
      const itemsList = topMatches
        .map((i) => `• [${i.tagCode}] **${i.name}** — May **${i.stock} ${i.unit || 'pcs'}** sa **${getCompartmentBin(i)}**`)
        .join('\n');
      responseText = `Oo, available sa stock ang mga sumusunod:\n\n${itemsList}\n\nPwede mo itong idagdag sa iyong borrow cart.`;
    }

    return {
      text: responseText,
      source: 'offline',
      recommendedItems: topMatches,
      isReservationIntent: false,
    };
  }

  // 3. Borrowing Rules / Limits
  if (query.includes('limit') || query.includes('ilan') || query.includes('pwede hiramin') || query.includes('maximum') || query.includes('rules') || query.includes('policy') || query.includes('ilang gamit') || query.includes('ilang piraso')) {
    return {
      text: `Hanggang **5 items lamang** ang pinapayagang hiramin bawat student group sa bawat laboratory session. Lahat ay dapat maisauli bago mag-5:00 PM sa araw ding iyon.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 4. Return Procedure & Clearance
  if (query.includes('return') || query.includes('sauli') || query.includes('ibalik') || query.includes('paano mag-return') || query.includes('paano ibalik') || query.includes('clearance') || query.includes('how to return')) {
    return {
      text: `Para magsauli: Buksan ang **Return Station** sa kiosk, ilagay ang iyong **9-digit Student ID** (o i-scan ang barcode), at iabot ang gamit sa laboratory custodian para ma-verify at ma-clear agad.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 5. Return Cutoff & Operating Hours
  if (query.includes('oras') || query.includes('time') || query.includes('cutoff') || query.includes('kailan ibabalik') || query.includes('deadline') || query.includes('hanggang anong')) {
    return {
      text: `Ang cutoff ng pagbabalik ay bago matapos ang inyong class period o pinakamatagal bago mag-**5:00 PM** ng parehong araw. Ang mga hindi maisasauli sa oras ay magkakaroon ng clearance hold.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 6. Damaged / Broken Items
  if (query.includes('sira') || query.includes('basag') || query.includes('defect') || query.includes('damage') || query.includes('broken') || query.includes('nasira') || query.includes('sunog')) {
    return {
      text: `I-report agad sa Laboratory Custodian. Kung napansing may sira bago umalis ng counter, ipapalit agad. Kung nasira habang ginagamit, itatala ito sa Form UdD-FM-LM-01A-01 para sa kaukulang aksyon.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 7. Faculty / Custodian In-Charge
  if (query.includes('custodian') || query.includes('prof') || query.includes('professor') || query.includes('instructor') || query.includes('sino') || query.includes('faculty')) {
    return {
      text: `Ang School of Engineering laboratories ay pinangangasiwaan nina **Engr. Jin Benir Macaranas** at **Engr. Rolando De Guzman**.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 8. Experiment Syllabi Presets
  const matchedPreset = AI_EXPERIMENT_PRESETS.find(
    (p) =>
      query.includes(p.title.toLowerCase()) ||
      (p.tags && p.tags.some((t) => query.includes(t.toLowerCase())))
  );

  if (matchedPreset) {
    const matchedItems = inventory.filter((i) =>
      matchedPreset.itemTagCodes.some((tc) => i.tagCode.replace(/\s+/g, '') === tc.replace(/\s+/g, ''))
    );
    const tagsFormatted = matchedItems.map((i) => `• [${i.tagCode}] **${i.name}** sa \`${getCompartmentBin(i)}\``).join('\n');

    return {
      text: `Para sa **${matchedPreset.title}** (${matchedPreset.lab} Lab), ito ang mga kailangan:\n\n${tagsFormatted}\n\nPindutin ang button sa ibaba para mailagay agad sa iyong borrow cart.`,
      source: 'offline',
      recommendedItems: matchedItems,
      isReservationIntent: false,
      matchedReservationItem: matchedItems[0] || null,
    };
  }

  // 9. Greetings
  if (query.includes('hi') || query.includes('hello') || query.includes('kumusta') || query.includes('kamusta') || query.includes('cpex') || query.includes('who are you') || query.includes('sino ka')) {
    return {
      text: `Ako si **CPEX**, ang laboratory assistant ng School of Engineering. Sabihin mo lang kung anong apparatus, stock, bin location, o patakaran ang nais mong malaman.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 10. Direct General Help
  return {
    text: `Maaari kang magtanong nang direkta tungkol sa stock at lokasyon ng anumang kagamitan, borrowing rules, o return clearance procedures.`,
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
