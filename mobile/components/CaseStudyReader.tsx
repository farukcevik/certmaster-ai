import {X} from 'lucide-react';
import type {MobileQuestion} from '../models';
import {ContentBlocks} from './QuestionContent';

export function CaseStudyReader({question,onClose,onImage}:{question:MobileQuestion;onClose:()=>void;onImage:(url:string,alt:string)=>void}){const document=question.structuredContent;if(!document?.caseStudyBlocks.length)return null;return <section className="case-reader" role="dialog" aria-modal="true"><header><div><span>Vaka Çalışması</span><h1>{document.caseStudyTitle??'Case Study'}</h1></div><button onClick={onClose} aria-label="Kapat"><X/></button></header><article><ContentBlocks blocks={document.caseStudyBlocks} onImage={onImage}/></article></section>}
