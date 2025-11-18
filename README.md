Conversational Symptom Logger

A personal health tracking application that uses conversational AI to capture structured symptom metadata through natural dialogue, eliminating the friction of traditional form-based logging.

Problem Statement
"How often have you been having this pain?"
This common diagnostic question highlights a fundamental challenge in personal health tracking: existing symptom logging apps require users to navigate complex forms and select from dropdown menus while experiencing discomfort. This friction reduces adherence and data quality.
The tension: Structured metadata is essential for medical diagnosis, but imposing structure during capture reduces user participation.

Solution
A conversational interface that embeds metadata elicitation within natural dialogue. Users describe symptoms in their own words, and the system extracts structured information through multi-turn conversation—making logging feel like talking to a friend rather than filling out a medical form.

Key Features

Core Functionality
Natural Language Input: Describe symptoms conversationally
Dynamic Follow-ups: AI asks clarifying questions based on context
Structured Data Capture: Extracts location, severity (0-10), duration, and additional context
Multi-turn Conversations: Handles incomplete information gracefully

User Experience
Autosave: Every message saved to prevent data loss
Resume Drafts: Pick up incomplete entries after closing browser
Multiple Symptoms: Automatically separates multi-location symptoms into individual entries
Smart Triggers: Asks deeper questions (OPQRST framework) for severe or chronic symptoms

Data Management
Local Storage: All data stays on your device
View History: Chronological table of logged symptoms
Delete Entries: Remove entries with confirmation
Detailed View: Full context for each logged symptom

How It Works
Describe Your Symptom: "Bad headache behind my eyes since this morning"
AI Extracts Metadata: Location (head), Duration (hours)
Follow-up Questions: "On a scale of 0-10, how severe is the pain?"
Smart Triggers: High severity (≥7) or long duration (≥days) triggers additional questions about what makes it better/worse, pain quality, radiation
Confirmation: AI summarizes captured data for review
Save: Structured entry stored locally

Controlled Vocabularies
Location: head, chest, abdomen, back, limbs, other
Duration: just_started, hours, days, weeks, ongoing
Severity: 0-10 numeric scale
Secondary Questions (OPQRST Framework):

Provocation/Palliation: What makes it better or worse?
Quality: Sharp, dull, throbbing?
Radiation: Does it spread anywhere?

Technical Approach
Information Organization Concepts

Metadata Schema Design: Balances medical relevance with user comprehension
Controlled Vocabulary Adaptation: Simplified medical taxonomies (ICD-10/SNOMED) for patient-facing use
Interactive Validation: Multi-turn dialogue for quality control
Flexible Data Structure: Accommodates varying levels of detail

Robustness Features
Retry Loop: Automatically recovers from malformed AI responses (max 3 attempts)
Schema Validation: Ensures all data matches controlled vocabularies
Error Handling: Graceful fallbacks for API failures
Emergency Detection: Prompts immediate medical care for urgent symptoms

Technologies
Frontend: React 18, TypeScript, Tailwind CSS
UI Components: shadcn/ui
AI: Claude API (Sonnet 4.5)
Storage: localStorage (Web Storage API)
Deployment: Vercel