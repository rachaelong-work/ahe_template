/** App orchestration: CSV import, agency filtering and export. */
import {$,downloadFile,escapeHTML} from "./utils.js";
import {createParticipantRow,readParticipants,importCSV,applyCSVMapping,csvTemplate,loadSample,FIELDS} from "./participant-data.js";
import {renderReport} from "./report-renderer.js";
import {exportReportsToDocx,createDocxBlob} from "./docx-export.js";
const ALL="__ALL__";
function agencyOf(r){return String(r.agency||"").trim()||"Unassigned"}
function agencies(records){return [...new Set(records.map(agencyOf))].sort((a,b)=>a.localeCompare(b))}
function refreshAgencyPicker(){const records=readParticipants(),s=$("agencySelect"),old=s.value,names=agencies(records);s.replaceChildren(new Option("All agencies (combined)",ALL));names.forEach(n=>s.add(new Option(`${n} (${records.filter(r=>agencyOf(r)===n).length})`,n)));s.value=names.includes(old)?old:ALL;$ ("datasetSummary").textContent=`${records.length} rows · ${names.length} agencies`;return names}
function selectedRecords(name=$("agencySelect").value){const r=readParticipants();return name===ALL?r:r.filter(x=>agencyOf(x)===name)}
function metadata(name){return {company:name===ALL?($("company").value.trim()||"All agencies"):name,programme:$ ("programme").value.trim(),date:$ ("date").value,author:$ ("author").value.trim(),about:$ ("about").value.trim(),context:$ ("context").value.trim(),limits:$ ("limits").value.trim(),psd:{perHealth:Number($("psdHealth").value),perActive:Number($("psdActive").value),perSocial:Number($("psdSocial").value),perProductivity:Number($("psdProductivity").value),perLeadership:Number($("psdLeadership").value)}}}
function build(name=$("agencySelect").value){const records=selectedRecords(name);if(!records.length){$("overview").textContent="Import a Tableau CSV or enter participant rows first.";return null}renderReport(records,metadata(name));return $("report").cloneNode(true)}
function generate(){refreshAgencyPicker();return !!build()}
function allReports(){const names=agencies(readParticipants());return names.map(n=>{build(n);return $("report").cloneNode(true)})}
function downloadHTML(nodes,filename){const css=document.querySelector('link[rel="stylesheet"]').href;const html=`<!doctype html><html><head><meta charset="utf-8"><title>AHE agency reports</title><link rel="stylesheet" href="${css}"><style>.report{page-break-after:always}</style></head><body>${nodes.map(n=>n.outerHTML).join("")}</body></html>`;downloadFile(filename,html,"text/html;charset=utf-8")}
function setup(){const headers=$("inputHeaders");headers.innerHTML=FIELDS.map(f=>`<th>${escapeHTML(f.label)}</th>`).join("")+"<th>Remove</th>";
 $("date").value=new Date().toISOString().slice(0,10);createParticipantRow();
 $("file").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const result=await importCSV(file);$("datasetSummary").textContent=`${result.count} Tableau rows loaded. Review the field mapping below, then apply it.`}catch(err){alert(`CSV import failed: ${err.message}`)}e.target.value=""});
 $("applyMapping").addEventListener("click",()=>{try{const count=applyCSVMapping();refreshAgencyPicker();generate();alert(`${count} rows mapped and imported. Review the selected agency and report.`)}catch(e){alert(`Mapping could not be applied: ${e.message}`)}});
 $("sample").addEventListener("click",()=>{loadSample();refreshAgencyPicker();generate()});$("template").addEventListener("click",()=>downloadFile("AHE_Tableau_Field_Mapping_Template.csv",csvTemplate(),"text/csv;charset=utf-8"));
 $("agencySelect").addEventListener("change",generate);$("build").addEventListener("click",generate);$("word").addEventListener("click",async()=>{if(!build())return;try{await exportReportsToDocx([$("report")],`${safeFile($ ("agencySelect").value===ALL?$("company").value||"All_Agencies":$("agencySelect").value)}_AHE_Report.docx`)}catch(e){alert(`Word export failed: ${e.message}`)}});
 $("wordAll").addEventListener("click",async()=>{if(!readParticipants().length)return alert("Import or map the CSV first.");if(!window.JSZip)return alert("ZIP library did not load. Check your internet connection and reload.");try{const zip=new JSZip(),names=agencies(readParticipants());for(const name of names){const records=selectedRecords(name);renderReport(records,metadata(name));const node=$("report").cloneNode(true);const blob=await createDocxBlob([node]);zip.file(`${safeFile(name)}_AHE_Report.docx`,blob);}const bundle=await zip.generateAsync({type:"blob"});downloadFile("AHE_Separate_Agency_Word_Reports.zip",bundle,"application/zip");generate()}catch(e){alert(`Separate agency Word export failed: ${e.message}`)}});
 $("pdf").addEventListener("click",()=>{if(generate())window.print()});$("html").addEventListener("click",()=>{const n=build();if(n)downloadHTML([n],"AHE_Agency_Report.html")});$("htmlAll").addEventListener("click",()=>{if(!readParticipants().length)return alert("Import the CSV first.");downloadHTML(allReports(),"AHE_All_Agency_Reports.html");generate()});
}
function safeFile(v){return String(v||"Agency").replace(/[^a-z0-9_-]+/gi,"_").replace(/^_|_$/g,"")}
setup();refreshAgencyPicker();
