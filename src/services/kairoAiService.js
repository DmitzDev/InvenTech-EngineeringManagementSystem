import { getInventory, AI_EXPERIMENT_PRESETS, LAB_OPTIONS } from '../data/equipmentData';

const API_KEY_STORAGE_KEY = 'kairo_gemini_api_key';
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

export function getStoredApiKey() {
  try {
    const key = localStorage.getItem(API_KEY_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
    return key.trim();
  } catch (e) {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }
}

export function saveApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem('kairo_active_model');
    }
  } catch (e) {
    console.error('Error saving API key to localStorage', e);
  }
}

function buildSystemInstruction(selectedLab) {
  const labContext = selectedLab
    ? `Current Selected Lab: ${selectedLab}`
    : 'All Engineering Laboratories (Civil, Digital, ECE, Chemistry, Physics)';

  const inventory = getInventory();
  const apparatusList = (inventory || []).map(
    (item) => `• [${item.tagCode}] ${item.name} (${item.lab} Lab, Category: ${item.category}, Stock: ${item.stock} ${item.unit || 'pcs'}) - ${item.description}`
  ).join('\n');

  const presetList = (AI_EXPERIMENT_PRESETS || []).map(
    (p) => `• Preset "${p.title}" (${p.lab} Lab): Items -> ${p.itemTagCodes?.join(', ')}. Description: ${p.description}`
  ).join('\n');

  return `You are "Kairo AI", the intelligent engineering laboratory assistant for the Universidad de Dagupan (UdD) School of Engineering POS Touchscreen Kiosk.

${labContext}
Official Document Code: UdD-FM-LM-01A-01 (Laboratory Equipment Borrower's Sheet)

Your Responsibilities:
1. Assist engineering students in selecting appropriate laboratory apparatus for their syllabus experiments (Civil Engineering, Digital Electronics, ECE Communications, Chemistry, and Physics).
2. Always refer to apparatus by their exact Tag Code in brackets whenever recommending equipment (e.g. [ENG-EQ-COMP-408-26], [ENG-CS- 7400- 888-26-13], [ENG-EQ-BEE-620-26-01-05], [ENG-EQ-BEKR-004-26], [ENG-EQ-CENT-306-26]).
3. Provide concise, clear, helpful, and COMPLETE responses in English or Filipino/Tagalog (or Taglish), matching the student's language.
4. Always finish your thoughts and sentences completely. Never cut off or stop in the middle of a sentence.
5. Warn students about lab safety protocols and pre-existing damage inspection.
6. Keep answers structured with bullet points and bold headers, suitable for a laboratory kiosk screen.

AVAILABLE APPARATUS IN INVENTORY:
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

export function generateOfflineKairoResponse(userMessage, selectedLab) {
  const query = (userMessage || '').toLowerCase();
  const inventory = getInventory();
  const isReservationIntent = /(pa[- ]?reserve|magpa[- ]?reserve|ipareserve|reservation|reserve|booking|pa[- ]?book)/i.test(query);
  const matchedPreset = AI_EXPERIMENT_PRESETS.find(
    (p) =>
      query.includes(p.title.toLowerCase()) ||
      (p.tags && p.tags.some((t) => query.includes(t.toLowerCase())))
  );

  if (matchedPreset) {
    const matchedItems = inventory.filter((i) =>
      matchedPreset.itemTagCodes.some((tc) => i.tagCode.replace(/\s+/g, '') === tc.replace(/\s+/g, ''))
    );
    const tagsFormatted = matchedItems.map((i) => `• [${i.tagCode}] **${i.name}**`).join('\n');

    return {
      text: `Kumusta! Para sa **${matchedPreset.title}**, ito ang mga opisyal na apparatus na kailangan:\n\n${tagsFormatted}\n\n*Paliwanag:* ${matchedPreset.description}\n\nPwede mong i-click ang button sa ibaba para 1-tap na maidagdag ang buong bundle sa iyong cart!`,
      source: 'offline',
      recommendedItems: matchedItems,
      isReservationIntent,
      matchedReservationItem: matchedItems[0] || null,
    };
  }

  const matchedApparatus = inventory.filter((item) => {
    const name = item.name.toLowerCase();
    const tag = item.tagCode.toLowerCase();
    if (query.includes(name) || (tag.length > 5 && query.includes(tag))) return true;
    if (query.includes('relay') && (tag.includes('bulb') || name.includes('relay'))) return true;
    if (query.includes('switch') && (tag.includes('dips') || name.includes('switch') || name.includes('sw'))) return true;
    if (query.includes('fuse') && (tag.includes('fuse') || name.includes('fuse'))) return true;
    if (query.includes('led') && (tag.includes('lblu') || name.includes('led'))) return true;
    if (query.includes('gate') && (name.includes('gate') || tag.includes('7400') || tag.includes('7402') || tag.includes('7408') || tag.includes('7432'))) return true;
    if (query.includes('ic') && (tag.includes('7400') || tag.includes('7402') || tag.includes('7404') || tag.includes('7408') || tag.includes('7485'))) return true;
    if (query.includes('ammeter') && (tag.includes('dcam') || name.includes('ammeter'))) return true;
    if (query.includes('voltmeter') && (tag.includes('divo') || name.includes('voltmeter'))) return true;
    if ((query.includes('module') || query.includes('etek') || query.includes('trainer')) && (tag.includes('bee') || tag.includes('enmg') || name.includes('module') || name.includes('etek'))) return true;
    if ((query.includes('generator') || query.includes('audio')) && (tag.includes('agen') || name.includes('generator'))) return true;
    if (query.includes('compass') && (tag.includes('comp') || name.includes('compass'))) return true;
    if ((query.includes('grinder') || query.includes('dewalt')) && (tag.includes('dewa') || name.includes('dewalt'))) return true;
    if ((query.includes('compression') || query.includes('stye')) && (tag.includes('styd') || name.includes('hydraulic'))) return true;
    if ((query.includes('alcohol') || query.includes('lamp')) && (tag.includes('alcl') || name.includes('alcohol lamp'))) return true;
    if ((query.includes('mat') || query.includes('asbestos')) && (tag.includes('asbe') || name.includes('asbestos'))) return true;
    if (query.includes('beaker') && (tag.includes('bekr') || tag.includes('beak') || name.includes('beaker'))) return true;
    if (query.includes('calorimeter') && (tag.includes('calo') || name.includes('calorimeter'))) return true;
    if ((query.includes('centripetal') || query.includes('force')) && (tag.includes('cent') || name.includes('centripetal'))) return true;
    if (query.includes('clamp') && (tag.includes('clam') || name.includes('clamp'))) return true;
    if (query.includes('magnet') && (tag.includes('barm') || name.includes('magnet'))) return true;
    if (query.includes('optics') && (tag.includes('rayo') || name.includes('optics'))) return true;
    if (query.includes('stopper') && (tag.includes('stop') || name.includes('stopper'))) return true;

    return false;
  });

  if (isReservationIntent) {
    const targetItem = matchedApparatus[0] || null;
    return {
      text: targetItem
        ? `Nais mo bang magpa-reserve ng **${targetItem.name}** ([${targetItem.tagCode}]) para sa inyong darating na laboratory experiment? Punan lamang ang reservation form sa ibaba para maitala agad sa Admin Counter!`
        : `Handa akong tulungan ka sa iyong Advance Equipment Reservation! Piliin lamang ang apparatus at ilagay ang iyong schedule sa form sa ibaba upang mai-notify ang Laboratory Admin.`,
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
          `• [${i.tagCode}] **${i.name}** — ${i.stock} ${i.unit || 'pcs'} available (${i.category})`
      )
      .join('\n');

    const isCartRequest = query.includes('add') || query.includes('cart') || query.includes('hiram') || query.includes('kuha');

    return {
      text: isCartRequest
        ? `Heto ang nahanap kong apparatus para sa iyong request:\n\n${itemsList}\n\nI-click lamang ang **"+ Add All to Borrow Cart"** button sa ibaba para maidagdag ito sa iyong borrowing slip!`
        : `Nahanap ko ang mga sumusunod na apparatus sa ating laboratory inventory para sa iyong katanungan:\n\n${itemsList}\n\nLahat ng mga ito ay available para sa reservation at borrowing sa ilalim ng form **UdD-FM-LM-01A-01**.`,
      source: 'offline',
      recommendedItems: topMatches,
      isReservationIntent: false,
    };
  }

  // 3. Safety and ISO Protocols
  if (query.includes('safety') || query.includes('damage') || query.includes('ingat') || query.includes('basag') || query.includes('return') || query.includes('sira') || query.includes('rules') || query.includes('liability')) {
    return {
      text: `### 🛡️ UdD School of Engineering Laboratory Safety Rules:\n\n1. **Pre-inspection:** I-check ang gamit bago i-submit ang form. Kung may sira na, i-toggle ang "Report Damaged".\n2. **Breakage Liability:** Ang nakapirma sa slip ang mananagot sakaling mabasag o mawala ang gamit.\n3. **Return Clearance:** I-scan ang barcode sa Custodian Counter pagkatapos ng klase para makakuha ng printed return slip.`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 4. Greetings
  if (query.includes('hi') || query.includes('hello') || query.includes('kumusta') || query.includes('kamusta') || query.includes('test') || query.includes('magandang')) {
    return {
      text: `Kumusta! Ako si **Kairo AI**, ang iyong Engineering Lab Assistant sa Universidad de Dagupan. Paano kita matutulungan ngayon? Pwede kang magtanong tungkol sa:\n\n• Mga kailangang gamit para sa iyong experiments (Civil, Digital/ECE, Chem)\n• Advance Equipment Reservation para sa susunod na klase\n• Laboratory safety protocols at equipment clearance`,
      source: 'offline',
      recommendedItems: [],
      isReservationIntent: false,
    };
  }

  // 5. Default General Response
  return {
    text: `Naiintindihan ko ang iyong tanong tungkol sa laboratory apparatus. Para sa kumpletong listahan ng available na gamit, maaari mong tingnan ang **Equipment Catalog** o piliin ang laboratory department (Civil, Digital, o Chemistry).\n\nMaaari ka ring magpa-reserve ng gamit nang maaga para maihanda na ito ng Custodian!`,
    source: 'offline',
    recommendedItems: [],
    isReservationIntent: false,
  };
}

