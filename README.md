# AHE Corporate Health & Fitness Report Generator (Tableau CSV + Word)

## How to use
1. Open `index.html` on GitHub Pages or a local static server.
2. In Tableau, export the participant-level view as CSV. Use de-identified participant IDs and include an Agency field for multi-agency reporting.
3. Upload the CSV. Review the generated Tableau field mapping; select the correct source column for every measure and click **Apply field mapping / import rows**. The importer recognises common Tableau/AHE column names but mapping must be checked.
4. Select an agency (or All agencies), complete report metadata and click **Generate / refresh report**.
5. Download the selected agency or all agencies as an editable `.docx`. Charts are embedded as images; report text and tables remain editable in Word. Print/Save PDF is also available.

## Fields and template alignment
The mapping includes demographics; BMI, PBF, SMM and visceral fat; categorical BP and numeric SBP/DBP; balance, shoulder mobility, hand grip, 1-minute sit-to-stand and 3-minute step recovery HR; lifestyle activity, strength training, healthier choices and sedentary behaviour; readiness stages; and perception domains. Category charts use categories already present in Tableau. The generator does **not** invent clinical cut-offs when a category field is absent.

The report sections follow the uploaded AHE 6.0 report: Staff Demographics; Health Indicators; Lifestyle Behaviours; Fitness Indicators; Readiness to Change; Perception; Recommendations; and Appendices with subgroup/data completeness summaries.

## Word export
The DOCX exporter uses the `docx` browser library from jsDelivr. An internet connection is needed when the page loads the library. The CSV is processed locally in the browser; it is not uploaded to a server by this app.

## Data privacy
Use only approved data, de-identify participant records, and suppress or omit small subgroup results before sharing. Keep exported reports in approved storage.


### Separate Word documents by agency

Use **Download selected agency Word (.docx)** to download one agency report. Use **Download separate agency Word files (ZIP)** to create a ZIP archive containing one independent `.docx` report per agency. The agencies are not combined into a single Word document.
