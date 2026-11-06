import {copyFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {adaptProfessionalDataEngineerPdf} from '../services/pdeAdapter.js';
import {AppDatabase} from '../database/index.js';

const [sourceArg,databaseArg,reportArg]=process.argv.slice(2);
if(!sourceArg||!databaseArg){console.error('Usage: reprocessPdeFormatting <source.pdf> <database.sqlite> [report.json]');process.exit(2)}
const source=resolve(sourceArg),database=resolve(databaseArg),report=resolve(reportArg??'reports/pde-formatting-recovery.json');
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const db=new AppDatabase(database);
const snapshot=()=>({
  questions:db.db.prepare(`SELECT id,source_identifier,original_text,explanation,type,review_status FROM questions WHERE certification_id='cert-google-pde' ORDER BY source_identifier`).all(),
  options:db.db.prepare(`SELECT qo.id,qo.question_id,qo.label,qo.text,qo.is_correct,qo.sort_order FROM question_options qo JOIN questions q ON q.id=qo.question_id WHERE q.certification_id='cert-google-pde' ORDER BY qo.question_id,qo.sort_order`).all(),
  userData:{sessions:(db.db.prepare('SELECT COUNT(*) count FROM exam_sessions').get() as any).count,attempts:(db.db.prepare('SELECT COUNT(*) count FROM question_attempts').get() as any).count,bookmarks:(db.db.prepare('SELECT COUNT(*) count FROM bookmarks').get() as any).count,translations:(db.db.prepare('SELECT COUNT(*) count FROM question_translations').get() as any).count}
});
try{
  db.checkpoint();const stamp=new Date().toISOString().replace(/[:.]/g,'-');const backup=resolve(dirname(database),`certmaster-before-formatting-${stamp}.db`);await copyFile(database,backup);
  const before=snapshot(),beforeHash=digest({questions:before.questions,options:before.options,userData:before.userData});const adapted=await adaptProfessionalDataEngineerPdf(source);
  if(adapted.totalFound!==349||adapted.integrityErrors.length||adapted.formatting.length!==349)throw new Error(`Formatting recovery validation failed: found=${adapted.totalFound}, formatting=${adapted.formatting.length}, errors=${adapted.integrityErrors.join('; ')}`);
  const updated=db.updateQuestionFormattingBatch(adapted.formatting,1);const after=snapshot(),afterHash=digest({questions:after.questions,options:after.options,userData:after.userData});
  if(beforeHash!==afterHash)throw new Error('Integrity guard failed: immutable question data or user data changed');
  const integrity=db.integrity();if(!integrity.ok)throw new Error(integrity.message);
  const stats={processed:adapted.formatting.length,reformatted:updated,manualReview:adapted.manualReviewCount,caseStudies:adapted.formatting.filter(x=>x.stats.caseStudy).length,questionsWithCode:adapted.formatting.filter(x=>x.stats.codeBlocks>0).length,codeBlocks:adapted.formatting.reduce((n,x)=>n+x.stats.codeBlocks,0),questionsWithTables:adapted.formatting.filter(x=>x.stats.tables>0).length,tables:adapted.formatting.reduce((n,x)=>n+x.stats.tables,0),questionsWithImages:adapted.formatting.filter(x=>x.stats.imageNotices>0).length,imageNotices:adapted.formatting.reduce((n,x)=>n+x.stats.imageNotices,0),integrity,immutableHash:afterHash,userData:after.userData,backup,database,source};
  await mkdir(dirname(report),{recursive:true});await writeFile(report,JSON.stringify(stats,null,2),'utf8');console.log(JSON.stringify(stats,null,2));
}finally{db.close()}