// Online Gemini Caller
export async function askKairoAi(userMessage, selectedLab, chatHistory = []) {
  const apiKey = getStoredApiKey();

  // If no API key configured, use local offline engine
  if (!apiKey) {
    return generateOfflineKairoResponse(userMessage, selectedLab);
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

  const savedModel = localStorage.getItem('kairo_active_model');
  const candidateModels = savedModel
    ? [savedModel, ...CANDIDATE_MODELS.filter((m) => m !== savedModel)]
    : CANDIDATE_MODELS;

  const isReservationIntent = /(pa[- ]?reserve|magpa[- ]?reserve|ipareserve|reservation|reserve|booking|pa[- ]?book)/i.test(userMessage);

  for (const model of candidateModels) {
    const cleanModelName = model.replace(/^models\//, '');
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (candidateText && candidateText.trim()) {
          const recommendedItems = extractApparatusItemsFromText(candidateText);
          return {
            text: candidateText.trim(),
            source: 'gemini',
            recommendedItems,
            isReservationIntent,
            matchedReservationItem: recommendedItems[0] || null,
          };
        }
      }
    } catch (e) {
      console.warn(`Model ${cleanModelName} failed:`, e);
    }
  }
  return generateOfflineKairoResponse(userMessage, selectedLab);
}

