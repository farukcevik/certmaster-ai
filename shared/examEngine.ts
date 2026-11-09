export type RandomSource=()=>number;

export interface QuestionGroup {start:number;end:number;count:number;label:string}

export function questionNumber(identifier:string):number|null{
  const match=identifier.match(/(\d+)$/);if(!match)return null;
  const value=Number(match[1]);return Number.isInteger(value)&&value>0?value:null;
}

export function normalizeQuestionRange(total:number,start?:number,end?:number){
  const safeTotal=Math.max(0,Math.floor(total));
  const safeStart=Math.max(1,Math.min(safeTotal||1,Math.floor(start??1)));
  const safeEnd=Math.max(safeStart,Math.min(safeTotal||safeStart,Math.floor(end??(safeTotal||safeStart))));
  return{start:safeStart,end:safeEnd,count:safeEnd-safeStart+1};
}

export function questionGroups(total:number,size:number):QuestionGroup[]{
  const safeSize=[10,20,25,50].includes(size)?size:20,result:QuestionGroup[]=[];
  for(let start=1;start<=total;start+=safeSize){const end=Math.min(total,start+safeSize-1);result.push({start,end,count:end-start+1,label:`${start}-${end}`})}
  return result;
}

export function withinQuestionRange(identifier:string,start?:number,end?:number):boolean{
  if(start===undefined&&end===undefined)return true;
  const number=questionNumber(identifier);return number!==null&&number>=(start??1)&&number<=(end??Number.MAX_SAFE_INTEGER);
}

export function shuffled<T>(items:readonly T[],random:RandomSource=Math.random):T[]{
  const result=[...items];
  for(let index=result.length-1;index>0;index--){
    const target=Math.floor(random()*(index+1));
    [result[index],result[target]]=[result[target],result[index]];
  }
  return result;
}

export function shuffledDifferentFrom<T>(items:readonly T[],previous:readonly T[]=[],random:RandomSource=Math.random):T[]{
  const result=shuffled(items,random);
  if(result.length>1&&result.length===previous.length&&result.every((value,index)=>value===previous[index])){
    return [...result.slice(1),result[0]];
  }
  return result;
}

export function sameAnswer(selected:readonly string[],correct:readonly string[]):boolean{
  if(selected.length!==correct.length)return false;
  const selectedSet=new Set(selected);
  return correct.every(identifier=>selectedSet.has(identifier));
}

export function calculateScore(results:readonly boolean[]):number{
  if(results.length===0)return 0;
  return Math.round(results.filter(Boolean).length/results.length*1000)/10;
}

export function remainingAt(remainingSeconds:number,savedAt:string,now=Date.now(),running=true):number{
  if(!running)return Math.max(0,remainingSeconds);
  const elapsed=Math.max(0,Math.floor((now-new Date(savedAt).getTime())/1000));
  return Math.max(0,remainingSeconds-elapsed);
}
