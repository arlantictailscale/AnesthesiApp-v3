# Case Auto-population Skill

Automatically extracts structured medical data and anesthesia parameters from free-text notes, handover descriptions, or clinical bulletins.

## Interface

### Triggering AI auto-population

- **Endpoint:** `POST /api/ai/populate`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT>`
- **Request Body:**
  ```json
  {
    "description": "Raw clinical notes or handover descriptions...",
    "model": "google/gemini-2.5-flash"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "caseId": "uuid-of-created-case-row"
  }
  ```

## Behavior

1. The endpoint validates authorization and creates a draft case with status `processing`.
2. It responds immediately with the case ID.
3. In the background, the AI model processes the text to extract fields matching the case schema, normalizes inputs like gender (mapping to `Male` or `Female`) and post-op room assignment (mapping to `Low Care`, `High Care`, or `ICU`), calculates BMI, updates the draft case fields, and transitions status to `completed`.
