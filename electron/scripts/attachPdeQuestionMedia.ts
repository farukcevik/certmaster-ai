import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {AppDatabase} from '../database/index.js';
import {questionContentDocumentSchema,type QuestionContentDocument} from '../../shared/contracts.js';

const databaseArg=process.argv[2];
if(!databaseArg){console.error('Usage: attachPdeQuestionMedia <database.sqlite> [asset-directory]');process.exit(2)}
const database=resolve(databaseArg),assetDirectory=resolve(process.argv[3]??'question-banks/assets/gcp-pde');
const media=[
  {id:'GCP-PDE-063',file:'GCP-PDE-063-graphic.png',altText:'X ve Y eksenlerinde iki sınıfı gösteren dağılım grafiği',caption:'Sınıflandırma grafiği',sourcePage:122},
  {id:'GCP-PDE-243',file:'GCP-PDE-243-options.png',altText:'A, B, C ve D seçeneklerine ait dört BigQuery SQL sorgusu',caption:'SQL cevap seçenekleri',sourcePage:381},
  {id:'GCP-PDE-248',file:'GCP-PDE-248-table.png',altText:'dataset.inventory_vm örnek kayıtlarını gösteren BigQuery tablosu',caption:'dataset.inventory_vm örnek kayıtları',sourcePage:388}
] as const;
const sqlOptions:Record<string,string>={
  A:'SELECT * EXCEPT(feature1),\n  IFNULL(feature1, 0) AS feature1_cleaned\nFROM training_data;',
  B:'SELECT * EXCEPT(price, square_feet),\n  price/square_feet AS price_per_sqft\nFROM training_data\nWHERE feature1 IS NOT NULL;',
  C:'SELECT * EXCEPT(price, square_feet, feature1),\n  price/square_feet AS price_per_sqft,\n  IFNULL(feature1, 0) AS feature1_cleaned\nFROM training_data;',
  D:'SELECT *\nFROM training_data\nWHERE feature1 IS NOT NULL;'
};

const db=new AppDatabase(database);
try{
  const backup=resolve(dirname(database),`certmaster-before-question-media-${new Date().toISOString().replace(/[:.]/g,'-')}.db`);db.backup(backup);
  const beforeCorrect=db.db.prepare(`SELECT q.source_identifier id,qo.label FROM question_options qo JOIN questions q ON q.id=qo.question_id WHERE q.certification_id='cert-google-pde' AND qo.is_correct=1 ORDER BY q.source_identifier,qo.label`).all();
  let attached=0,repairedOptions=0,removedPageNumbers=0;
  db.db.transaction(()=>{
    for(const item of media){
      const row=db.db.prepare(`SELECT structured_content_json content FROM questions WHERE certification_id='cert-google-pde' AND source_identifier=?`).get(item.id) as {content:string|null}|undefined;if(!row)throw new Error(`${item.id} not found`);
      const document:QuestionContentDocument=questionContentDocumentSchema.parse(JSON.parse(row.content??'null'));
      document.promptBlocks=document.promptBlocks.filter(block=>block.type!=='image'&&block.type!=='image_notice');
      const dataUrl=`data:image/png;base64,${readFileSync(resolve(assetDirectory,item.file)).toString('base64')}`;
      document.promptBlocks.unshift({type:'image',dataUrl,altText:item.altText,caption:item.caption,sourcePage:item.sourcePage});
      attached+=db.db.prepare(`UPDATE questions SET structured_content_json=?,formatting_version=2,review_status=CASE WHEN review_status='needs_review' THEN 'ready' ELSE review_status END,updated_at=CURRENT_TIMESTAMP WHERE certification_id='cert-google-pde' AND source_identifier=?`).run(JSON.stringify(document),item.id).changes;
    }
    const bank=JSON.parse(readFileSync(resolve('question-banks/GCP_PDE_349_questions.json'),'utf8')) as {questions:Array<{id:string;options:Array<{label:string;text:string}>}>};
    for(const source of bank.questions){const row=db.db.prepare(`SELECT id FROM questions WHERE certification_id='cert-google-pde' AND source_identifier=?`).get(source.id) as {id:string}|undefined;if(!row)continue;for(const expected of source.options){const current=db.db.prepare(`SELECT id,text FROM question_options WHERE question_id=? AND label=?`).get(row.id,expected.label) as {id:string;text:string}|undefined;if(current&&current.text!==expected.text&&current.text.replace(/\s+\d{1,3}\s*$/,'').trim()===expected.text.trim())removedPageNumbers+=db.db.prepare('UPDATE question_options SET text=? WHERE id=?').run(expected.text,current.id).changes}}
    db.db.prepare(`UPDATE questions SET review_status=CASE WHEN review_status='needs_review' THEN 'ready' ELSE review_status END,updated_at=CURRENT_TIMESTAMP WHERE certification_id='cert-google-pde' AND source_identifier='GCP-PDE-077'`).run();
    const q243=db.db.prepare(`SELECT q.id FROM questions q WHERE q.certification_id='cert-google-pde' AND q.source_identifier='GCP-PDE-243'`).get() as {id:string}|undefined;
    if(q243){const update=db.db.prepare(`UPDATE question_options SET text=? WHERE question_id=? AND label=? AND text LIKE '[Embedded image option%'`);for(const [label,text] of Object.entries(sqlOptions))repairedOptions+=update.run(text,q243.id,label).changes}
    db.db.prepare(`UPDATE questions SET review_status='ready',updated_at=CURRENT_TIMESTAMP WHERE certification_id='cert-google-pde' AND source_identifier='GCP-PDE-015' AND review_status='needs_review'`).run();
  })();
  const afterCorrect=db.db.prepare(`SELECT q.source_identifier id,qo.label FROM question_options qo JOIN questions q ON q.id=qo.question_id WHERE q.certification_id='cert-google-pde' AND qo.is_correct=1 ORDER BY q.source_identifier,qo.label`).all();
  if(JSON.stringify(beforeCorrect)!==JSON.stringify(afterCorrect))throw new Error('Correct-answer integrity check failed');
  const integrity=db.integrity();if(!integrity.ok)throw new Error(integrity.message);
  console.log(JSON.stringify({attached,repairedOptions,removedPageNumbers,correctAnswersPreserved:true,integrity,backup},null,2));
}finally{db.close()}
