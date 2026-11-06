import { readFile } from 'node:fs/promises';
import type { ContentBlock, ImportPreview, QuestionContentDocument } from '../../shared/contracts.js';

type PreviewQuestion=ImportPreview['questions'][number];
export interface LayoutLine {page:number;y:number;x:number;fontSize:number;fontName:string;text:string}
export interface FormattingRecord {sourceIdentifier:string;rawText:string;structuredContent:QuestionContentDocument;stats:{caseStudy:boolean;codeBlocks:number;tables:number;imageNotices:number}}
export interface PdeAdapterResult extends ImportPreview {totalFound:number;manualReviewCount:number;integrityErrors:string[];formatting:FormattingRecord[]}

const cleanSpace=(value:string)=>value.replace(/\s+/g,' ').trim();
const stableId=(number:number)=>`GCP-PDE-${String(number).padStart(3,'0')}`;
const chrome=/Google - Professional Data Engineer Practice Questions - SecExams\.com|SecExams - Focus Only on What's Needed to Pass!|Page \d+ of \d+/i;
const knownHeadings=/^(Company Overview|Company Background|Solution Concept|Existing Technical Environment|Business Requirements|Technical Requirements|C(?:E|T|F)O Statement|SEO Statement)\s*-?$/i;
const codeStart=/^(SELECT|WITH|CREATE|ALTER|INSERT|UPDATE|DELETE|MERGE|FROM|WHERE|GROUP BY|ORDER BY|HAVING|bq\s|gsutil\s|gcloud\s|kubectl\s|curl\s|\{|\[|apiVersion:|kind:|resources:)/i;
const visualQuestionNumbers=new Set([63,243,248]);

function joinFragments(items:Array<{str:string;x:number;width:number}>){
  return items.sort((a,b)=>a.x-b.x).reduce((out,item,index)=>{
    if(!index)return item.str;
    const previous=items[index-1];const gap=item.x-(previous.x+previous.width);
    return out+(gap>1.5&&!/^\s*[.,;:!?%)\]}]/.test(item.str)?' ':'')+item.str;
  },'').trim();
}

function pageLines(items:Array<{str?:string;transform?:number[];width?:number;fontName?:string}>,page:number):LayoutLine[]{
  const groups:Array<{y:number;parts:Array<{str:string;x:number;width:number;fontSize:number;fontName:string}>}>=[];
  for(const item of items){if(!item.str?.trim()||!item.transform)continue;const x=Number(item.transform[4]),y=Number(item.transform[5]),fontSize=Math.abs(Number(item.transform[3]||item.transform[0]||0));let group=groups.find(g=>Math.abs(g.y-y)<=1.5);if(!group){group={y,parts:[]};groups.push(group)}group.parts.push({str:item.str,x,width:Number(item.width??0),fontSize,fontName:item.fontName??''})}
  return groups.sort((a,b)=>b.y-a.y).map(group=>{const first=group.parts[0];return{page,y:group.y,x:Math.min(...group.parts.map(p=>p.x)),fontSize:Math.max(...group.parts.map(p=>p.fontSize)),fontName:first.fontName,text:joinFragments(group.parts)}}).filter(line=>line.y>=35&&line.y<=785&&!chrome.test(line.text)&&!/^\d{1,3}$/.test(line.text));
}

