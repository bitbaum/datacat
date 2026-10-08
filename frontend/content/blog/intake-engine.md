---
created_date: 2025-07-10
last_modified_date: 2026-10-02
last_modified_summary: 'Cut claims the code does not back: an unsourced 37 % statistic, a 200k events/s stream layer, Kafka/Protobuf/Iceberg, few-shot examples and a feedback loop. The roadmap table became the status the /ingest page shows, and the photo product scan is named as a demo.'
title: 'Vom Rohdatenfluss zur smarten Entscheidung – unsere Data-Intake-Journey'
date: '2025-07-10'
summary: 'Warum Datenaufnahme der Grundstein jeder Analyse ist – und wie wir sie mit Formularen, Medien-Ingestion und AI angehen.'
tags: ['data-ingestion', 'form-builder', 'llm']
---

## Einleitung

Daten sind das Öl des 21. Jahrhunderts – ein abgedroschener Satz, doch ohne Frage wahr.
Rohdaten _alleine_ bringen jedoch keinen Motor zum Laufen. Erst wenn Informationen **bequem erfasst**, **intelligent analysiert** und schliesslich in **wirkungsvollen Aktionen** münden, entsteht echter Mehrwert.

## Unser Intake-Stack auf einen Blick

1. **Formulare** – schnell per Drag-and-Drop gebaut, perfekt für menschlichen Input.
2. **Medien & Quellen** – Audio, Video, Bilder, Websites und Datenbanken werden direkt eingelesen.
3. **Contextual Prompts** – jede Datenspur erhält Zusatzwissen, bevor sie zum LLM geht.
4. **AI-Insights** – konkrete Empfehlungen, automatisch generiert.

---

## Warum ist Datenerfassung so wichtig?

### 1. Qualität schlägt Quantität

Ein kleiner, sauberer Datensatz bringt mehr als eine Big-Data-Müllhalde. Durch Validierung _am_ Intake-Punkt verhindern wir Fehler, bevor sie teuer werden.

### 2. Geschwindigkeit entscheidet

Je früher Daten strukturiert vorliegen, desto früher lassen sich Trends erkennen und Entscheidungen treffen.

### 3. Kontext macht Daten wertvoll

Ohne Metadaten weiss auch das beste Modell nichts anzufangen. Deshalb reichern wir jeden Datensatz bereits beim Intake an – wer, wo, in welchem Schritt.

---

## Technischer Deep-Dive

### Formular-Ingestion

- **Schema-First**: Jedes Feld besitzt Typ, Constraints und Hilfetext.
- **Edge-Validation**: Client- & Server-Checks verhindern Inkonsistenzen.
- **Zustand Store**: Ein zentrales `useFormBuilderStore` hält Felder & Steps synchron (Drag-and-Drop inklusive!).

### Prompt Engineering Layer

- Dynamische System-Prompts, basierend auf Analyseart und Formular-Schema.
- Analysearten: Sentiment, Klassifikation, Extraktion, Zusammenfassung oder eigene Fragen.

---

## Stand heute

- **Live:** Formular-Builder und Ingestion von Audio, Video, Bildern, Websites und Datenbanken.
- **Demo:** Der Produkt-Scan per Foto zeigt den Ablauf mit Beispieldaten – die Analyse ist noch nicht an die KI angebunden.
- **Als Nächstes:** Cloud-Speicher, Nachrichten und IoT-Sensoren – auf der [Ingestion-Seite](/ingest) als «Coming soon» markiert.

---

## Neugierig geworden?

Am Ende dieser Seite erwartet dich ein Call-to-Action – teste den **Universal Form Builder** noch heute und bring deine eigene Data-Intake-Journey ins Rollen! 🚀
