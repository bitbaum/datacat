# DataCat Frontend

The Next.js 16 frontend for DataCat, a universal AI-powered data capture platform (forms → AI analysis → action delivery).

## Getting Started

From the repository root, `pnpm run dev` starts both the frontend (port 3000) and the Express/tRPC backend (port 5001). To run the frontend alone:

```bash
cd frontend
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Edit pages under `src/app/` — the page auto-updates as you save.

Fonts are loaded via `next/font` (Geist). The frontend talks to the backend through `/api/*` rewrites; see the root `README.md` and `docs/deployment/docker-setup.md` for the full architecture and the self-hosted (Docker on the Hetzner box, behind Caddy) deployment.

---
created_date: 2024-07-08
last_modified_date: 2026-09-04
last_modified_summary: "Commands updated to pnpm; Next.js version corrected to 16."

---

# Neuerungen ab 2024-07-08

## Drag-and-Drop Sortierung

Das zentrale Formular-Canvas **und die Sidebar** unterstützen jetzt modernes Drag-and-Drop über **@dnd-kit**. Sie können Felder nicht nur innerhalb eines Schritts, sondern auch **zwischen** Schritten verschieben. So funktioniert's:

1. Bewegen Sie den Mauszeiger über ein Feld, bis der Cursor zur "Hand" wird.
2. Klicken, halten und ziehen Sie das Feld an die gewünschte Stelle.
3. Die benachbarten Felder gleiten nach oben / unten, sodass klar ersichtlich ist, wo das Element landet – selbst wenn Sie von Schritt 2 zu Schritt 1 ziehen.

### Technische Details

- Bibliotheken: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`  
- Implementation: `ModernFormBuilderLayout` verwendet `DndContext` + `SortableContext`.  
- Jedes Feld wird durch die neue **`SortableField`**-Komponente umhüllt, welche `useSortable` nutzt.

## Schritt-Titel bearbeiten

Im **Steps**-Tab der Sidebar kann der Titel eines Schrittes jetzt inline editiert werden:

1. Titel anklicken  
2. Neuen Namen eintippen  
3. Mit **Enter** bestätigen oder Fokus verlieren.  
4. **Esc** bricht den Vorgang ab.

Die Änderung wird via `onUpdateStep` sofort ins Formularmodell übernommen.

## Duplizieren-Bug behoben

Ein einzelner Klick auf das Kopier-Icon erstellt nur noch **eine** Kopie.  
Grund war ein doppeltes Event-Feuern; durch `e.stopPropagation()` im Button behoben.

## Installation

Falls Sie das Projekt zum ersten Mal auschecken oder neue Abhängigkeiten installieren möchten:

```bash
cd frontend
pnpm install
```

Die neuen DnD-Bibliotheken werden automatisch mitinstalliert.

## Neuerungen ab 2025-07-08

## Global State with Zustand

The form builder (builder canvas, sidebar, and multi-step editor) now shares a single source of truth provided by **Zustand** (`src/app/hooks/useFormBuilderStore.ts`).

### Benefits

1. No more prop-drilling of `fields`, `steps`, or `currentStep`.
2. Future features (undo/redo, collaboration, analytics) can plug into the store.
3. Cleaner component APIs.

### Key Store API

```
addField(field, stepId?)
updateField(fieldId, updates)
duplicateField(fieldId)
removeField(fieldId)
reorderField(from, to)

addStep(step) / updateStep(stepId, updates) / removeStep(stepId)
reorderStep(from, to)

toggleMultiStep()
setCurrentStep(index)
setFields(array)  // bulk replace
setSteps(array)   // bulk replace
```

### Component Changes

| Old Component | New Wrapper | Purpose |
|---------------|------------|---------|
| `ModernSidebar` | `ModernSidebarStore` | Injects store values/actions |
| `MultiStepFormBuilder` | `MultiStepFormBuilderStore` | Same, for steps |

Existing props still work, so gradual migration is possible.

### Migration Guide for Your Own Components

1. Import the hook: `const { fields } = useFormBuilderStore();`
2. Derive local UI state from the store rather than props.
3. Dispatch actions instead of lifting state up.

```tsx
import { useFormBuilderStore } from '../hooks/useFormBuilderStore';

function RequiredFieldBadge({ fieldId }: { fieldId: string }) {
  const required = useFormBuilderStore((s) => s.fields.find(f => f.id === fieldId)?.required);
  return required ? <span>*</span> : null;
}
```

---

## Neuerungen ab 2025-07-09

### Inline-Add-Buttons im Single-Step Modus

Der Ein-Seiten-Builder zeigt jetzt nach jeder Feldliste dieselben 「＋ Feld」 und 「＋ Sektion」-Schaltflächen wie der Multi-Step-Builder. Dadurch können Sie ohne Umwege neue Elemente einfügen, ganz egal ob Ihr Formular in Schritten aufgebaut ist oder nicht.

### Formular-Titel nun oben

Der Titel des Formulars befindet sich jetzt als grosses, direkt editierbares Eingabefeld ganz oben in der Builder-Ansicht. Dadurch wirkt er wie eine eigentliche Überschrift und ist sofort sichtbar.

### Einheitliche Button-Farben

Alle Call-to-Action-Buttons in der Fussleiste (Speichern, Vorschau, + Neu) verwenden jetzt Indigo-Töne und folgen damit einem klaren Farbkonzept.

### Gleiche Feldbreite im Single-Step

Felder im Ein-Seiten-Modus sind nun ebenfalls auf `max-w-4xl` begrenzt, identisch zum Multi-Step-Modus. Dadurch wirken die Layouts konsistent.