export async function adaptProfessionalDataEngineerPdf(filePath:string):Promise<PdeAdapterResult>{
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const bytes=new Uint8Array(await readFile(filePath));
  const doc=await pdfjs.getDocument({data:bytes,useWorkerFetch:false,useSystemFonts:true}).promise;
  const allLines:LayoutLine[]=[],imageQuestionPages=new Map<number,number[]>();let currentQuestion=0;
  for(let pageNumber=1;pageNumber<=doc.numPages;pageNumber++){
    const page=await doc.getPage(pageNumber);const content=await page.getTextContent();const lines=pageLines(content.items as any,pageNumber);
    const ops=await page.getOperatorList();let contentImages=0;
    ops.fnArray.forEach((fn,index)=>{if(fn===pdfjs.OPS.paintImageXObject||fn===pdfjs.OPS.paintInlineImageXObject){const args=ops.argsArray[index] as unknown[];const width=Number(args?.[1]??0),height=Number(args?.[2]??0);if(width>250&&height>100)contentImages++}});
    const headings=lines.flatMap(line=>[...line.text.matchAll(/\bQuestion\s+#(\d+)\b/g)].map(m=>Number(m[1]))).filter(n=>n>=1&&n<=349);
    if(contentImages>0){const owners=headings.length?headings:currentQuestion?[currentQuestion]:[];for(const owner of owners)imageQuestionPages.set(owner,[...(imageQuestionPages.get(owner)??[]),pageNumber])}if(headings.length)currentQuestion=headings.at(-1)!;
    if(pageNumber>=14)allLines.push(...lines);
  }
  const boundaries=allLines.map((line,index)=>({line,index,match:line.text.match(/^Question\s+#(\d+)\s*$/i)})).filter(x=>x.match&&Number(x.match[1])>=1&&Number(x.match[1])<=349);
  const questions:PreviewQuestion[]=[],formatting:FormattingRecord[]=[],integrityErrors:string[]=[];
  for(let index=0;index<boundaries.length;index++){
    const number=Number(boundaries[index].match![1]);if(questions.some(q=>q.externalId===stableId(number)))continue;
    const lines=allLines.slice(boundaries[index].index+1,boundaries[index+1]?.index??allLines.length);
    const pageMarkers=new Set<number>();const parseParts:string[]=[];for(const line of lines){if(!pageMarkers.has(line.page)){parseParts.push(`[[CM_PAGE_${line.page}_IMAGES_${(imageQuestionPages.get(number)??[]).includes(line.page)?1:0}]]`);pageMarkers.add(line.page)}parseParts.push(line.text)}
    const parsed=parseBlock(parseParts.join(' '),number,imageQuestionPages.get(number)??[]);questions.push(parsed);
    const recovered=recoverQuestionContent(lines,visualQuestionNumbers.has(number)?imageQuestionPages.get(number)??[]:[]);formatting.push({sourceIdentifier:stableId(number),...recovered});
  }
  questions.sort((a,b)=>Number(a.externalId?.slice(-3))-Number(b.externalId?.slice(-3)));formatting.sort((a,b)=>a.sourceIdentifier.localeCompare(b.sourceIdentifier));
  const found=new Set(questions.map(q=>q.externalId));for(let n=1;n<=349;n++)if(!found.has(stableId(n)))integrityErrors.push(`Question #${n} was not found`);
  for(const q of questions){if(!q.originalText)integrityErrors.push(`${q.externalId}: missing question text`);if(q.options.length<2)integrityErrors.push(`${q.externalId}: fewer than two options`);if(q.options.some(o=>!o.text.trim()))integrityErrors.push(`${q.externalId}: empty option content`);if(!q.options.some(o=>o.isCorrect))integrityErrors.push(`${q.externalId}: no correct answer`);const labels=q.options.map(o=>o.label);if(new Set(labels).size!==labels.length)integrityErrors.push(`${q.externalId}: duplicate option labels`)}
  return{questions,formatting,errors:integrityErrors.map((message,row)=>({row:row+1,message})),totalFound:questions.length,manualReviewCount:questions.filter(q=>q.reviewStatus==='needs_review').length,integrityErrors,sourceTextLength:allLines.reduce((n,l)=>n+l.text.length,0)};
}

export function parsePdeQuestionBlock(raw:string,number:number,imagePages:number[]=[]){return parseBlock(raw,number,imagePages)}
function parseBlock(raw:string,number:number,imagePages:number[]):PreviewQuestion{
  const warnings:string[]=[];const pages=[...raw.matchAll(/\[\[CM_PAGE_(\d+)_IMAGES_(\d+)\]\]/g)].map(m=>({page:Number(m[1]),images:Number(m[2])}));
  const block=cleanSpace(raw.replace(/\[\[CM_PAGE_\d+_IMAGES_\d+\]\]/g,' '));const explanationAt=block.search(/\bExplanation\b/i);const core=explanationAt>=0?block.slice(0,explanationAt):block;const firstOption=core.search(/(?:^|\s)A\)\s/);let questionText=firstOption>=0?core.slice(0,firstOption):core;questionText=cleanSpace(questionText);
  const optionsPart=firstOption>=0?core.slice(firstOption):'';const optionMatches=[...optionsPart.matchAll(/(?:^|\s)([A-H])\)\s/g)];let options=optionMatches.map((match,index)=>{const start=(match.index??0)+match[0].length,end=optionMatches[index+1]?.index??optionsPart.length;const original=cleanSpace(optionsPart.slice(start,end));const flagged=/\(Correct Answer\)/i.test(original);return{label:match[1],text:cleanSpace(original.replace(/\(Correct Answer\)/gi,' ')),isCorrect:flagged,sortOrder:index}});
  const afterExplanation=explanationAt>=0?block.slice(explanationAt+'Explanation'.length):'';const discussionAt=afterExplanation.search(/\bCommunity Discussion\b/i);let explanation=cleanSpace(discussionAt>=0?afterExplanation.slice(0,discussionAt):afterExplanation);
  const declared=explanation.match(/Correct Answer:\s*([A-H](?:\s*[,;+&]\s*[A-H])*)/i)?.[1]?.match(/[A-H]/gi)?.map(x=>x.toUpperCase())??[];for(const option of options)if(declared.includes(option.label))option.isCorrect=true;
  explanation=cleanSpace(explanation.replace(/Correct Answer:\s*[A-H](?:\s*[,;+&]\s*[A-H])*/i,' '));
  const imageOptionGap=options.some(o=>!o.text)||options.some(o=>/^[A-H]\)\s*\d+$/.test(o.text));if(imageOptionGap){const correct=new Set([...declared,...options.filter(o=>o.isCorrect).map(o=>o.label)]);options=['A','B','C','D'].map((label,index)=>({label,text:`[Embedded image option ${label} — manual review required]`,isCorrect:correct.has(label),sortOrder:index}));warnings.push('Answer options are embedded images and could not be represented by the PDF text layer')}
  if(!questionText)warnings.push('Question text is missing');if(options.length<2)warnings.push('Fewer than two answer options were extracted');if(!options.some(o=>o.isCorrect))warnings.push('Correct answer could not be identified');if(imagePages.length&&visualQuestionNumbers.has(number))warnings.push(`Source pages contain required question images (${imagePages.join(', ')})`);if(/\b(the exhibit|diagram|shown below|following figure|graphic below|sample records)\b/i.test(questionText))warnings.push('Question text references required visual source content');if(!explanation)warnings.push('Source explanation is empty');
  return{externalId:stableId(number),originalLanguage:'en',originalText:questionText,explanation,categoryId:null,difficulty:'medium',sourceInfo:`professional-data-engineer.pdf; Question #${number}; pages ${pages.map(p=>p.page).filter((v,i,a)=>a.indexOf(v)===i).join(',')}`,reviewStatus:warnings.some(w=>/missing|Fewer|could not|images|visual/i.test(w))?'needs_review':'ready',tags:['Google Cloud','Professional Data Engineer'],type:imageOptionGap?'image':options.filter(o=>o.isCorrect).length>1?'multiple':'single',options,warnings};
}

function contentLines(lines:LayoutLine[]){const explanation=lines.findIndex(l=>/^Explanation\b/i.test(l.text));const end=explanation>=0?explanation:lines.length;const option=lines.findIndex((l,i)=>i<end&&/^A\)\s*/.test(l.text));return lines.slice(0,option>=0?option:end)}
function isCasePrompt(text:string){return /^(You (?:need|want|are|have)|Flowlogistic(?:'s| management)|MJTelco(?:'s| management)|Which |What |How )/i.test(text)}
function languageForCode(text:string){if(/^\s*(SELECT|WITH|CREATE|ALTER|INSERT|UPDATE|DELETE|MERGE|FROM|WHERE)/i.test(text))return'sql';if(/^\s*[\[{]/.test(text))return'json';if(/^(apiVersion:|kind:|resources:)/i.test(text))return'yaml';return'shell'}

/** Converts positioned PDF lines to safe display blocks without changing source wording. */
export function recoverQuestionContent(input:LayoutLine[],imagePages:number[]=[]):Omit<FormattingRecord,'sourceIdentifier'>{
  const lines=contentLines(input);const rawText=lines.map((line,index)=>`${index&&line.page!==lines[index-1].page?'\n':''}${line.text}`).join('\n').trim();
  const caseTitleIndex=lines.findIndex(l=>/Case Study\s*-?$/i.test(l.text));let promptStart=0;
  if(caseTitleIndex>=0){const lastStatement=Math.max(...lines.map((l,i)=>knownHeadings.test(l.text)?i:-1));promptStart=lines.findIndex((l,i)=>i>Math.max(caseTitleIndex,lastStatement)&&isCasePrompt(l.text));if(promptStart<0)promptStart=Math.max(caseTitleIndex+1,lines.length-1)}
  const caseLines=caseTitleIndex>=0?lines.slice(caseTitleIndex+1,promptStart):[];const promptLines=caseTitleIndex>=0?lines.slice(promptStart):lines;
  const caseStudyTitle=caseTitleIndex>=0?cleanSpace(lines[caseTitleIndex].text.replace(/\s*-\s*$/,'')):undefined;
  const caseStudyBlocks=buildBlocks(caseLines);const promptBlocks=buildBlocks(promptLines);
  if(imagePages.length)promptBlocks.unshift({type:'image_notice',text:'Bu soru kaynak PDF’de gerekli bir görsel içeriyor.',page:imagePages[0]});
  const blocks=[...caseStudyBlocks,...promptBlocks];return{rawText,structuredContent:{version:1,...(caseStudyTitle?{caseStudyTitle}:{}),caseStudyBlocks,promptBlocks},stats:{caseStudy:Boolean(caseStudyTitle),codeBlocks:blocks.filter(b=>b.type==='code').length,tables:blocks.filter(b=>b.type==='table').length,imageNotices:blocks.filter(b=>b.type==='image_notice').length}};
}

function buildBlocks(lines:LayoutLine[]):ContentBlock[]{
  const blocks:ContentBlock[]=[];let paragraph:string[]=[];let listItems:Array<{text:string;level:number}>=[];let code:string[]=[];
  const flushParagraph=()=>{if(paragraph.length){blocks.push({type:'paragraph',text:cleanSpace(paragraph.join(' '))});paragraph=[]}};
  const flushList=()=>{if(listItems.length){blocks.push({type:'list',ordered:false,items:listItems});listItems=[]}};
  const flushCode=()=>{if(code.length){blocks.push({type:'code',language:languageForCode(code[0]),text:code.join('\n')});code=[]}};
  const flush=()=>{flushParagraph();flushList();flushCode()};
  for(let i=0;i<lines.length;i++){
    const line=lines[i],text=line.text.trim();if(!text)continue;
    if(knownHeadings.test(text)){flush();blocks.push({type:'heading',level:2,text:text.replace(/\s*-\s*$/,'')});continue}
    const bullet=text.match(/^(✑|[•●▪])\s*(.*)$/);const nested=text.match(/^[-–]\s+(.*)$/);
    if(bullet||nested){flushParagraph();flushCode();listItems.push({text:cleanSpace((bullet?.[2]??nested?.[1])||''),level:nested?1:0});continue}
    if(listItems.length){const previous=lines[i-1];const continuation=line.x>previous.x+8||/^[a-z(]/.test(text);if(continuation){listItems[listItems.length-1].text=cleanSpace(`${listItems[listItems.length-1].text} ${text}`);continue}flushList()}
    if(code.length){const previous=lines[i-1];if(codeStart.test(text)||line.x>=previous.x-2&&line.x<=previous.x+14&&!/[?.]$/.test(text)){code.push(text);continue}flushCode()}
    if(codeStart.test(text)){flushParagraph();flushList();code.push(text);continue}
    const previous=lines[i-1];const verticalGap=previous&&previous.page===line.page?previous.y-line.y:0;
    if(paragraph.length&&(verticalGap>24||isCasePrompt(text))){flushParagraph()}
    paragraph.push(text);
  }
  flush();return blocks;
}
