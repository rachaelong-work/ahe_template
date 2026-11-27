/** Application coordinator: agency grouping + module orchestration. */
import {$,downloadFile} from "./utils.js";
import {createParticipantRow,readParticipants,importCSV,csvTemplate,loadSample} from "./participant-data.js";
import {assessmentModel} from "./assessment-analysis.js";
import {renderReport} from "./report-renderer.js";

const ALL="__ALL__";
function agencies(records){
 return [...new Set(records.map(r=>(r.agency||"").trim()||"Unassigned"))].sort((a,b)=>a.localeCompare(b));
}
function refreshAgencyPicker(){
 const records=readParticipants(), select=$("agencySelect"), previous=select.value;
 const options=agencies(records);
 select.replaceChildren(new Option("All agencies (overview)",ALL));
 options.forEach(name=>select.add(new Option(`${name} (${records.filter(r=>(r.agency||"").trim()||"Unassigned"===name).length})`,name)));
 // Correctly calculate the displayed counts independent of grouping fallback.
 [...select.options].forEach(option=>{
  if(option.value!==ALL)option.textContent=`${option.value} (${records.filter(r=>((r.agency||"").trim()||"Unassigned")===option.value).length})`;
 });
 select.value=options.includes(previous)?previous:ALL;
 $("datasetSummary").textContent=`${records.length} participant records · ${options.length} agencies`;
 return options;
}
function selectedRecords(){
 const all=readParticipants(),agency=$("agencySelect").value;
 return agency===ALL?all:all.filter(r=>((r.agency||"").trim()||"Unassigned")===agency);
}
function reportMetadata(agency=null){
 const selected=$("agencySelect").value;
 const agencyName=agency??(selected===ALL?"All agencies":selected);
 return {company:agencyName==="All agencies"?($("company").value.trim()||"All agencies"):agencyName,
 programme:$("programme").value.trim(),date:$("date").value,author:$("author").value.trim(),
 about:$("about").value.trim(),context:$("context").value.trim()};
}
function configuredCutoffs(){
 return {fatCut:$("fatCut").value,visCut:$("visCut").value,balCut:$("balCut").value,
 gripCut:$("gripCut").value,hrCut:$("hrCut").value};
}
function renderFor(records,agency=null){
 const model=assessmentModel(records,configuredCutoffs());
 renderReport(records,model,reportMetadata(agency),configuredCutoffs());
 return $("report").cloneNode(true);
}
function generateReport(){
 refreshAgencyPicker();
 const records=selectedRecords();
 if(!records.length){$("overview").textContent="Please import or enter participant records for the selected agency.";return false}
 renderFor(records,$("agencySelect").value===ALL?"All agencies":$("agencySelect").value);
 return true;
}
function buildAllAgencyReports(){
 const records=readParticipants(),names=agencies(records);
 if(!records.length||!names.length){alert("Please import or enter participant records first.");return}
 const saved=renderFor(selectedRecords(),$("agencySelect").value===ALL?"All agencies":$("agencySelect").value);
 const reports=[];
 names.forEach(name=>{
  const group=records.filter(r=>((r.agency||"").trim()||"Unassigned")===name);
  reports.push(renderFor(group,name));
 });
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Agency Health & Fitness Reports</title><link rel="stylesheet" href="css/styles.css"><style>.report{page-break-after:always;break-after:page}.report:last-child{page-break-after:auto}</style></head><body>${reports.map(r=>`<article class="report">${r.innerHTML}</article>`).join("")}</body></html>`;
 downloadFile("all_agency_health_fitness_reports.html",html,"text/html;charset=utf-8");
 // Return screen to its previously selected agency.
 $("report").replaceWith(saved); $("report").id="report";
}
function printAllReports(){
 const records=readParticipants(),names=agencies(records);
 if(!records.length||!names.length){alert("Please import or enter participant records first.");return}
 const reports=names.map(name=>{
  const group=records.filter(r=>((r.agency||"").trim()||"Unassigned")===name);
  return renderFor(group,name);
 });
 const report=$("report"),original=report.innerHTML;
 report.innerHTML=reports.map(r=>`<section class="report">${r.innerHTML}</section>`).join("");
 window.print();
 report.innerHTML=original;
 generateReport();
}
function bindEvents(){
 $("add").addEventListener("click",()=>{createParticipantRow();refreshAgencyPicker()});
 $("sample").addEventListener("click",()=>{loadSample();refreshAgencyPicker();generateReport()});
 $("template").addEventListener("click",()=>downloadFile("corporate_assessment_template.csv",csvTemplate(),"text/csv;charset=utf-8"));
 $("file").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{const result=await importCSV(file);refreshAgencyPicker();generateReport();alert(`${result.count} participant rows imported across ${agencies(readParticipants()).length} agencies.`)}
  catch(error){alert(`Unable to import CSV: ${error.message}`)}
  event.target.value="";
 });
 $("agencySelect").addEventListener("change",generateReport);
 $("build").addEventListener("click",generateReport);
 $("buildAll").addEventListener("click",buildAllAgencyReports);
 $("printAll").addEventListener("click",printAllReports);
 $("pdf").addEventListener("click",()=>{if(generateReport())window.print()});
 $("html").addEventListener("click",()=>{
  if(!generateReport())return;
  const report=$("report").cloneNode(true);
  const documentHTML=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Corporate Health & Fitness Report</title><link rel="stylesheet" href="css/styles.css"></head><body><article class="report">${report.innerHTML}</article></body></html>`;
  downloadFile("corporate_health_fitness_report.html",documentHTML,"text/html;charset=utf-8");
 });
}
$("date").value=new Date().toISOString().slice(0,10);
bindEvents();
createParticipantRow();
refreshAgencyPicker();
generateReport();
