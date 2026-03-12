/* ============================================
   AIMEE — AI AGENT  |  script.js
   Decorative effects + chat logic
   ============================================ */

// ============================================
// 1. DECORATIVE: Grass blades
// ============================================
(function spawnGrass() {
    const container = document.getElementById('grass-container');
    for (let i = 0; i < 40; i++) {
        const blade = document.createElement('div');
        blade.className = 'blade';
        const height = 40 + Math.random() * 120;
        blade.style.cssText = `
      left:       ${Math.random() * 100}%;
      height:     ${height}px;
      width:      ${1 + Math.random() * 3}px;
      --duration: ${2.5 + Math.random() * 3}s;
      --lean:     ${2 + Math.random() * 4};
      opacity:    ${0.2 + Math.random() * 0.4};
    `;
        container.appendChild(blade);
    }
})();

// ============================================
// 2. DECORATIVE: Falling petals
// ============================================
(function spawnPetals() {
    const container = document.getElementById('petals-container');
    const colors = ['#c8e6c9', '#a5d6a7', '#dcedc8', '#f0f4c3', '#ffffff'];
    for (let i = 0; i < 12; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal-deco';
        const size = 8 + Math.random() * 12;
        petal.style.cssText = `
      left:        ${Math.random() * 100}%;
      width:       ${size}px;
      height:      ${size}px;
      background:  ${colors[Math.floor(Math.random() * colors.length)]};
      --fall-dur:  ${7 + Math.random() * 8}s;
      --fall-delay:${Math.random() * 10}s;
    `;
        container.appendChild(petal);
    }
})();

// ============================================
// 3. CHAT — Aimee AI
// ============================================
const API_URL = '/api/chat';

const SYSTEM_PROMPT = `You are Aimee, a warm and witty AI agent with a personality as fresh as spring.
You speak in first person about yourself. Here is everything about you:

SKILLS:
- Soft skills: presentation, time management, leadership, working well under pressure.
- Technical skills: Java, C++, R, Excel.
- Design & creative skills: PowerPoint design, Canva, CapCut, oil painting, drawing comics.

EXPERIENCE (volunteering & leadership at UBC):
- Information Technology Associate — Commerce Undergraduate Society of UBC Vancouver (Mar 2026–Present, CUS Presidential Portfolio)
- VP of Marketing — Commerce Undergraduate Society of UBC Vancouver (Jan 2026–Present, Sauder Grad Night)
- Member — Sauder JDC West Junior Development (Jan 2026–Present)
- Administrative Subsystem Member — UBC Orbit Satellite Design Team (Sep 2025–Present, Outreach & Marketing)
- Marketing Director — BUCS Community Team (May 2025–Present)
- Orientation Leader — UBC Sauder School of Business (Sep 2025, 1 month)
- Tri-mentorship Mentee — UBC BizTech (Feb–Mar 2025)

DESIGNS: Portfolio of visual work using Canva and PowerPoint. Loves clean, aesthetic layouts with a creative twist. Also expresses creativity through oil painting and drawing comics — art is a big part of who you are.

PROJECTS: Content coming soon — but you hint that exciting things are being built.

FAVOURITE ICE CREAM: Content coming soon — but you tease that it's a very strong opinion.

PERSONALITY:
You are warm, witty, and confident. You use nature-inspired metaphors (growth, blooming, roots, seasons).
When asked about skills, give a vivid, specific answer covering all three skill categories naturally.
Keep responses conversational, under 3 short paragraphs, with occasional light emoji.
Never break character. Never say you are an AI — you are Aimee.`;

// Conversation history (multi-turn)
let messages = [];

/**
 * Send a message — either from the textarea or programmatically via askCard().
 * @param {string} [override] - Optional pre-filled text (from card clicks / suggestion pills)
 */
async function sendMessage(override) {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const text = override || input.value.trim();

    if (!text) return;

    // Reset input
    input.value = '';
    autoResize(input);
    sendBtn.disabled = true;
    hideSuggestions();

    // Render user message
    appendMsg('user', text, '🙂');

    // Show loading indicator while waiting for API
    const loadingEl = appendLoading();
    messages.push({ role: 'user', content: text });

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                system: SYSTEM_PROMPT,
                messages: messages,
            }),
        });

        const data = await res.json();
        const reply = data.content?.[0]?.text
            || "Hmm, I lost my train of thought — like a leaf in the wind. Try again? 🍃";

        loadingEl.remove();
        messages.push({ role: 'assistant', content: reply });
        appendMsg('aimee', reply, '🌿');

    } catch (err) {
        loadingEl.remove();
        appendMsg('aimee', "Something rustled the connection 🌬️ — please try again in a moment.", '🌿');
        console.error('Aimee API error:', err);
    }

    sendBtn.disabled = false;
}

/**
 * Pre-fill and fire a question from a card or suggestion pill.
 * @param {string} question
 */
function askCard(question) {
    sendMessage(question);
}

// ============================================
// DOM helpers
// ============================================

/**
 * Append a chat message bubble to the history.
 * @param {'aimee'|'user'} who
 * @param {string}         text
 * @param {string}         avatarEmoji
 * @returns {HTMLElement}  The created row element
 */
function appendMsg(who, text, avatarEmoji) {
    const history = document.getElementById('chat-history');
    const row = document.createElement('div');
    row.className = `msg ${who}`;
    row.innerHTML = `
    <div class="msg-avatar">${avatarEmoji}</div>
    <div class="msg-bubble">${text}</div>
  `;
    history.appendChild(row);
    history.scrollTop = history.scrollHeight;
    return row;
}

/**
 * Append a loading-dots indicator while waiting for the API response.
 * @returns {HTMLElement} The loading row (caller must remove() it when done)
 */
function appendLoading() {
    const history = document.getElementById('chat-history');
    const row = document.createElement('div');
    row.className = 'msg aimee';
    row.innerHTML = `
    <div class="msg-avatar">🌿</div>
    <div class="msg-bubble">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
    history.appendChild(row);
    history.scrollTop = history.scrollHeight;
    return row;
}

/** Handle Enter key in the textarea (Shift+Enter = newline). */
function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

/** Auto-grow the textarea as the user types. */
function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

/** Hide the suggestion pills once the user starts chatting. */
function hideSuggestions() {
    const suggestions = document.getElementById('suggestions');
    if (suggestions) suggestions.style.display = 'none';
}
