# Event Add/Edit Page Recipe

## Context

- **Visual reference**: `studioreact/src/app/admin/courses/[id]/page.tsx`  
  Two-step Tailwind wizard with toast messaging and AI controls.
- **Business logic**: Angular `ProgramAddEditComponent` (`program-add-edit.component.ts/.html`)  
  Handles event CRUD, schedules, meeting modes, AI assistance, and template saves.
- **Supporting docs**: `course-detail-recipe.md`, `course-list-recipe.md`, `event-list-recipe.md`.

---

## Objective

Create a React + Tailwind **Event Add/Edit** wizard that:

1. Loads or seeds event data (including schedules, locations, teachers, meeting providers).
2. Mirrors Angular validation, payloads, and AI/template behaviour.
3. Persists events via `/snode/erule` (add/update) and templates via `/stemplate/page`.
4. Reuses toast-driven UX from the course page; avoid blocking modals.
5. Leaves GrapesJS integrations stub-friendly but wired for future activation.

---

## Routing

| Route | Purpose | Notes |
| --- | --- | --- |
| `/admin/events/add` | New event | No `id`; initialise defaults. |
| `/admin/events/edit/:id` | Edit existing event | Load full detail & template. |
| Post-create redirect | `/admin/events/edit/{guId}` | Use `navigate(..., { replace: true })` after first save. |
| Cancel/back | `/admin/events` | Return to event list; confirm if template dirty. |

---

## High-Level Architecture

```
src/
  app/admin/events/[id]/page.tsx        // EventAddEditPage
  app/admin/events/components/
    EventDetailsForm.tsx                // Step 1 UI
    EventTemplatePanel.tsx              // Step 2 UI
    ScheduleList.tsx                    // FormArray helper
    MeetingModeToggle.tsx
    LocationSelector.tsx
    TagsInput.tsx
  hooks/
    useEventDetail.ts                   // Data/AI/template orchestration
  services/
    eventDetailService.ts               // CRUD, teachers, locations
    eventTemplateService.ts             // Template persistence
    meetingProviderService.ts           // OAuth providers
  utils/
    scheduleUtils.ts                    // UTC conversions
    aiPrompts/eventPrompts.ts           // Prompt builders
    imageUtils.ts                       // Cloudinary helpers (reuse)
```

---

## Step 1 – Event Basics (UI & Behaviour)

- **Layout**: Single `rounded-3xl` card that matches the course page (2-column 70/30 grid with right-hand aside); stack on mobile.
- **Header**: Mirror course header with step indicator pill (`Step 1 of 2 · Event Basics`) and back button.
- **Form state**: replicate Angular controls.

```ts
const sparkleStyles = `
@keyframes sparkle-burst {
  0%, 100% {
    transform: scale(0.5);
    opacity: 0;
  }
  45% {
    transform: scale(1);
    opacity: 1;
  }
  70% {
    transform: scale(0.8);
    opacity: 0.6;
  }
}

.sparkle-star {
  position: absolute;
  width: 8px;
  height: 8px;
  opacity: 0;
}

.sparkle-star polygon {
  fill: currentColor;
}`;
```

- Inject the sparkle keyframes (above) on mount so AI buttons reuse the same animated wand styling as the course page.

```ts
type ScheduleRow = {
  id?: string;
  dispDate: string;  // ISO
  startTime: string; // 'hh:mm A'
  endTime: string;   // 'hh:mm A'
  agenda: string;
  isDelete: boolean;
  isFirstClass: boolean;
};

interface EventFormState {
  name: string;
  shortDescription: string;
  longDescription: string;
  image1: string;
  authorType: 'host' | 'organizer';
  host: string;
  organizerName: string;
  teacherId: string;
  isTeacher: boolean;

  isInPersonMeeting: boolean;
  isOnlineMeeting: boolean;
  isAutoGenerateMeetingLink: boolean;
  meetingProvider: string;

  onlineMeetJoinUrl: string;
  onlineMeetAdminUrl: string;
  onlineMeetPassword: string;

  roomName: string;
  location: string;
  city: string;
  state: string;
  zipCode: string;
  locationId: string;

  isMultiDayEvent: boolean;
  maxAttendees: string;
  eventTags: string[];
  contactId?: string;

  schedules: ScheduleRow[];
}
```

- **Validation**
  - `name`, `shortDescription` required.
  - `host` when `authorType === 'host'`; `teacherId` when organizer selected.
  - In-person: `roomName`, `location`, `city`, `state`, `zipCode`.
  - Manual online link: `onlineMeetJoinUrl`.
  - At least one schedule with `isDelete === false`.
  - Short description character counter; warn >255.

- **Schedules**
  - Default row: today, start now, end +1h.
  - Add button appends new day; delete toggles `isDelete` (keep at least one active).
  - Multi-day toggle appears when >1 active entry; show agenda input per row when multi-day.

- **Meeting mode toggles**
  - Buttons: In-Person | Online | Both (update boolean pair).
  - When editing and auto-link true, show regenerate button (opens confirmation dialog stub).

