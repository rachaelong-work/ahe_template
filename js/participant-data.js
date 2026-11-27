/** Participant-data responsibility: table editing, validation, CSV import/export. */
import {$,parseCSV} from "./utils.js";
export const FIELDS=[
{id:"id",label:"Participant ID",type:"text"},{id:"age",label:"Age group",type:"text"},
{id:"sex",label:"Sex",type:"text"},{id:"designation",label:"Designation",type:"text"},
{id:"bmi",label:"BMI",type:"number"},{id:"fat",label:"Body fat %",type:"number"},
{id:"smm",label:"Skeletal muscle mass kg",type:"number"},{id:"vis",label:"Visceral fat level",type:"number"},
{id:"balL",label:"Balance left sec",type:"number"},{id:"balR",label:"Balance right sec",type:"number"},
{id:"grip",label:"Hand grip kg",type:"number"},{id:"hr",label:"3-min step recovery HR bpm",type:"number"},
{id:"aerobic",label:"Aerobic activity min/week",type:"number"},{id:"strengthDays",label:"Strength training days/week",type:"number"},
{id:"healthyChoices",label:"Healthier choices times/week",type:"number"},{id:"sedentary",label:"Sedentary hours/day",type:"number"},
{id:"readiness",label:"Readiness stage",type:"text"}];
export function createParticipantRow(values={}) {
 const tr=document.createElement("tr");
 FIELDS.forEach(field=>{
  const td=document.createElement("td"),input=document.createElement("input");
  input.dataset.key=field.id;input.type=field.type;input.value=values[field.id]??"";
  if(field.type==="number")input.step="any";
  if(field.id==="readiness"){input.placeholder="Choose stage";input.setAttribute("list","readinessOptions")}
  td.append(input);tr.append(td);
 });
 const td=document.createElement("td"),remove=document.createElement("button");
 remove.type="button";remove.className="light";remove.textContent="×";
 remove.setAttribute("aria-label","Remove participant row");remove.addEventListener("click",()=>tr.remove());
 td.append(remove);tr.append(td);$("inputTable").querySelector("tbody").append(tr);
}
export function readParticipants(){
 return [...$("inputTable").querySelectorAll("tbody tr")].map(tr=>{
  const record={};tr.querySelectorAll("input").forEach(input=>{
   const value=input.value.trim();record[input.dataset.key]=value===""?null:
    input.type==="number"?Number(value):value;
  });return record;
 }).filter(record=>record.id);
}
export function clearParticipants(){ $("inputTable").querySelector("tbody").replaceChildren(); }
export async function importCSV(file){
 const rows=parseCSV(await file.text());if(rows.length<2)return {count:0,errors:["CSV has no participant rows."]};
 const headers=rows[0].map(x=>x.toLowerCase());
 const imported=rows.slice(1).map(cells=>{
  const record={};FIELDS.forEach(field=>{
   const index=headers.indexOf(field.label.toLowerCase());
   record[field.id]=index<0?"":cells[index]??"";
  });return record;
 }).filter(record=>record.id);
 clearParticipants();imported.forEach(createParticipantRow);
 return {count:imported.length,errors:[]};
}
export function csvTemplate(){
 return FIELDS.map(f=>`"${f.label.replaceAll('"','""')}"`).join(",")+"\n";
}
export function loadSample(){
 const samples=[
 {id:"C001",age:"30–39",sex:"Female",designation:"Staff",bmi:24.2,fat:29.1,smm:25.6,vis:8,balL:28,balR:25,grip:27,hr:124,aerobic:90,strengthDays:1,healthyChoices:3,sedentary:9,readiness:"Preparation"},
 {id:"C002",age:"40–49",sex:"Male",designation:"Staff",bmi:26.1,fat:24.5,smm:32.1,vis:10,balL:19,balR:22,grip:39,hr:132,aerobic:180,strengthDays:2,healthyChoices:5,sedentary:7,readiness:"Action"},
 {id:"C003",age:"30–39",sex:"Female",designation:"Manager",bmi:22.5,fat:26.8,smm:27.9,vis:7,balL:34,balR:31,grip:31,hr:115,aerobic:45,strengthDays:0,healthyChoices:2,sedentary:10,readiness:"Contemplation"}];
 clearParticipants();samples.forEach(createParticipantRow);
}
