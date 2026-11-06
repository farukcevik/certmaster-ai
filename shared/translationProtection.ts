export interface ProtectedText { text:string; tokens:string[]; restore:(translated:string)=>string; validate:(translated:string)=>string[] }
export function protectTechnicalContent(source:string,protectedTerms:string[]):ProtectedText{
  let text=source;const replacements=new Map<string,string>();let index=0;
  const replace=(pattern:RegExp)=>{text=text.replace(pattern,value=>{const token=`__CM_${index++}__`;replacements.set(token,value);return token})};
  [/```[\s\S]*?```/g,/`[^`]+`/g,/https?:\/\/\S+/g,/(?:\/[\w.-]+){2,}/g,/\b\d+(?:\.\d+)?%?\b/g].forEach(replace);
  for(const term of protectedTerms.sort((a,b)=>b.length-a.length)){const pattern=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');replace(pattern)}
  const tokens=[...replacements.keys()];return{text,tokens,restore(translated){let result=translated;for(const [token,original] of replacements)result=result.replaceAll(token,original);return result},validate(translated){return tokens.filter(token=>!translated.includes(token)).map(token=>`Korunan bölüm eksik: ${token}`)}};
}