- **Locations**
  - Preload saved locations (filter `isDeleted=false`).
  - Set defaults from `getDefaultEventValue` (contains location + max attendees).
  - Selector entries include delete icon (confirm, then call delete API).
  - “Add” button opens modal component; on success push to cached list.

- **Tags**
  - Input #enter adds unique trimmed tag; chips with remove icon.

- **AI Buttons**
  - `Generate name` / `Generate short description` call AI prompt builder; update form field via sidebar service.
  - “Generate long description” triggered when leaving Step 1 with empty long description (auto-run before payload save).
- Match course page sparkle button treatment (animated wand with sparkle keyframes and inline counter badges).

- **Private Class Support**
  - When API returns `contact`, display chosen member info; require selection when `actionType === 'privateclass'`.

- **Actions**
  - Buttons: Cancel, Next (validate + maybe run AI long description).
  - On Next: if form invalid, toast error + stay Step 1.

---

## Step 2 – Sales Page Template

- **Header**: `Regenerate AI Template` (shows confirmation, clears AI session, triggers flyer prompt).
- **GrapesJS Panel** (stub for now):
  - Props: `{ productData, template, module: 'event', qrImage }`.
  - Emits:
    - `onEditorReady(editor)` → store ref.
    - `onDirtyChange(count)` → track unsaved.
    - `onSave(payload)` → call `saveTemplate`.
  - Provide placeholder textarea when editor not mounted.

- **Buttons**
  - `Previous` (back to Step 1).
  - `Save` → `addOrUpdateEventTemplate(false)`.
  - `Submit` → `addOrUpdateEventTemplate(true)` then redirect to detail route (`/rules/{id}/detail` equivalent path).

---

## Service Layer

### eventDetailService.ts

| Method | Description | Source |
| --- | --- | --- |
| `getEvent(id)` | GET `/snode/erule/{id}` | Angular `getNewProgramObject` |
| `createEvent(payload)` | POST `/snode/erule` | `addNewEvent` |
| `updateEvent(id, payload)` | PUT `/snode/erule/{id}` | `updateNewProgram` |
| `getLocations()` | GET `/snode/erule/location` (match Angular service) | `getAllLocations` |
| `deleteLocation(id)` | DELETE endpoint (from Angular) | `deleteLocationById` |
| `getTeachers()` | GET `/snode/teacher` or reused endpoint | `getTeacherList` |
| Time helpers | port `createUTCMoment`, `convertToDate`, etc. | `ProgramsService` |
| `getEventTemplate(id)` | GET `UnlayerService.getProgramTemplate` | reused service |

### eventTemplateService.ts

Wrap `ProductService.addUntemplateToEvent` / `updateUntemplateToEvent`.

### meetingProviderService.ts

Wrap `OauthIntegrationService.getOauthOnlineMeetingProvidersAPI`.

### ai services

Use existing React `courseAiService`/`aiSidebarService`; adapt prompts for event tone.

---

## Hook: `useEventDetail`

Responsibilities:

1. Initialise state (`isEdit`, `event`, `template`, `tenant`, `locations`, `teachers`, `meetingProviders`, `connectedMeetingAccount`, `qrImage`).
2. Build form defaults (prefill host from tenant name).
3. Manage effect sequences:
   - Load tenant + default location + teacher list via `Promise.all`.
   - Fetch event when editing; hydrate form & schedule arrays; set `isMultiDayEvent`.
   - Fetch meeting providers; auto-select first if available.
   - Load template via `getEventTemplate`.
   - Set AI sidebar context (short description, designer).
4. Provide handlers:
   - `setMeetingMode(mode)`
   - `handleScheduleAdd/remove`
   - `handleLocationSelect/delete/add`
   - `setAuthorType`
   - `setBannerImage`
   - `handleTagAdd/remove`
   - `generateLongDescription`
   - `finishSetup` (construct payload, call API, update state, toast success)
   - `pollForAIResult` (with stop control)
   - `regenerateTemplate`
   - `saveTemplate(redirect?)`
   - `cancelTemplate()` (prompt unsaved dialog)
5. Cleanup on unmount:
   - Stop polling, clear AI sessions, close sidebar.

---

## Payload Assembly

### Event submission (`finishSetup`)

