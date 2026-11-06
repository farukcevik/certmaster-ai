import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {AppDatabase} from '../database/index.js';
import {seedBundledQuestionBank} from '../services/bundledBank.js';

const [bankArgument,databaseArgument]=process.argv.slice(2);
if(!bankArgument||!databaseArgument){
  console.error('Usage: seedPdeFromJson <question-bank.json> <database.sqlite>');
  process.exit(2);
}

const bankPath=resolve(bankArgument),databasePath=resolve(databaseArgument);
JSON.parse(readFileSync(bankPath,'utf8'));
const database=new AppDatabase(databasePath);
try{
  const result=seedBundledQuestionBank(database,bankPath);
  const questionCount=database.listQuestions({certificationId:'cert-google-pde'}).length;
  if(questionCount!==349)throw new Error(`Expected 349 questions, found ${questionCount}`);
  console.log(JSON.stringify({...result,questionCount,databasePath},null,2));
}finally{
  database.close();
}
