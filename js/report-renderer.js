/** Presentation responsibility: render the report from a prepared assessment model. */
import {$,formatNumber,escapeHTML} from "./utils.js";
import {average,numericValues,demographics,readinessStages} from "./assessment-analysis.js";
function chartBar(label,value,max,unit=""){
 const width=value==null?0:Math.min(100,Math.max(0,value/max*100));
 return `<div class="barline"><span>${escapeHTML(label)}</span><div class="bartrack"><div class="barfill" style="width:${width}%"></div></div><b>${formatNumber(value)}${escapeHTML(unit)}</b></div>`;
}
function summaryTable(metrics){
 return `<table><thead><tr><th>Assessment measure</th><th>Mean</th><th>Valid n</th><th>Unit</th></tr></thead><tbody>${metrics.map(m=>`<tr><td>${escapeHTML(m.label)}</td><td>${formatNumber(m.mean,m.digits)}</td><td>${m.n}</td><td>${escapeHTML(m.unit)}</td></tr>`).join("")}</tbody></table>`;
}
function categoryChart(records,key){
 const values=demographics(records,key),total=Object.values(values).reduce((a,b)=>a+b,0);
 return Object.entries(values).map(([name,count])=>chartBar(name,count,total)).join("")||"No demographic data entered.";
}
function stageDescription(stage){
 return {
 Precontemplation:"Not currently considering change / may not recognise the need",
 Contemplation:"Aware of change and considering it within the next 6 months",
 Preparation:"Preparing or intending to make a change soon",
 Action:"Has started the behaviour and may need support to overcome barriers",
 Maintenance:"Has sustained the behaviour for at least 6 months; can set new goals"
 }[stage];
}
export function renderReport(records,model,meta,cutoffs){
 const n=records.length,company=meta.company||"Organisation";
 $("outCompany").textContent=`${company} | Health & Fitness Report`;
 $("outMeta").textContent=`Assessment: ${meta.programme||"Health & fitness assessment"} · Date: ${meta.date||"Not stated"} · Participants: ${n} · Prepared by: ${meta.author||"Not stated"}`;
 $("aboutOut").textContent=meta.about||`This report presents group-level findings from ${n} participants assessed for body composition, fitness, lifestyle behaviours and readiness to change.`;
 $("overview").textContent=`This report summarises the health and fitness profile of ${n} participants from ${company}. Findings combine body composition, selected fitness indicators, self-reported lifestyle behaviours and readiness-to-change stages to inform corporate wellness planning. ${meta.context?`Organisation context: ${meta.context}`:""}`;
 $("bodyTable").innerHTML=summaryTable(model.body);$("fitnessTable").innerHTML=summaryTable(model.fitness);
 const meanFor=k=>average(numericValues(records,k));
 $("bodyBars").innerHTML=chartBar("Mean BMI",meanFor("bmi"),40)+chartBar("Mean body fat",meanFor("fat"),50,"%")+chartBar("Mean skeletal muscle",meanFor("smm"),100," kg")+chartBar("Mean visceral fat",meanFor("vis"),20);
 $("fitnessBars").innerHTML=chartBar("Left balance",meanFor("balL"),60," s")+chartBar("Right balance",meanFor("balR"),60," s")+chartBar("Hand grip",meanFor("grip"),80," kg")+chartBar("Step recovery HR",meanFor("hr"),200," bpm");
 $("bodyNarrative").textContent=`The group recorded a mean BMI of ${formatNumber(meanFor("bmi"))} kg/m², mean percentage body fat of ${formatNumber(meanFor("fat"))}%, mean skeletal muscle mass of ${formatNumber(meanFor("smm"))} kg and mean visceral fat level of ${formatNumber(meanFor("vis"))}. Body composition measures are complementary; interpret them using the agreed InBody 770 protocol and suitable population-specific references.`;
 $("fitnessIntro").textContent="The fitness battery included single-leg balance, hand grip strength and the 3-minute step test. These assessments provide complementary indicators of postural control, muscular strength and cardiorespiratory response. Compare results only where test setup, instructions, equipment and recovery-heart-rate timing were standardised.";
 $("fitnessNarrative").innerHTML=`<p>Average left and right single-leg balance were ${formatNumber(meanFor("balL"))} and ${formatNumber(meanFor("balR"))} seconds. Mean hand grip strength was ${formatNumber(meanFor("grip"))} kg. Mean post-step recovery heart rate was ${formatNumber(meanFor("hr"),0)} bpm.</p><p>Threshold criteria are configurable. Interpret recovery heart rate only with consistent workload and recovery timing.</p>`;
 $("demoNarrative").textContent=`A total of ${n} participant records were included. Demographic profiles are shown only for optional categories supplied.`;
 $("demoBars").innerHTML=`<div class="subheading">Age group</div>${categoryChart(records,"age")}<div class="subheading">Sex</div>${categoryChart(records,"sex")}<div class="subheading">Designation</div>${categoryChart(records,"designation")}`;
 $("lifestyleIntro").textContent="Lifestyle behaviour findings summarise weekly aerobic activity, weekly muscle-strengthening activity, frequency of healthier food and beverage choices, and daily sedentary behaviour. These measures are self-reported and should be interpreted accordingly.";
 $("lifestyleTable").innerHTML=`<table><thead><tr><th>Behaviour</th><th>Group mean</th><th>Valid n</th><th>Template indicator</th><th>Meeting indicator</th></tr></thead><tbody>${model.lifestyle.map(m=>`<tr><td>${escapeHTML(m.label)}</td><td>${formatNumber(m.mean)}</td><td>${m.n}</td><td>${escapeHTML(m.indicator)}</td><td>${m.percent==null?"Not available":`${m.met} (${formatNumber(m.percent,0)}%)`}</td></tr>`).join("")}</tbody></table>`;
 $("lifestyleBars").innerHTML=model.lifestyle.map(m=>chartBar(m.label,m.percent,100,"%")).join("");
 $("lifestyleNarrative").textContent=model.lifestyle.map(m=>m.n?`${formatNumber(m.percent,0)}% met the template indicator for ${m.label.toLowerCase()} (${m.met}/${m.n}).`:`No valid data were entered for ${m.label.toLowerCase()}.`).join(" ");
 const readiness=model.readiness;
 $("readinessIntro").textContent="Readiness to change is described using the five stages in the AHE report’s Transtheoretical Model.";
 $("readinessTable").innerHTML=`<table><thead><tr><th>Stage</th><th>Participants</th><th>Valid response %</th><th>Stage description</th></tr></thead><tbody>${readinessStages.map(stage=>`<tr><td>${stage}</td><td>${readiness.counts[stage]}</td><td>${readiness.n?formatNumber(readiness.percentages[stage],1)+"%":"—"}</td><td>${stageDescription(stage)}</td></tr>`).join("")}</tbody></table>`;
 $("readinessBars").innerHTML=readinessStages.map(stage=>chartBar(stage,readiness.percentages[stage],100,"%")).join("");
 const cp=readiness.counts.Contemplation+readiness.counts.Preparation,am=readiness.counts.Action+readiness.counts.Maintenance;
 $("readinessNarrative").textContent=readiness.n?`${readiness.n} participants provided a readiness stage. ${formatNumber(cp/readiness.n*100,1)}% were in Contemplation or Preparation; ${formatNumber(am/readiness.n*100,1)}% were in Action or Maintenance. Stage information can help tailor supportive engagement, but should not be treated as a fixed label.`:"No readiness-to-change responses were entered. Add each participant’s selected stage to report the distribution.";
 const findings=model.flags.length?`<ul>${model.flags.map(f=>`<li>${escapeHTML(f.label)}: ${f.count}/${f.n} (${f.percent}%) met the configured attention threshold.</li>`).join("")}</ul>`:"<p>Thresholds were not configured. Descriptive averages are reported without classifying results as normal, poor or high risk.</p>";
 $("execFindings").innerHTML=findings;
 const recommendations=[];
 if(model.flags.some(f=>["Body fat","Visceral fat level"].includes(f.label)&&f.count))recommendations.push("Offer accessible body-composition education and individual health coaching, focusing on sustainable habits rather than weight stigma.");
 if(model.flags.some(f=>["Left balance","Right balance"].includes(f.label)&&f.count))recommendations.push("Prioritise progressive balance, coordination and lower-limb control activities, scaled to participant ability.");
 if(model.flags.some(f=>f.label==="Hand grip"&&f.count))recommendations.push("Include progressive resistance-training opportunities to develop general muscular strength.");
 if(model.flags.some(f=>f.label==="Step recovery HR"&&f.count))recommendations.push("Consider graded aerobic-conditioning opportunities and repeat testing under standardised conditions.");
 if(model.lifestyle.some(m=>m.n&&m.percent<50))recommendations.push("Address lifestyle gaps through practical workplace enablers: movement breaks, accessible strength sessions, healthier choices and reduced prolonged sitting.");
 if(readiness.n&&readiness.counts.Precontemplation)recommendations.push("For Precontemplation, begin with awareness and low-pressure engagement rather than assuming immediate readiness.");
 if(readiness.n&&(readiness.counts.Contemplation+readiness.counts.Preparation))recommendations.push("Support Contemplation and Preparation with goal-setting, action planning, confidence-building and barrier reduction.");
 if(readiness.n&&(readiness.counts.Action+readiness.counts.Maintenance))recommendations.push("Reinforce Action and Maintenance with follow-up, peer support, progress feedback and varied goals.");
 if(!recommendations.length)recommendations.push("Use the group profile to select inclusive wellness activities and confirm data quality and reference criteria before targeted planning.");
 $("recommendations").innerHTML=`<ol>${recommendations.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ol>`;
 $("execRecs").innerHTML=`<ul>${recommendations.slice(0,4).map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>`;
 $("programmeIdeas").innerHTML=`<p><span class="pill">Assessment & check-in</span> Repeat assessments at a planned interval with individual goal-setting support.</p><p><span class="pill">Strength & mobility</span> Offer progressive strength, balance and mobility sessions.</p><p><span class="pill">Cardiorespiratory fitness</span> Provide inclusive aerobic exercise with appropriate progression.</p><p><span class="pill">Lifestyle & behaviour support</span> Match coaching and workplace opportunities to reported behaviours and readiness stage.</p>`;
 return recommendations;
}
