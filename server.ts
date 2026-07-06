import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { sanitizeInput, validateParams, safeJSONParse, deepSanitize } from './src/utils/security';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client configuration
let aiInstance: GoogleGenAI | null = null;

function getGeminiAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  try {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    return aiInstance;
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

// API Route: Check if running with real Gemini API Key
app.get('/api/gemini/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isSimulated = !apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '';
  res.json({ isSimulated });
});

// API Route: Live Crowd Density Analysis & Operations Insights
app.post('/api/gemini/crowd-analysis', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { locations, incidents } = sanitizedBody;

  // Defensive input validation
  const validation = validateParams({ locations, incidents });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid body schema', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    // Elegant fallback simulation
    return res.json({
      isSimulated: true,
      bottlenecks: [
        'North Gate (Gate 1) - Backlog of roughly 20-25 minutes due to ticketing scan latency.',
        'Sector B Merchandise Megastore - High visual queue length wrapping around the main corridor.'
      ],
      gateRecommendations: [
        { id: 'gate-n', status: 'congested', recommendation: 'Redirect incoming fans to South Gate 3.' },
        { id: 'gate-s', status: 'clear', recommendation: 'Express priority lane open. Operating at 40% capacity.' },
        { id: 'gate-e', status: 'clear', recommendation: 'VIP/Premium only. Shift general staff support if needed.' }
      ],
      aiInsights: 'Google Gemini analyzed crowd counts across all gates. Peak congestion is currently at Gate 1 (North Stand). Sector C restroom is experiencing high demand following the 2nd quarter rush. Total active incidents are low but gate scanners require manual bypass assistance.',
      recommendations: [
        'Deploy 2 additional volunteers to Gate 1 (North) to guide fans with digital ticketing errors.',
        'Activate dynamic display signage at Section B corridor: "Megastore is currently busy, try ordering via App for pickup".',
        'Trigger ventilation boost in South Stand Restroom corridor.'
      ]
    });
  }

  try {
    const prompt = `You are the primary intelligence engine for a Smart Stadium Platform. 
    Analyze the following current stadium locations data: ${JSON.stringify(locations)} 
    and these active incidents: ${JSON.stringify(incidents)}.
    
    Provide a comprehensive crowd flow and density analysis. Return a structured JSON response with predictions, bottlenecks, gate optimizations, and clear action items.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a Senior Stadium Operations Analyst. Output ONLY a valid JSON object fitting the response schema. Keep insights practical, concise, and focused on safety, efficiency, and fan experience.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bottlenecks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific location bottlenecks identified.'
            },
            gateRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  status: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                }
              }
            },
            aiInsights: { type: Type.STRING, description: 'High-level analytical summary of stadium crowd patterns.' },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable steps for volunteers and security stewards.'
            }
          },
          required: ['bottlenecks', 'gateRecommendations', 'aiInsights', 'recommendations']
        }
      }
    });

    const parsedData = safeJSONParse(response.text, {
      bottlenecks: ['Sector Stand Concourse'],
      gateRecommendations: [],
      aiInsights: 'Active stadium analytics monitoring currently offline.',
      recommendations: ['Monitor active gates for backlogs.']
    });

    res.json({ ...parsedData, isSimulated: false });
  } catch (error: any) {
    console.error('Crowd Analysis API Error:', error);
    res.status(500).json({ error: 'Failed to run Crowd Analysis', details: error.message });
  }
});

// API Route: Smart Indoor Route Optimization
app.post('/api/gemini/optimize-route', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { startSeat, destination, accessibilityType, role } = sanitizedBody;

  const validation = validateParams({ startSeat, destination, accessibilityType, role });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid route parameters', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    // Fallback simulation
    return res.json({
      isSimulated: true,
      pathSummary: `Optimal route from Sector A Row ${startSeat || '10'} to ${destination || 'Food Court'}.`,
      instructions: [
        `Exit Sector A row through Left Portal 12.`,
        accessibilityType === 'wheelchair' 
          ? `Proceed down Ramp R1 (Step-free) to Main Concourse Level 1.` 
          : `Take Stairs S2 down to Concourse Level 1.`,
        `Turn right and follow the tactile guide paving past the Megastore.`,
        `Your destination is approximately 45 meters ahead on your left.`
      ],
      estimatedMinutes: accessibilityType === 'wheelchair' ? 6 : 4,
      alternativeRoute: 'Via Upper Ring Deck corridor (longer walk but completely empty queue).',
      accessibilityCompliance: true,
      safetyRating: 'green'
    });
  }

  try {
    const prompt = `Optimize the indoor route from Sector A Seat ${startSeat || 'General'} to destination: ${destination}.
    Accessibility mode specified: ${accessibilityType || 'none'}. User Role: ${role || 'fan'}.
    Provide detailed step-by-step turn instructions, estimated time, alternative paths, and accessibility compliance validation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an advanced smart stadium GPS route solver. Respond strictly with the exact JSON layout requested.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pathSummary: { type: Type.STRING },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedMinutes: { type: Type.NUMBER },
            alternativeRoute: { type: Type.STRING },
            accessibilityCompliance: { type: Type.BOOLEAN },
            safetyRating: { type: Type.STRING, description: 'Choose from green, yellow, or red.' }
          },
          required: ['pathSummary', 'instructions', 'estimatedMinutes', 'alternativeRoute', 'accessibilityCompliance', 'safetyRating']
        }
      }
    });

    const parsedData = safeJSONParse(response.text, {
      pathSummary: 'Standard stadium corridor transit.',
      instructions: ['Walk along the current Stand deck to Level 1 concourse.'],
      estimatedMinutes: 5,
      alternativeRoute: 'Via General Upper Deck walkway.',
      accessibilityCompliance: true,
      safetyRating: 'green'
    });

    res.json({ ...parsedData, isSimulated: false });
  } catch (error: any) {
    console.error('Route Optimization API Error:', error);
    res.status(500).json({ error: 'Failed to optimize route', details: error.message });
  }
});

