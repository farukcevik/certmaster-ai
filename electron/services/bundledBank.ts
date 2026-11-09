import { existsSync, readFileSync } from 'node:fs';
import { AppDatabase } from '../database/index.js';
import { questionInputSchema, type QuestionInput } from '../../shared/contracts.js';

interface BundledQuestionBank {
  questions: Array<Record<string, unknown> & {id?:unknown;options?:unknown}>;
}

export function seedBundledQuestionBank(database:AppDatabase,bankPath:string){
  if(!existsSync(bankPath))return{imported:0,duplicates:0,failed:0,available:false};
  const payload=JSON.parse(readFileSync(bankPath,'utf8')) as BundledQuestionBank;
  if(!Array.isArray(payload.questions))throw new Error('Paketlenmiş soru bankası geçersiz: questions dizisi bulunamadı');
  const inputs:QuestionInput[]=payload.questions.map(raw=>questionInputSchema.parse({
    ...raw,
    id:undefined,
    sourceIdentifier:String(raw.id??''),
    certificationId:'cert-google-pde',
    categoryId:null,
    options:Array.isArray(raw.options)?raw.options.map(option=>({...option as object,id:undefined})):raw.options
  }));
  return{...database.syncQuestionSourceData(inputs),available:true};
}