```ts
const payload = {
  name,
  shortDescription: shortDescription ?? '',
  longDescription: stripHtml(longDescription) ?? '',
  imageUrl: image1,
  isInPersonMeeting,
  isOnlineMeeting,
  isMultiDayEvent,
  host,
  isTeacher,
  maxAttendees: sPrefMaxSize ?? maxAttendees,
  isPublished: formValue.isPublished,
  registrationFormId,
  isRepeat: 'false',
  category: { guId: defaultCategoryId ?? categoryGuId },
  zip: zipCode,
  tagList: [...eventTags],
  locationId: selectedLocation || undefined,
  teacherId: isTeacher ? teacherId : undefined,
  roomName: isInPersonMeeting ? roomName : undefined,
  location,
  city,
  state,
  meetingProvider: isAutoGenerateMeetingLink ? meetingProvider : undefined,
  onlineMeetAdminUrl: !isAutoGenerateMeetingLink ? onlineMeetAdminUrl : undefined,
  onlineMeetJoinUrl: !isAutoGenerateMeetingLink ? onlineMeetJoinUrl : undefined,
  onlineMeetPassword: !isAutoGenerateMeetingLink ? onlineMeetPassword : undefined,
  contactId: contactId,
  scheduleList: schedules
    .filter(s => !s.isDelete)
    .map((row, idx) => ({
      startTime: toUtcEpoch(row.dispDate, row.startTime),
      endTime: toUtcEpoch(row.dispDate, row.endTime),
      isFirstClass: idx === 0,
      scheduleId: row.id,
      agenda: row.agenda,
      isDelete: false,
    })),
};
```

- Sort `scheduleList` by start time prior to marking first class.
- Use `moment-timezone` (or `dayjs` with tz plugin) to convert to UTC using tenant timezone guess.

### Template payload (`saveTemplate`)

```ts
const fullHtml = editorReturnsFullDocument
  ? html
  : wrapWithHtmlDocument(html, css, js);

const templatePayload = {
  guId: event.id,
  name: event.name,
  url: '',
  orgId: tenant.orgId,
  unhtml: fullHtml,
  unjson: editor.getProjectData(),
};
```

- POST `/stemplate/page` if no `templateId`; else PUT `/stemplate/page/{templateId}`.
- Update local `template`, `templateId`, `unhtml` from response.

---

## AI & Template Integration

- `updateProductDetailsInAI()` builds event payload for AI sidebar (name, descriptions, image, date/time, location, author, price).
- `optimizeWithAi(field)`:
  1. Update product details.
  2. Call `aiTemplateService.sendAiPrompt(generatePrompt(field), ['event'])`.
  3. On success, patch form + toast success.
- `generateLongDescription`:
  - Build prompt including event name, short description, date/time, location.
  - If success: push AI message to sidebar, set form field, toast success.
  - Always set designer mode after attempt.
- `sendFlyerPrompt`:
  - Check `editor` ready.
  - Show spinner; call AI template service; on session id start polling.
  - On completion: call `loadHtmlIntoEditor(cleanHtml)`, toast success.
  - On failure/timeouts: toast error.
- `cleanHtmlContent`: remove ``` fences similar to Angular.

---

## Toasts & Loading States

- Use `useToast()` for all user feedback:
  - Success: “Changes saved successfully”
  - Errors: use backend error message (`error.response?.data?.errors?.message`).
  - AI warnings (editor not initialized, generation failed).
- Loading indicators:
  - Step 1: inline spinner on Save.
  - Step 2: overlay spinner message for AI operations.
  - Global skeleton while initial data loads.

---

## Testing Checklist

1. **Initialization**
   - Tenant details prefill host & default location.
   - Meeting providers load (auto-select first).
   - Event detail pre-populates fields, schedule, tags, meeting info.
   - Template loads (existing unjson/unhtml).
2. **Form validation**
   - Required fields catch errors via toast.
   - Meeting mode toggles update validators.
   - Manual online link required when auto-generate off.
   - Removing schedules respects minimum of one active entry.
3. **AI interactions**
   - Name/short description generation updates fields & toasts.
   - Long description autogenerates on Next when needed.
   - Flyer regeneration polls, handles success/failure/timeouts.
4. **Template saving**
   - Save/Submit calls correct endpoint, updates templateId.
   - Regenerate template resets AI session.
   - Unsaved dialog triggered when dirtyCount>0 and cancel.
5. **Meeting scenarios**
   - In-person only → location fields required.
  - Online auto link → disable manual inputs.
  - Hybrid updates summary copy (if displayed).
6. **Private class flow**
   - Renders selected member; requires `contactId`.
7. **Tags & location CRUD**
   - Add/remove tags updates form & display.
   - Delete location reassigns fallback location.
   - Add new location updates dropdown & selects new value.
8. **UI/UX**
   - Stepper navigation gating works.
   - Character counter warns >255.
  - Dark mode/styling matches course page (single card layout, sparkle AI buttons, step indicator pill).
   - Responsive layout on mobile/tablet.
9. **API payload verification**
   - POST/PUT bodies match Angular structure (check sorted schedule, timezone conversions, optional fields).
   - Template payload includes `orgId`, `unhtml`, `unjson`.

---

## Next Steps

- Integrate actual GrapesJS editor once available.
- Extract shared AI prompt utilities across courses/events.
- Consider sharing location/teacher services with Program list.
- Add automated tests (Jest + React Testing Library) for hook logic and schedule helper functions.
- Verification commands:
  - `npx tsc --noEmit`
  - `npm run lint`

> Latest run (UI parity update): `npx tsc --noEmit` ✔️
