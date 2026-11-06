import type {ContentBlock} from '../../shared/contracts';
import type {MobileQuestion} from '../models';

function Block({block,onImage}:{block:ContentBlock;onImage:(url:string,alt:string)=>void}){
  if(block.type==='heading'){const Tag=`h${Math.min(block.level+1,4)}` as 'h2';return <Tag className="content-heading">{block.text}</Tag>}
  if(block.type==='paragraph')return <p className="content-paragraph">{block.text}</p>;
  if(block.type==='list'){const Tag=block.ordered?'ol':'ul';return <Tag className="content-list">{block.items.map((item,index)=><li key={index} style={{marginInlineStart:`${item.level*1.1}rem`}}>{item.text}</li>)}</Tag>}
  if(block.type==='code')return <pre className="code-block" aria-label={`${block.language} code`}><code>{block.text}</code></pre>;
  if(block.type==='table')return <div className="table-scroll"><table><thead><tr>{block.headers.map((header,index)=><th key={index}>{header}</th>)}</tr></thead><tbody>{block.rows.map((row,index)=><tr key={index}>{row.map((cell,cellIndex)=><td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
  if(block.type==='image')return <figure className="question-figure"><button className="image-button" onClick={()=>onImage(block.dataUrl,block.altText)} aria-label={`${block.altText} tam ekran göster`}><img src={block.dataUrl} alt={block.altText}/><span>Yakınlaştırmak için dokunun</span></button>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure>;
  return <aside className="image-notice">{block.text}</aside>;
}

export function ContentBlocks({blocks,onImage}:{blocks:ContentBlock[];onImage:(url:string,alt:string)=>void}){return <>{blocks.map((block,index)=><Block key={index} block={block} onImage={onImage}/>)}</>}

export function QuestionPrompt({question,onImage}:{question:MobileQuestion;onImage:(url:string,alt:string)=>void}){
  const blocks=question.structuredContent?.promptBlocks;
  return <div className="question-copy">{blocks?.length?<ContentBlocks blocks={blocks} onImage={onImage}/>:<p className="question-text">{question.originalText}</p>}</div>;
}
