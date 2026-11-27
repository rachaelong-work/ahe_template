# JavaScript module map

The app uses native ES modules (`type="module"`); each file has a focused responsibility.

| Module | Responsibility |
|---|---|
| `utils.js` | DOM helper, number formatting, CSV parsing, escaping and downloads |
| `participant-data.js` | Participant field schema, table rows, reading/clearing/importing data and sample/template data |
| `assessment-analysis.js` | Pure assessment calculations, threshold results, lifestyle metrics, readiness stage counts and demographic summaries |
| `report-renderer.js` | Presentation only: fills report sections, tables, charts, findings and recommendation text |
| `app.js` | Application entry point; connects UI events and coordinates data → analysis → report |

## SOLID design notes
- **Single Responsibility:** each module has one reason to change.
- **Open/Closed:** new assessment metrics can be added through field definitions and analysis configuration without rewriting the event coordinator.
- **Liskov Substitution:** modules expose stable function contracts and can be replaced by compatible implementations.
- **Interface Segregation:** modules export small, task-specific functions rather than a large global API.
- **Dependency Inversion:** the coordinator imports abstractions (module functions) and does not embed calculations or report markup itself.

Data is processed locally in the browser. This build does not connect to a database or transmit participant records.


## Multi-agency reporting
`participant-data.js` includes the `Agency` field in the CSV template and editable participant grid. `app.js` discovers agency names, updates the agency selector, filters records before analysis, and provides a combined all-agency HTML export and combined print/PDF workflow. Agency grouping is based on the normalized Agency value; blank values are assigned to `Unassigned`.
