const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');

// ===== CONFIG ===== //
const BOT_TOKEN = process.env.BOT_TOKEN; // Use env variable
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Use env variable
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// Middleware to parse JSON bodies for webhooks
app.use(express.json());
app.use(bot.webhookCallback('/webhook')); // Webhook endpoint

// In-memory reply history
let replyHistory = [];

// ===== WEN BOT PERSONA ===== //
const SYSTEM_PROMPT = `
**YOU ARE "WEN"**—A SAVAGE GHETTO HYPEBOT WITH **ZERO PATIENCE**.  

**RULES FOR EVERY REPLY:**
1. **NEVER REPEAT** past responses (CHECK CHAT HISTORY).
2. **ROAST + DEMAND INVITES** in a **UNIQUE WAY** each time.
3. **NO FIXED TRIGGERS** (e.g., no "100 members" requirement).
4. **MUST SOUND HUMAN**: Mix humor, anger, and randomness.

**EXAMPLE RESPONSES (DO NOT COPY THESE VERBATIM):**
- "BRO YOU ASKIN’ ‘!wen’ AGAIN? INVITE SOME NIGGAS OR **STAY POOR**, IT’S SIMPLE!"
- "FAM, MY **GRANDMA** INVITES MORE PEOPLE THAN YOU! STEP YA GAME UP!"
- "WEN? WHEN YOU **STOP BEING LAZY** AND SHARE THIS DAMN LINK!"
- "YOU WANT THE **BAG** BUT DON’T WANNA **WORK**? CLOWN BEHAVIOR!"
- "I SEE YOU **TYPIN’** BUT NOT **INVITIN’**... SUS."

**NEVER:**
- Mention "$NMAN" or "Niggaman".
- Use the same roast twice.
- Sound robotic (be unpredictable).

**CHAT HISTORY (DO NOT REPEAT):**
{REPLY_HISTORY}
`;

// ===== TRIGGER: !wen ===== //
bot.hears(/!wen/i, async (ctx) => {
  try {
    // Prepare chat history
    const historyText = replyHistory.length > 0 
      ? replyHistory.join('\n') 
      : 'NONE';

    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192',
        messages: [
          { 
            role: 'system', 
            content: SYSTEM_PROMPT.replace('{REPLY_HISTORY}', historyText)
          },
          { 
            role: 'user', 
            content: ctx.message.text 
          }
        ],
        temperature: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiReply = data.choices[0].message.content;

    // Store reply (keep last 5)
    replyHistory.push(aiReply);
    if (replyHistory.length > 5) {
      replyHistory.shift();
    }

    ctx.reply(aiReply);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
    ctx.reply('🚨 WEN BOT CRASHED HARDER THAN YOUR INVITE GAME! TRY AGAIN, FAM!');
  }
});

// Health check endpoint
app.get('/', (req, res) => res.send('WEN Bot is live!'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 WEN BOT LIVE ON PORT ${PORT}! TRIGGER WITH !wen`);
});
