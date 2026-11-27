/** Analysis responsibility: summaries, configured flags, lifestyle and readiness models. */
import {formatNumber} from "./utils.js";
export const numericValues=(records,key)=>records.map(r=>r[key]).filter(v=>typeof v==="number"&&Number.isFinite(v));
export const average=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
export function metric(records,label,key,unit,digits=1){
 const values=numericValues(records,key);return {label,mean:average(values),n:values.length,unit,digits};
}
export function thresholdResult(records,key,cutoff,above=true){
 if(cutoff===""||cutoff==null)return null;
 const values=numericValues(records,key),matched=values.filter(v=>above?v>Number(cutoff):v<Number(cutoff)).length;
 return {count:matched,n:values.length,percent:values.length?Math.round(matched/values.length*100):0};
}
export const readinessStages=["Precontemplation","Contemplation","Preparation","Action","Maintenance"];
export function analyseReadiness(records){
 const counts=Object.fromEntries(readinessStages.map(s=>[s,0]));
 records.forEach(r=>{const stage=readinessStages.find(s=>(r.readiness||"").trim().toLowerCase()===s.toLowerCase());if(stage)counts[stage]++});
 const n=Object.values(counts).reduce((sum,v)=>sum+v,0);
 return {counts,n,percentages:Object.fromEntries(readinessStages.map(s=>[s,n?counts[s]/n*100:null]))};
}
export const lifestyleDefinitions=[
 {label:"Aerobic activity (min/week)",key:"aerobic",indicator:"≥150 min/week",meets:v=>v>=150},
 {label:"Strength training (days/week)",key:"strengthDays",indicator:"≥2 days/week",meets:v=>v>=2},
 {label:"Healthier food/beverage choices (times/week)",key:"healthyChoices",indicator:"≥5 times/week",meets:v=>v>=5},
 {label:"Sedentary behaviour (hours/day)",key:"sedentary",indicator:"≤8 hours/day",meets:v=>v<=8}
];
export function analyseLifestyle(records){
 return lifestyleDefinitions.map(def=>{
  const values=numericValues(records,def.key),met=values.filter(def.meets).length;
  return {...def,mean:average(values),n:values.length,met,percent:values.length?met/values.length*100:null};
 });
}
export function demographics(records,key){
 const counts={};records.forEach(r=>{if(r[key])counts[r[key]]=(counts[r[key]]||0)+1});return counts;
}
export function assessmentModel(records,cutoffs){
 const body=[metric(records,"Body mass index (BMI)","bmi","kg/m²"),metric(records,"Percentage body fat","fat","%"),metric(records,"Skeletal muscle mass","smm","kg"),metric(records,"Visceral fat level","vis","level")];
 const fitness=[metric(records,"Single-leg balance — left","balL","sec"),metric(records,"Single-leg balance — right","balR","sec"),{
  label:"Bilateral balance mean",mean:average(records.filter(r=>r.balL!=null&&r.balR!=null).map(r=>(r.balL+r.balR)/2)),
  n:records.filter(r=>r.balL!=null&&r.balR!=null).length,unit:"sec",digits:1
 },metric(records,"Hand grip strength","grip","kg"),metric(records,"3-minute step recovery heart rate","hr","bpm",0)];
 const flagDefinitions=[["fat","fatCut",true,"Body fat"],["vis","visCut",true,"Visceral fat level"],["balL","balCut",false,"Left balance"],["balR","balCut",false,"Right balance"],["grip","gripCut",false,"Hand grip"],["hr","hrCut",true,"Step recovery HR"]];
 const flags=flagDefinitions.flatMap(([key,cut,above,label])=>{const result=thresholdResult(records,key,cutoffs[cut],above);return result?[{label,...result}]:[]});
 return {body,fitness,flags,lifestyle:analyseLifestyle(records),readiness:analyseReadiness(records)};
}
export {formatNumber};
