export type RandomSource=()=>number;

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
