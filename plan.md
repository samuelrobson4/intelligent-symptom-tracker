Conversational Symptom Logger — Build Plan (Markdown)

Phase 0 — Core Conversational Extraction (Days 1–3)

This phase builds the minimum engine needed to reliably extract a single structured symptom with OPQRST secondary questions.

⸻

Day 1 — Setup & Basic Extraction

Goals
	•	Project scaffolding
	•	Core schema
	•	Prompt-based extraction working end-to-end

Tasks
	•	Initialize React + TS project (Vite)
	•	Add deps
	•	Create types.ts:
	•	SymptomMetadata
	•	Enums: Location, Duration, Severity
	•	Create promptTemplates.ts:
	•	Base extraction prompt
	•	Controlled vocabularies
	•	Include OPQRST instructions (but triggered by model logic)
	•	Include emergency detection
	•	Create claudeService.ts with extractMetadata()
	•	Create minimal TestHarness.tsx with:
	•	Input box
	•	JSON output panel
	•	Test simple inputs:
	•	“bad headache”
	•	“stomach ache”
	•	“chest pain for days”

Decision Gate
	•	≥80% extraction accuracy on basic fields (location, duration, severity).

⸻

Day 2 — Retry Logic (Malformed / Invalid Responses)

Goals
	•	Ensure the model always returns clean, validated JSON
	•	Automatic recovery from common errors

Tasks
	•	Create validators.ts:
	•	parseAndValidate()
	•	Validate:
	•	location ∈ enum
	•	severity ∈ 0–10
	•	duration ∈ enum
	•	Return { success, data } | { error, message }
	•	Implement processMessageWithRetry():
	•	Up to 3 retries
	•	Provide error-specific feedback back to the model
	•	Final failure → ask user to rephrase
	•	Test:
	•	Invalid enum → corrected
	•	Malformed JSON → corrected
	•	Wrong severity format → corrected
	•	3× failure → fallback

Decision Gate
	•	Retry mechanism corrects ≥90% of response format problems.

⸻

Day 3 — Secondary Questions (OPQRST) Incorporated

Goal
Extract richer clinical-quality data using conditional OPQRST follow-up questions.

Triggers
Use shouldTriggerSecondary(metadata) when:
	•	Severity ≥ 7
	•	Duration ≥ “days”
	•	Pain in critical locations (chest, abdomen, head)
	•	Model expresses uncertainty in quality or onset

OPQRST Question Set
	•	O – Onset: “When did this start?”
	•	P – Provocation/Palliation: “What makes it better or worse?”
	•	Q – Quality: “How would you describe it? (sharp, dull, throbbing)”
	•	R – Radiation: “Does the pain spread anywhere?”
	•	S – Severity: (already captured as 0–10)
	•	T – Timing: “Is it constant or does it come and go?”

Tasks
	•	Add secondaryResponses to SymptomEntry
	•	Update extraction prompt in promptTemplates.ts to include OPQRST block
	•	Add follow-up question sequences to claudeService.ts
	•	After capturing primary metadata:
	•	Ask each OPQRST question sequentially
	•	Validate and store each response
	•	Test cases:
	•	High severity → OPQRST triggered
	•	Long duration → OPQRST triggered
	•	Mild short symptom → no OPQRST
	•	All secondary responses saved correctly

Decision Gate
	•	Secondary questions integrate smoothly and feel natural during conversation.

⸻

⸻

Phase 1 — Chat UI (Days 4–6)

⸻

Day 4 — shadcn Setup & Core Components
	•	Install shadcn/ui
	•	Add: Card, ScrollArea, Input, Button, Avatar, Badge, Alert, Dialog
	•	Implement:
	•	Message.tsx
	•	ChatInput.tsx
	•	Build static mock chat UI

⸻

Day 5 — Chat Integration
	•	Create ChatInterface.tsx
	•	Wire to processMessageWithRetry()
	•	State: messages, currentSymptom, secondary questions state
	•	Loading skeleton for model response
	•	Basic validation + save to memory (no autosave yet)

⸻

Day 6 — Conversation Flow Polish
	•	Progress indicators:
	•	✓ Location, ✓ Severity, ? Duration, ? OPQRST
	•	Error handling:
	•	API retry button
	•	Offline detection
	•	Success alert after symptom saved
	•	Reset conversation after successful save

⸻

⸻

Phase 2 — Storage & History (Days 7–8)

Autosave + persistence come after core logic and UI work.

⸻

Day 7 — Storage + Autosave

Storage
	•	Create localStorage.ts:
	•	saveSymptom()
	•	getSymptoms()
	•	deleteSymptom()

Autosave
	•	Save draft:
	•	conversation messages
	•	currentSymptom
	•	OPQRST progress
	•	timestamp
	•	Resume:
	•	Offer resume if draft <24h
	•	“Start Fresh” option
	•	Clear draft after symptom fully saved

Tests
	•	Mid-convo → refresh → resume works
	•	Completed → draft clears
	•	Expired draft (>24h) ignored

⸻

Day 8 — Multi-Symptom Handling

Goal
Handle sentences describing more than one symptom.

Rules
	•	“Head and stomach hurt” → 2 symptom entries
	•	“Chest pain radiating to arm” → 1 (radiating)
	•	“Pain all over” → ask for primary location

Tasks
	•	Add multi-symptom detection instructions in prompts
	•	Add queuedSymptoms: string[] state
	•	Flow:
	1.	Extract primary
	2.	If multiple found → push extras to queue
	3.	After saving first → prompt user to confirm next
	4.	Continue until queue empty
	•	Tests:
	•	Dual-location → 2 clean entries
	•	Radiation handled correctly
	•	Queue drained correctly

⸻

⸻

Phase 3 — Symptom Display (Days 9–10)

Day 9 — Symptom Table
	•	SymptomTable.tsx with shadcn Table
	•	Columns:
	•	Date, Symptom, Location, Severity, Duration, Actions
	•	Severity colors:
	•	Red ≥7
	•	Yellow 4–6
	•	Green ≤3
	•	Delete button with confirmation dialog
	•	Empty state

⸻

Day 10 — Details View & Layout
	•	Create SymptomDetailsDialog.tsx
	•	Show:
	•	Primary fields
	•	OPQRST secondary responses
	•	Add two-column layout (chat left, table right)
	•	Mobile stacked layout
	•	Add animations for row add/delete

⸻

⸻

Phase 4 — Final Polish (Day 11)

Tasks
	•	Confirmation step before save:
	•	Claude summarizes
	•	User can correct
	•	Accessibility:
	•	Keyboard navigation
	•	ARIA labels
	•	Dialog focus-trap
	•	Error boundaries
	•	Loading states everywhere
	•	15 end-to-end tests (including OPQRST + multi-symptom)

⸻

⸻

Phase 5 — Deployment & Documentation (Day 12)

Tasks
	•	Production build
	•	Deploy to Vercel
	•	README.md:
	•	Overview
	•	Setup instructions
	•	Controlled vocabularies
	•	OPQRST documentation
	•	Secondary trigger rules
	•	Multi-symptom explanation
	•	Autosave mechanism
	•	Medical disclaimers:
	•	“Not medical advice”
	•	“Call 911 for emergencies”
	•	Add screenshots or demo video
	•	Document known limitations