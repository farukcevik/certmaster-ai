import bank from '../../question-banks/GCP_PDE_349_questions.json';
import {questionInputSchema} from '../../shared/contracts';
import type {MobileQuestion} from '../models';

interface RawQuestion extends Record<string,unknown>{id:string;options:Array<Record<string,unknown>>}

export function loadBundledQuestions():MobileQuestion[]{
  return (bank.questions as RawQuestion[]).map(raw=>{
    const parsed=questionInputSchema.parse({...raw,id:raw.id,sourceIdentifier:raw.id,certificationId:'cert-google-pde',categoryId:null});
    return {
      id:raw.id,
      sourceIdentifier:raw.id,
      certificationId:'cert-google-pde',
      type:parsed.type,
      originalLanguage:parsed.originalLanguage,
      originalText:parsed.originalText,
      rawText:parsed.rawText??parsed.originalText,
      structuredContent:parsed.structuredContent??null,
      explanation:parsed.explanation,
      difficulty:parsed.difficulty,
      tags:parsed.tags,
      reviewStatus:parsed.reviewStatus,
      options:parsed.options.map((option,index)=>({id:option.id??`${raw.id}-${index}`,label:option.label,text:option.text,isCorrect:option.isCorrect,sortOrder:option.sortOrder})),
      translation:null,
      bookmarked:false,
      incorrect:false,
      userExplanation:null
    };
  });
}
