import { getGeminiKey } from './secureKey';

/**
 * Parse user's natural language reminder request using Gemini AI
 * @param {string} userText - User's reminder request
 * @param {string} timezone - User's timezone (e.g., 'America/New_York')
 * @returns {Object} Parsed reminder object with title, datetime_iso, notes, etc.
 */
export async function parseReminderWithGemini(userText, timezone = 'UTC') {
  const key = await getGeminiKey();
  if (!key) throw new Error('Gemini API key not set');

  const now = new Date();
  const localNow = now.toLocaleString('en-US', { timeZone: timezone });
  const currentDay = now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'long' });
  
  const prompt = `You are a precise JSON parser for reminder requests.

CURRENT CONTEXT:
- Timezone: ${timezone}
- Current UTC time: ${now.toISOString()}
- Current local time: ${localNow}
- Current day: ${currentDay}

CRITICAL RULES FOR "TOMORROW":
1. "tomorrow" ALWAYS means the NEXT calendar day (current date + 1 day)
2. "tomorrow 12:02 AM" = next day at 00:02:00 (just after midnight of TOMORROW)
3. "tomorrow 12 AM" = next day at 00:00:00 (midnight of TOMORROW)
4. "tomorrow morning" = next day between 6 AM - 12 PM
5. NEVER interpret "tomorrow AM" as today's early morning

EXAMPLES (if current time is Nov 11, 2025 11:30 PM):
- "tomorrow 12:02 AM" → Nov 12, 2025 00:02:00 ✅
- "tomorrow at midnight" → Nov 12, 2025 00:00:00 ✅
- "tomorrow 1 AM" → Nov 12, 2025 01:00:00 ✅
- "tomorrow morning 9 AM" → Nov 12, 2025 09:00:00 ✅

OTHER RULES:
- "tonight" means today's date if still evening, otherwise tomorrow
- Always ensure datetime is AFTER current time
- If ambiguous, choose the next future occurrence

Parse the following reminder request and return ONLY valid JSON:

SUCCESS FORMAT:
{
  "title": "Brief title for the reminder",
  "notes": "Additional details if any",
  "datetime_iso": "ISO 8601 datetime string (MUST BE IN THE FUTURE)",
  "timezone": "${timezone}",
  "success": true
}

ERROR FORMAT:
{
  "success": false,
  "error": "Reason why parsing failed"
}

USER INPUT: "${userText}"

Return ONLY the JSON object, nothing else.`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ 
            role: 'user', 
            parts: [{ text: prompt }] 
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Gemini API error: ${resp.status} - ${errorText}`);
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      console.error('Gemini response:', JSON.stringify(data, null, 2));
      throw new Error(`No response from Gemini. Finish reason: ${finishReason || 'unknown'}`);
    }

    // Clean up markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error('Gemini parsing error:', error);
    throw error;
  }
}

/**
 * Test Gemini API key
 */
export async function testGeminiKey(key) {
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: 'user', 
            parts: [{ text: 'Say "OK" if you can read this.' }] 
          }]
        })
      }
    );
    return resp.ok;
  } catch {
    return false;
  }
}

