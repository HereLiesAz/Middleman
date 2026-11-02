# Middleman — AI Couple Conflict Mediator

> *"Shielding couples from emotional injury through private contrastruction and clean conflict mediation."*

---

## 1. Strict Privacy Isolation & Shielding

In couple conflicts, the unfiltered, reactive things partners say in the heat of an argument—accusations, catastrophizing, defensive lashing out—can cause **permanent emotional injury**. Once spoken directly to a partner, raw attacks become wounds that erode psychological safety and trust for years.

Middleman exists to eliminate that risk by enforcing a strict privacy boundary:
* **Network & Payload Sanitization:** Every API endpoint rigorously filters data by the viewing partner's identity (`sanitizeSessionForUser`). Partner A's private messages, raw drafts, and vents are **never** transmitted across the wire to Partner B's browser, and vice versa.
* **Separation of Spaces:** Both partners converse *only* with the AI Middleman in their respective confidential rooms until mutual de-escalation is achieved.
* **Shielded Venting:** Partners can express their unfiltered frustration, rage, or hurt without the terror of permanently wounding their partner. The AI absorbs the emotional charge, validates the core pain, and gently extracts the underlying human need.

---

## 2. The *Contrastruction* Dialogue Technique

Rather than functioning as a standard chatbot or a generic mediator, Middleman uses **contrastruction**—a rhetorical negotiation and dialogue method designed to reveal the unreasoned core human values underlying conflicting positions without forcing false compromise.

When a partner shares a perspective, Middleman responds using a 6-phase dialogue protocol:
1. **Validation & Deep Summarization First:** Before offering any commentary, analysis, or advice, Middleman summarizes the speaker's emotional state with complete empathy so they feel 100% heard and validated.
2. **Non-Accusatory Misinterpretation Spotlight:** Identifies how stress, fatigue, or cognitive shortcuts may have caused one or both partners to misinterpret external behavior as malice or indifference (e.g., misreading financial panic as milestone disregard), without putting anyone on the defensive.
3. **Area of Contrast:** Clearly highlights the differing subjective filters each partner is looking through (e.g., *"Alex measures love through undivided milestone presence, whereas Jordan measures love through work and financial protection"*).
4. **Constructed Common Ground:** Identifies the shared, undeniable human value uniting both partners (e.g., *"Both of you are fiercely fighting for the survival and security of your home"*).
5. **Compassionate Clarifying Question:** Asks a curious, gentle question to help the partner reflect on unspoken fears or unexplored context.
6. **Perspective Bridging for the Partner:** Recontextualizes the speaker's core need into agreeable, non-accusatory language, allowing Middleman to speak *for* that partner into the other partner's room when appropriate.

---

## 3. User Profiles & Longitudinal Interaction History

Middleman treats each partner as a whole person with an evolving emotional trajectory, rather than an anonymous chat session:
* **Unique User IDs & Profiles:** Every user is assigned a distinct identifier (e.g., `usr_alex_882`, `usr_jordan_914`) storing their role description, relationship length, core communication habits, emotional triggers, and unstated needs.
* **Interaction History Logs:** Every exchange is recorded in `interactionHistory`, capturing the speaker's original words, Middleman's validation summary, the identified underlying need, and the agreeable perspective derived.
* **Longitudinal Perspective Growth:** As private sessions progress, Middleman updates each partner's `perspectiveSummary` and tracks readiness trends over time, tailoring future responses to past breakthroughs.

---

## 4. Hypothetical Couples' Disagreement Examples

The application includes rich, interactive walkthroughs illustrating how Middleman transforms destructive conflicts into constructive alignment:

1. **The Forgotten Anniversary & Overwork:**
   * *Partner A (Alex):* Heartbroken and deprioritized after Jordan worked late on their 5th anniversary.
   * *Partner B (Jordan):* Terrified by unexpected company layoffs; worked late to protect their family mortgage.
   * *Middleman's Common Ground:* Both are fighting for the partnership—Alex is fighting for emotional intimacy, Jordan for financial survival.
2. **Chores & The Invisible Mental Load:**
   * *Partner A (Morgan):* Exhausted from managing the household alone; feels like a domestic maid.
   * *Partner B (Sam):* Feels that every chore attempt is criticized or redone; retreats to avoid failure.
   * *Middleman's Common Ground:* Neither wants a parent-child dynamic. Both desire a home that feels like an equal, peaceful sanctuary.
3. **Holiday In-Laws & Emotional Burnout:**
   * *Partner A (Riley):* Recovering from work burnout and desperately needs 3 quiet restorative days at home.
   * *Partner B (Taylor):* Coping with anticipatory grief over an aging father whose health is failing.
   * *Middleman's Common Ground:* Both prioritize family health—Riley is protecting the immediate partnership, Taylor is honoring remaining moments with aging parents.

---

