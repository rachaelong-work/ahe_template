/** Shared pure utilities: formatting, safe CSV parsing and file downloads. */
export const $ = (id) => document.getElementById(id);
export const formatNumber = (value, digits = 1) =>
  value == null || !Number.isFinite(Number(value)) ? "Not available" : Number(value).toFixed(digits);

export function parseCSV(text) {
  const rows=[]; let row=[], cell="", quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){cell+='"';i++}
    else if(ch==='"'){quoted=!quoted}
    else if(ch===","&&!quoted){row.push(cell.trim());cell=""}
    else if((ch==="\n"||ch==="\r")&&!quoted){
      if(ch==="\r"&&next==="\n")i++;
      row.push(cell.trim()); if(row.some(v=>v!==""))rows.push(row);
      row=[];cell="";
    } else cell+=ch;
  }
  if(cell!==""||row.length){row.push(cell.trim());if(row.some(v=>v!==""))rows.push(row)}
  return rows;
}
export function downloadFile(filename, content, mimeType) {
  const url=URL.createObjectURL(new Blob([content],{type:mimeType}));
  const link=document.createElement("a");link.href=url;link.download=filename;
  document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
}
export function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
