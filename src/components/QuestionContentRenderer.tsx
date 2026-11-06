import type {ContentBlock,QuestionContentDocument} from '@shared/contracts';

interface Props {document?:QuestionContentDocument|null;fallback:string;part?:'all'|'case'|'prompt';className?:string}

export function QuestionContentRenderer({document,fallback,part='all',className=''}:Props){
  if(!document)return <div className={`whitespace-pre-wrap text-lg leading-8 ${className}`}>{fallback}</div>;
  const blocks=part==='case'?document.caseStudyBlocks:part==='prompt'?document.promptBlocks:[...document.caseStudyBlocks,...document.promptBlocks];
  return <article className={`question-content text-[17px] leading-8 text-slate-800 dark:text-slate-100 ${className}`}>
    {part!=='prompt'&&document.caseStudyTitle&&<h1 className="mb-5 border-b border-slate-200 pb-3 text-2xl font-extrabold tracking-tight dark:border-slate-700">{document.caseStudyTitle}</h1>}
    {blocks.map((block,index)=><Block key={`${block.type}-${index}`} block={block}/>) }
  </article>;
}

function Block({block}:{block:ContentBlock}){
  switch(block.type){
    case'heading':return <h2 className="mb-2 mt-7 text-lg font-extrabold text-slate-950 first:mt-0 dark:text-white">{block.text}</h2>;
    case'paragraph':return <p className="mb-4 whitespace-pre-wrap">{block.text}</p>;
    case'list':return <ul className="mb-5 space-y-2">{block.items.map((item,index)=><li key={index} className="relative pl-6" style={{marginLeft:`${item.level*1.25}rem`}}><span aria-hidden className="absolute left-1 text-brand-600">{item.level?'–':'•'}</span>{item.text}</li>)}</ul>;
    case'code':return <pre className="mb-5 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100"><code>{block.text}</code></pre>;
    case'table':return <div className="mb-5 overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr>{block.headers.map((header,index)=><th className="border bg-slate-100 p-2 text-left dark:bg-slate-800" key={index}>{header}</th>)}</tr></thead><tbody>{block.rows.map((row,index)=><tr key={index}>{row.map((cell,cellIndex)=><td className="border p-2 align-top" key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
    case'image':return <figure className="mb-6 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><img className="mx-auto max-h-[620px] max-w-full rounded-lg object-contain" src={block.dataUrl} alt={block.altText}/>{block.caption&&<figcaption className="mt-2 text-center text-xs text-slate-500">{block.caption}{block.sourcePage?` · PDF sayfası ${block.sourcePage}`:''}</figcaption>}</figure>;
    case'image_notice':return <div role="note" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{block.text}{block.page&&<span className="ml-1 opacity-70">(PDF sayfası {block.page})</span>}</div>;
  }
}
