/** Application coordinator: wires UI actions to data, analysis and rendering modules. */
import {$,downloadFile} from "./utils.js";
import {createParticipantRow,readParticipants,importCSV,csvTemplate,loadSample} from "./participant-data.js";
import {assessmentModel} from "./assessment-analysis.js";
import {renderReport} from "./report-renderer.js";

function reportMetadata(){
 return {company:$("company").value.trim(),programme:$("programme").value.trim(),
 date:$("date").value,author:$("author").value.trim(),about:$("about").value.trim(),context:$("context").value.trim()};
}
function configuredCutoffs(){
 return {fatCut:$("fatCut").value,visCut:$("visCut").value,balCut:$("balCut").value,
 gripCut:$("gripCut").value,hrCut:$("hrCut").value};
}
function generateReport(){
 const records=readParticipants();
 if(!records.length){$("overview").textContent="Please enter or import participant records.";return false}
 const model=assessmentModel(records,configuredCutoffs());
 renderReport(records,model,reportMetadata(),configuredCutoffs());
 return true;
}
function bindEvents(){
 $("add").addEventListener("click",()=>createParticipantRow());
 $("sample").addEventListener("click",()=>{loadSample();generateReport()});
 $("template").addEventListener("click",()=>downloadFile("corporate_assessment_template.csv",csvTemplate(),"text/csv;charset=utf-8"));
 $("file").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{const result=await importCSV(file);generateReport();alert(`${result.count} participant rows imported.`)}
  catch(error){alert(`Unable to import CSV: ${error.message}`)}
  event.target.value="";
 });
 $("build").addEventListener("click",generateReport);
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
generateReport();
