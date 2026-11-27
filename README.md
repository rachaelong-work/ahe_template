# AHE Corporate Health & Fitness Report Generator (modular)

The report generator follows the uploaded AHE report's section flow, including body composition, fitness indicators, lifestyle behaviours and readiness-to-change stages.

## Launch
Open `index.html` from a local static server or publish the folder on GitHub Pages. Native JavaScript ES modules work best over HTTP(S), not by opening a file directly with `file://`.

Example local server:
- VS Code: use the Live Server extension.
- Python: run `python -m http.server 8000` in this folder, then open `http://localhost:8000`.

## Project structure
- `index.html` — semantic page structure and form controls
- `css/styles.css` — all presentation and print styles
- `js/app.js` — app bootstrap and event orchestration
- `js/participant-data.js` — participant entry and CSV operations
- `js/assessment-analysis.js` — reusable analysis/calculation logic
- `js/report-renderer.js` — report presentation
- `js/utils.js` — shared helpers
- `js/README.md` — module/SOLID explanation

## Multi-agency CSV workflow
Include an `Agency` column for every participant row. Import one consolidated CSV containing all agencies. The Agency selector will list each agency and its participant count; selecting one generates a report using only that agency's rows. “Generate all agency reports (HTML)” exports a combined HTML document with one separate report section per agency. “Print all agency reports / Save combined PDF” opens the browser print dialog for the combined report; select Save as PDF.

Rows with a blank Agency value are grouped under **Unassigned**. If your Tableau export uses a different agency column heading, rename it to `Agency` (the template label) before import. All participant identifiers should be de-identified.

## CSV fields
Use the supplied CSV template. It includes participant ID, optional demographic fields, InBody 770 measures, balance, grip, step recovery HR, lifestyle behaviour and readiness stage.

## Privacy and interpretation
Use de-identified participant IDs. The app performs calculations locally in the browser and does not send records to a server. Set cut-offs using approved protocols and suitable population references. Outputs support wellness planning and are not medical diagnoses.