// API Route: Intelligent Volunteer Task Assignments
app.post('/api/gemini/volunteer-tasks', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { volunteers, tasks, activeIncidents } = sanitizedBody;

  const validation = validateParams({ volunteers, tasks, activeIncidents });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid dispatcher payloads', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    return res.json({
      isSimulated: true,
      briefing: 'Welcome to Titan Stadium Support Team. Today, our primary challenge is handling the VIP corridor rush and the Gate 1 scanning lag. Please ensure all high-priority tasks are resolved immediately. Stay hydrated and alert!',
      assignments: [
        { taskId: 'task-1', assignee: 'Volunteer Sarah', strategy: 'Guide fans with ticket scanner errors at North Gate. Distribute pamphlets showing alternative South Gate entrance.' },
        { taskId: 'task-4', assignee: 'Volunteer James', strategy: 'Mop beverage spill at Sector C immediately. Place a physical safety yellow cone.' }
      ],
      alerts: [
        'An elderly fan at Sector A Row 15 requires medical assistance. Emergency buggy has been dispatched, please clear the concourse path.'
      ]
    });
  }

  try {
    const prompt = `Given these volunteers: ${JSON.stringify(volunteers)}, tasks: ${JSON.stringify(tasks)}, and stadium incidents: ${JSON.stringify(activeIncidents)},
    provide a tactical briefing, allocate task assignments, and list security alerts for volunteers. Ensure assignments make optimal use of available volunteers for critical issues.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an AI Volunteer Coordinator and Operations Dispatcher. Return ONLY a structured JSON response.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            briefing: { type: Type.STRING, description: 'General motivational and tactical team briefing statement.' },
            assignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                  strategy: { type: Type.STRING }
                }
              }
            },
            alerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['briefing', 'assignments', 'alerts']
        }
      }
    });

    const parsedData = safeJSONParse(response.text, {
      briefing: 'Standby volunteer roster instructions compiled.',
      assignments: [],
      alerts: []
    });

    res.json({ ...parsedData, isSimulated: false });
  } catch (error: any) {
    console.error('Volunteer Task API Error:', error);
    res.status(500).json({ error: 'Failed to assign tasks', details: error.message });
  }
});

// API Route: Lost & Found Chat Assistant
app.post('/api/gemini/lost-found', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { userMessage, history, database } = sanitizedBody;

  const validation = validateParams({ userMessage, database });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid query payload', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    return res.json({
      isSimulated: true,
      conversationReply: `I am sorry to hear you lost your item. I have searched our live stadium database. Based on your description, I found a promising match! Please proceed to the Main Concourse Center Desk where our volunteer James is holding an item matching that description.`,
      actionStep: 'Go to Main Concourse Center Desk',
      matchedWithItems: ['Black Leather Wallet with titan emblem', 'Silver Keyring'],
      volunteerInstruction: 'Match RFID chip or ID card on pickup.'
    });
  }

  try {
    const prompt = `User lost item message: "${userMessage}". Chat history: ${JSON.stringify(history)}. 
    Our active Lost & Found database has these registered lost or found entries: ${JSON.stringify(database)}.
    Provide an empathetic conversational reply, match potential items, outline the next logical action step for the fan, and give clear pickup instructions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an empathetic, efficient AI Lost & Found Stadium Assistant. Try to match the user request with the database items. Support the fan with clear steps.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conversationReply: { type: Type.STRING },
            actionStep: { type: Type.STRING },
            matchedWithItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            volunteerInstruction: { type: Type.STRING }
          },
          required: ['conversationReply', 'actionStep', 'matchedWithItems', 'volunteerInstruction']
        }
      }
    });

    const parsedData = safeJSONParse(response.text, {
      conversationReply: 'We are currently analyzing the lost and found database. Please stand by or report to the Main Center Desk.',
      actionStep: 'Visit Main Concourse Center Desk',
      matchedWithItems: [],
      volunteerInstruction: 'Compare verification proofs.'
    });

    res.json({ ...parsedData, isSimulated: false });
  } catch (error: any) {
    console.error('Lost & Found API Error:', error);
    res.status(500).json({ error: 'Failed to handle lost and found search', details: error.message });
  }
});

