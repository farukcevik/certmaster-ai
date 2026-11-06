import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import Papa from 'papaparse';
import type { ImportPreview } from '../../shared/contracts.js';
import { adaptProfessionalDataEngineerPdf } from './pdeAdapter.js';

type PreviewQuestion=ImportPreview['questions'][number];
const labels='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const normalizeType=(value:unknown,correctCount:number):PreviewQuestion['type']=>{const v=String(value??'').toLowerCase();if(v.includes('true')||v.includes('doğru'))return'true_false';if(v.includes('scenario')||v.includes('senaryo'))return'scenario';if(v.includes('image')||v.includes('görsel'))return'image';if(v.includes('multi')||correctCount>1)return'multiple';return'single'};
const bool=(value:unknown)=>['1','true','yes','evet','x'].includes(String(value).trim().toLowerCase());

function mapRecord(record:any,row:number):PreviewQuestion{
  const warnings:string[]=[]; const text=String(record.originalText??record.question??record.soru??record.text??'').trim();
  let rawOptions:any[]=Array.isArray(record.options)?record.options:[];
  if(!rawOptions.length)rawOptions=labels.map(label=>record[`option${label}`]??record[label]??record[label.toLowerCase()]).filter(Boolean).map((text,i)=>({label:labels[i],text}));
  const rawCorrect=record.correctAnswers??record.correctAnswer??record.correct??record.answer??record.dogruCevap??[];const correctLabels=(Array.isArray(rawCorrect)?rawCorrect:String(rawCorrect).split(/[,;|\s]+/)).map(x=>String(x).trim().toUpperCase()).filter(Boolean);
  const options=rawOptions.map((o:any,i)=>{const label=String(o.label??labels[i]).toUpperCase();return{id:o.id,label,text:String(o.text??o.value??o),isCorrect:o.isCorrect===true||bool(o.isCorrect)||correctLabels.includes(label),sortOrder:i}});
  if(!text)warnings.push(`Satır ${row}: soru metni eksik`);if(options.length<2)warnings.push('En az iki seçenek gerekli');if(!options.some(x=>x.isCorrect))warnings.push('Doğru cevap bulunamadı; manuel inceleme gerekli');
  return {externalId:String(record.id??record.number??row),originalLanguage:String(record.originalLanguage??record.language??'en').toLowerCase()==='tr'?'tr':'en',originalText:text,rawText:String(record.rawText??text),structuredContent:record.structuredContent??null,explanation:String(record.explanation??record.aciklama??''),categoryId:null,difficulty:['easy','medium','hard'].includes(record.difficulty)?record.difficulty:'medium',sourceInfo:String(record.sourceInfo??''),reviewStatus:options.some(x=>x.isCorrect)?record.reviewStatus??'ready':'needs_review',tags:Array.isArray(record.tags)?record.tags:String(record.tags??'').split(',').map((x:string)=>x.trim()).filter(Boolean),type:normalizeType(record.type,options.filter(x=>x.isCorrect).length),options,warnings};
}
function parseText(text:string):ImportPreview{
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const starts:number[]=[];lines.forEach((l,i)=>{if(/^(?:question\s*)?\d+[\).:-]\s+/i.test(l))starts.push(i)});const questions:PreviewQuestion[]=[];
  starts.forEach((start,idx)=>{const block=lines.slice(start,starts[idx+1]??lines.length);const first=block[0].replace(/^(?:question\s*)?\d+[\).:-]\s*/i,'');const optionStart=block.findIndex(x=>/^[A-H][\).:-]\s+/.test(x));if(optionStart<0)return;const optionLines=block.slice(optionStart).filter(x=>/^[A-H][\).:-]\s+/.test(x));const answerLine=block.find(x=>/^(answer|correct answer|cevap|doğru cevap)\s*[:.-]/i.test(x));const correct=(answerLine?.split(/[:.-]/).slice(1).join(':').match(/[A-H]/gi)??[]).map(x=>x.toUpperCase());const expIndex=block.findIndex(x=>/^(explanation|açıklama)\s*[:.-]/i.test(x));const record={question:first,options:optionLines.map(x=>({label:x[0],text:x.slice(2).trim()})),correctAnswer:correct,explanation:expIndex>=0?block.slice(expIndex).join(' ').replace(/^(explanation|açıklama)\s*[:.-]\s*/i,''):''};questions.push(mapRecord(record,idx+1))});
  return {questions,errors:questions.length?[]:[{row:0,message:'Soru sınırları ve seçenekler güvenilir biçimde algılanamadı'}],sourceTextLength:text.length};
}
export async function previewImport(filePath:string):Promise<ImportPreview>{
  const ext=extname(filePath).toLowerCase();
  if(ext==='.json'){const data=JSON.parse(await readFile(filePath,'utf8'));const rows=Array.isArray(data)?data:data.questions;if(!Array.isArray(rows))throw new Error('JSON dosyasında questions dizisi bulunamadı');return{questions:rows.map(mapRecord),errors:[]}}
  if(ext==='.csv'){const parsed=Papa.parse<Record<string,string>>(await readFile(filePath,'utf8'),{header:true,skipEmptyLines:true});return{questions:parsed.data.map(mapRecord),errors:parsed.errors.map(e=>({row:e.row??0,message:e.message}))}}
  if(ext==='.pdf'){
    const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const bytes=new Uint8Array(await readFile(filePath));const doc=await pdfjs.getDocument({data:bytes,useWorkerFetch:false,useSystemFonts:true}).promise;let text='';for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p);const content=await page.getTextContent();text+=(content.items as Array<{str?:string}>).map(i=>i.str??'').join(' ')+'\n'}const result=parseText(text);result.requiresOcr=text.replace(/\s/g,'').length<Math.max(100,doc.numPages*40);if(result.requiresOcr)result.errors.push({row:0,message:'PDF metin katmanı yetersiz. Bu dosya taranmış olabilir ve OCR gerektirir.'});return result;
  }
  throw new Error('Desteklenmeyen dosya biçimi');
}

export { adaptProfessionalDataEngineerPdf };