## 5. Transition to the Facilitated Joint Room

Direct conversation is disabled during high-friction phases to protect both parties. Direct access is unlocked only through a principled readiness evaluation:
* **Composite Readiness Score ($\ge 70\%$ threshold):**
  * *Emotional De-escalation (35%):* Sufficient conversational depth and absence of inflammatory triggers.
  * *Mutual Empathy (40%):* Explicit identification of at least one core need for each partner.
  * *Shared Goals Identified (25%):* Established common ground between both viewpoints.
* **Gated Access & Live Facilitation:** While locked, partners see a live readiness meter explaining what remains before direct contact is safe. Once unlocked, the Joint Room opens for direct dialogue, with Middleman remaining present in the room to buffer reactive responses, rephrase misunderstandings, and keep the conversation constructive.

---

## 6. Ze Frank's "How to Fight as a Couple" Integration

Middleman incorporates the conflict philosophy articulated by **Ze Frank** in his seminal video *How to Fight as a Couple* (`https://www.youtube.com/watch?v=IE-P11KKYFs`). Ze Frank emphasizes that couples *will* fight—arguments are a natural part of any intimate relationship—but the **rules of engagement** dictate whether a fight deepens intimacy or destroys it.

Middleman integrates Ze Frank's core tenets across its architecture:

### A. Decoupling the "Content Argument" from the "Feelings Argument"
Ze Frank points out that every couple fight consists of two distinct layers happening simultaneously:
1. **The Content Argument:** The logistical facts, specific events, dishes in the sink, arrival times, or budget line-items.
2. **The Feelings Argument:** The vulnerable emotional reality underneath—feeling invisible, abandoned, disrespected, or inadequate.

> *Middleman Principle:* When emotional temperature is high, debating the Content Argument is futile. Middleman immediately detangles the two layers, parking the logistical debate and addressing the Feelings Argument first.

### B. Clean Fighting Ground Rules
Ze Frank defines ground rules that must be honored to keep conflict clean:
* **No Character Indictments or Overarching Generalizations:** Words like **"always"** and **"never"** (*"You never help," "You always ruin things"*) turn a specific incident into a total attack on identity. Middleman actively flags and reframes absolute generalizations.
* **No Weaponized Swearing:** Exclamations of frustration are natural, but using profanity *as a weapon against your partner's character* leaves indelible emotional scars. Middleman neutralizes aggressive insults before they reach the other person.
* **No Relationship Threats as Leverage:** Threatening breakups, divorce, or walking out (*"Maybe we shouldn't be together"*) corrodes the foundational psychological safety of the relationship. Middleman flags relationship ultimatums as high-risk friction.
* **No Dragging in Past Battles:** Fighting historical battles or comparing current partners to exes turns the argument into a proxy war. Middleman anchors conversations strictly in the present experience.

### C. Active Listening & Mirroring Without Defensive Projection
A key insight from Ze Frank is that partners rarely listen to what is actually said; instead, they filter their partner's words through their own internal defense mechanisms (e.g., hearing *"It hurts me when you don't call"* and translating it into *"You're saying I'm a terrible partner"*).
* Middleman acts as an uncorrupted mirror, repeating back the speaker's true feeling without the defensive distortion, proving to the speaker that they have been accurately heard.

### D. The "Intent Sandwich"
When sharing difficult or vulnerable thoughts with a partner, Ze Frank recommends using an **Intent Sandwich**:
1. **Top Slice (Anchor of Love & Care):** Declare your overarching commitment and care (*"I love you, and our relationship means everything to me..."*).
2. **The Filling (Vulnerable Truth):** Share the specific difficulty or unmet need (*"...which is why I'm sharing how scared and lonely I felt when..."*).
3. **Bottom Slice (Reassurance of Future):** Reaffirm that the goal is closeness and collaboration (*"...because I want us to feel like a strong, joyful team again."*).

Middleman automatically structures its bridged messages using this exact format when sharing one partner's perspective with the other.

### E. The Structured Timeout (Regulation Before Resolution)
When either partner experiences emotional flooding, higher-order cognitive empathy goes offline and physiological fight-or-flight takes over.
* Ze Frank advises taking a clean, agreed-upon timeout (anywhere from 15 seconds to 15 minutes) with zero judgment.
* Middleman provides an integrated **"Take a Timeout"** feature in the interface: a 60-second guided breathing reset (box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s) with grounding reminders to help partners regulate their nervous system before returning to the conversation.

---

## Technology Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
* **Backend:** Express, Node.js (`tsx server.ts`), Vite middleware in development
* **AI Engine:** Google Gemini API (`@google/genai`, model `gemini-3.8-flash`) with server-side heuristic fallback
* **Verification & Testing:** Node test runner (`node:test`, `tsx --test src/utils/mediationRules.test.ts`) with 100% test pass rate