// API Route: Multi-language Announcement Translator
app.post('/api/gemini/translate-announcement', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { text, targetLanguage } = sanitizedBody;

  const validation = validateParams({ text, targetLanguage });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid translation properties', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    return res.json({
      isSimulated: true,
      translatedText: `[Simulated Translation in ${targetLanguage || 'Spanish'}]: ` + (text || 'Welcome to the match!'),
      pronunciationGuide: 'Stah-dee-um vehl-cum',
      culturalTips: 'Always speak in a polite tone. Stadium staff in this region respond warmly to basic local greetings.'
    });
  }

  try {
    const prompt = `Translate the following stadium announcement text: "${text}" into language: "${targetLanguage}".
    Also provide a phonetic pronunciation guide for speakers and minor cultural communication tips for stadium visitors.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a professional multilingual stadium translator. Provide high-quality translations, pronunciation guides, and communication tips.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            pronunciationGuide: { type: Type.STRING },
            culturalTips: { type: Type.STRING }
          },
          required: ['translatedText', 'pronunciationGuide', 'culturalTips']
        }
      }
    });

    const parsedData = safeJSONParse(response.text, {
      translatedText: text || 'Stadium Announcement',
      pronunciationGuide: 'Refer to local signs.',
      culturalTips: 'Be respectful of stadium security team instructions.'
    });

    res.json({ ...parsedData, isSimulated: false });
  } catch (error: any) {
    console.error('Translation API Error:', error);
    res.status(500).json({ error: 'Failed to translate announcement', details: error.message });
  }
});

// API Route: AI Incident Summary & Security Assessment
app.post('/api/gemini/incident-report', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { title, priority, location, description } = sanitizedBody;

  const validation = validateParams({ title, priority, location, description });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid incident reporting details', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    return res.json({
      isSimulated: true,
      incidentSummary: `Security Incident Assessment: ${title || 'Unlisted anomaly'} in ${location || 'Stadium'}. It poses a threat to spectator flow and safety. Security stewards should monitor this location immediately.`,
      recommendedAction: 'Dispatch immediate secondary security line, prepare barricades if queue spills onto exit stairs.',
      priorityLevel: priority || 'medium',
      securityAlertBroadcast: 'ATTENTION ALL CONCOURSE STEWARDS: Monitor Sector gate corridors for queue overflow. Keep pathways fully unobstructed.'
    });
  }

  try {
    const prompt = `An incident was reported:
    Title: "${title}"
    Priority: "${priority}"
    Location: "${location}"
    Description: "${description}"
    
    Synthesize this information, assess safety ratings, draft tactical recommended actions for on-site security, and generate a concise broadcast message.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a Senior Security Director. Keep guidance strict, safe, actionable, and rapid. Return strictly in JSON format.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            incidentSummary: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            priorityLevel: { type: Type.STRING },
            securityAlertBroadcast: { type: Type.STRING }
          },
          required: ['incidentSummary', 'recommendedAction', 'priorityLevel', 'securityAlertBroadcast']
        }
      }
    });

    const parsedData = safeJSONParse(response.text, {
      incidentSummary: 'Security assessment filed. Tactical teams monitoring coordinates.',
      recommendedAction: 'Place appropriate physical cones or coordinate with local stewards.',
      priorityLevel: priority || 'medium',
      securityAlertBroadcast: 'MONITOR EXIT AND ENTRY PATHWAYS AT CORRIDOR CHANNELS.'
    });

    res.json({ ...parsedData, isSimulated: false });
  } catch (error: any) {
    console.error('Incident Report API Error:', error);
    res.status(500).json({ error: 'Failed to analyze incident report', details: error.message });
  }
});