export async function testGeminiApiKey(apiKey) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return { success: false, message: 'Please enter an API key.' };
  }

  try {
    const listEndpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    const listResponse = await fetch(listEndpoint);

    let modelsToTry = [...CANDIDATE_MODELS];

    if (listResponse.ok) {
      const listData = await listResponse.json();
      const availableModels = (listData.models || [])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''));

      if (availableModels.length > 0) {
        modelsToTry = [
          ...availableModels.filter((m) => m.includes('3.6-flash')),
          ...availableModels.filter((m) => m.includes('3.7-flash')),
          ...availableModels.filter((m) => m.includes('flash-latest')),
          ...availableModels.filter((m) => m.includes('flash') && !m.includes('3.6') && !m.includes('3.7')),
          ...availableModels,
        ].filter((v, i, a) => a.indexOf(v) === i);
      }
    }

    let lastError = '';
    for (const modelName of modelsToTry) {
      try {
        const testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
        const genResponse = await fetch(testEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with OK' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        });

        if (genResponse.ok) {
          localStorage.setItem('kairo_active_model', modelName);
          return {
            success: true,
            message: `Connected successfully! Active Model: ${modelName}`,
          };
        } else {
          const errData = await genResponse.json().catch(() => ({}));
          lastError = errData?.error?.message || `Model ${modelName} returned status ${genResponse.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }
    return {
      success: false,
      message: lastError || 'Could not connect to Gemini API. Please check your key.',
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Network error connecting to Google Gemini API.',
    };
  }
}