// API Route: Sustainability Recommendations
app.post('/api/gemini/sustainability', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { solarPowerKW, batteryLevel, cleanEnergyPercent, activeFans } = sanitizedBody;

  const validation = validateParams({ solarPowerKW, batteryLevel, cleanEnergyPercent, activeFans });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid environmental parameters', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    return res.json({
      isSimulated: true,
      solarSavingsPercentage: 24,
      powerTuningAction: 'Dim corridor floodlights and concession stands display panels by 20% since solar generation is high.',
      wasteOptimizations: [
        'Place 5 digital bin sensors in Sector C food court to optimize trash pickup frequency.',
        'Promote reusable cup collection point: Fan gets a 10% discount at Merch store per 3 cups returned.'
      ],
      publicEcoAnnouncement: 'Titans Stadium is currently operating on 72% green solar power today! Help us keep our home clean: dispose of bottles in the blue bio-bins. Together, we play for a greener tomorrow!'
    });
  }

  try {
    const prompt = `Based on current stadium environmental status:
    Active Solar Generation: ${solarPowerKW || 450} kW
    Battery Backup Level: ${batteryLevel || 85}%
    Clean Energy Percent: ${cleanEnergyPercent || 72}%
    Active Fans in Stadium: ${activeFans || 52000}
    
    Recommend smart sustainability optimizations for waste, power, solar usage, and an inspiring public fan announcement.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an Eco-Stadium Operations consultant. Suggest clever, practical, and futuristic green energy integrations in JSON form.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solarSavingsPercentage: { type: Type.NUMBER },
            powerTuningAction: { type: Type.STRING },
            wasteOptimizations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            publicEcoAnnouncement: { type: Type.STRING }
          },
          required: ['solarSavingsPercentage', 'powerTuningAction', 'wasteOptimizations', 'publicEcoAnnouncement']
        }
      }
    });

    const parsedData = safeJSONParse(response.text, {
      solarSavingsPercentage: 20,
      powerTuningAction: 'Reduce auxiliary concourse display outputs in empty standings.',
      wasteOptimizations: ['Enforce reusable containers and trash recycling stations.'],
      publicEcoAnnouncement: 'We play for a green tomorrow! Dispose of plastics in the recycling units.'
    });

    res.json({ ...parsedData, isSimulated: false });
  } catch (error: any) {
    console.error('Sustainability API Error:', error);
    res.status(500).json({ error: 'Failed to run sustainability assessment', details: error.message });
  }
});

// API Route: General Smart Stadium Conversational Assistant
app.post('/api/gemini/chat', async (req, res) => {
  const sanitizedBody = deepSanitize(req.body);
  const { userMessage, history, role } = sanitizedBody;

  const validation = validateParams({ userMessage, role });
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid chat properties', details: validation.error });
  }

  const ai = getGeminiAI();
  if (!ai) {
    return res.json({
      isSimulated: true,
      text: `[Simulation Mode] Thanks for asking! As a helpful Smart Stadium Assistant (Role: ${role || 'Visitor'}), here is your custom advice: To ensure a premium tournament experience, we recommend using Gate 3 (South Gate) which currently has the lowest queue wait time (under 11 minutes). If you are looking for restrooms or food, click on any pin on our Live Blueprint map to get real-time status and AI-optimized directions.`
    });
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: `You are the primary Google Gemini Smart Stadium Assistant. The user's active role in the stadium is: ${role || 'fan'}. 
        Answer stadium inquiries, match schedules, general rules, and safety alerts with a professional, friendly, and practical stadium staff voice. 
        Keep answers helpful, clear, and under 3 scannable paragraphs. Highlight if insights are powered by Google Gemini.`
      }
    });

    const response = await chat.sendMessage({ message: userMessage });
    res.json({ text: response.text, isSimulated: false });
  } catch (error: any) {
    console.error('General Chat API Error:', error);
    res.status(500).json({ error: 'Failed to generate chat response', details: error.message });
  }
});

// Setup Vite Dev Middleware or Serve Production Build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Stadium Backend running on http://localhost:${PORT}`);
  });
}

startServer();
