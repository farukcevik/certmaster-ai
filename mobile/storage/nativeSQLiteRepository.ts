import {CapacitorSQLite,SQLiteConnection,type SQLiteDBConnection} from '@capacitor-community/sqlite';
import {calculateScore,sameAnswer,shuffled,shuffledDifferentFrom} from '../../shared/examEngine';
import {loadBundledQuestions} from '../data/bundledBank';
import type {MobileAttempt,MobileBackup,MobileExamConfig,MobileQuestion,MobileSession,MobileSettings,MobileStatistics} from '../models';
import type {MobileRepository,QuestionFilters} from './repository';

const DEFAULT_SETTINGS:MobileSettings={interfaceLanguage:'tr',questionLanguage:'en',theme:'system'};
const uid=()=>crypto.randomUUID();
const parse=<T>(value:unknown,fallback:T):T=>{try{return typeof value==='string'?JSON.parse(value) as T:fallback}catch{return fallback}};
const schema=`
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS questions(id TEXT PRIMARY KEY, source_identifier TEXT NOT NULL UNIQUE, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bookmarks(question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, status TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY, session_id TEXT NOT NULL, question_id TEXT NOT NULL REFERENCES questions(id), is_correct INTEGER NOT NULL, attempted_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value_json TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status,started_at);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts(question_id,attempted_at);
INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(1,CURRENT_TIMESTAMP);
`;

export class NativeSQLiteRepository implements MobileRepository{
  private readonly sqlite=new SQLiteConnection(CapacitorSQLite);
  private database!:SQLiteDBConnection;
  private questions:MobileQuestion[]=[];

  async initialize(){
    const consistent=await this.sqlite.checkConnectionsConsistency();
    const exists=await this.sqlite.isConnection('certmaster_mobile',false);
    this.database=consistent.result&&exists.result?await this.sqlite.retrieveConnection('certmaster_mobile',false):await this.sqlite.createConnection('certmaster_mobile',false,'no-encryption',1,false);
    await this.database.open();await this.database.execute(schema,true);
    this.questions=loadBundledQuestions();
    await this.database.executeSet(this.questions.map(question=>({statement:'INSERT OR IGNORE INTO questions(id,source_identifier,payload_json) VALUES(?,?,?)',values:[question.id,question.sourceIdentifier,JSON.stringify({...question,bookmarked:false})]})),true);
    await this.database.run('INSERT OR IGNORE INTO settings(key,value_json) VALUES(?,?)',['preferences',JSON.stringify(DEFAULT_SETTINGS)]);
  }
  private async bookmarkIds(){return new Set(((await this.database.query('SELECT question_id FROM bookmarks')).values??[]).map(row=>String(row.question_id)))}
  async listQuestions(filters:QuestionFilters={}){
    const bookmarks=await this.bookmarkIds(),incorrect=new Set<string>();
    if(filters.incorrect)for(const row of (await this.database.query('SELECT DISTINCT question_id FROM attempts WHERE is_correct=0')).values??[])incorrect.add(String(row.question_id));
    return this.questions.filter(question=>{
      if(filters.search&&!`${question.originalText} ${question.sourceIdentifier}`.toLocaleLowerCase().includes(filters.search.toLocaleLowerCase()))return false;
      if(filters.bookmarked&&!bookmarks.has(question.id))return false;
      if(filters.incorrect&&!incorrect.has(question.id))return false;
      if(filters.difficulties?.length&&!filters.difficulties.includes(question.difficulty))return false;
      if(filters.tags?.length&&!filters.tags.some(tag=>question.tags.includes(tag)))return false;
      return true;
    }).map(question=>({...question,bookmarked:bookmarks.has(question.id)}));
  }
  async getQuestion(id:string){const question=(await this.listQuestions()).find(item=>item.id===id);if(!question)throw new Error('Soru bulunamadı');return question}
  async toggleBookmark(id:string){const current=await this.database.query('SELECT question_id FROM bookmarks WHERE question_id=?',[id]);if(current.values?.length){await this.database.run('DELETE FROM bookmarks WHERE question_id=?',[id]);return false}await this.database.run('INSERT INTO bookmarks(question_id,created_at) VALUES(?,?)',[id,new Date().toISOString()]);return true}
  async createSession(config:MobileExamConfig){
    let questions=await this.listQuestions({difficulties:config.difficulties,tags:config.tags,bookmarked:config.mode==='bookmarked',incorrect:config.mode==='incorrect'});if(config.randomizeQuestions)questions=shuffled(questions);questions=questions.slice(0,config.questionCount);if(!questions.length)throw new Error('Bu ölçütlere uygun soru bulunamadı.');
    const last=(await this.history()).at(0)??await this.activeSession(),orders:Record<string,string[]>={};for(const question of questions){const sourceOrder=question.options.map(option=>option.id);orders[question.id]=shuffledDifferentFrom(sourceOrder,last?.optionOrders[question.id]??sourceOrder)}
    const now=new Date().toISOString();const session:MobileSession={id:uid(),mode:config.mode,status:'active',questionIds:questions.map(question=>question.id),optionOrders:orders,answers:{},reviewFlags:[],validatedQuestionIds:[],currentIndex:0,durationMinutes:config.durationMinutes,remainingSeconds:config.durationMinutes*60,language:config.language,startedAt:now,savedAt:now,completedAt:null,score:null};await this.saveSession(session);return session;
  }
  private rowSession(row:Record<string,unknown>){return parse<MobileSession>(row.payload_json,null as unknown as MobileSession)}
  async activeSession(){const rows=(await this.database.query("SELECT payload_json FROM sessions WHERE status IN('active','paused') ORDER BY started_at DESC LIMIT 1")).values??[];return rows[0]?this.rowSession(rows[0]):null}
  async saveSession(session:MobileSession){const saved={...session,savedAt:new Date().toISOString()};await this.database.run('INSERT INTO sessions(id,status,started_at,completed_at,payload_json) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,completed_at=excluded.completed_at,payload_json=excluded.payload_json',[saved.id,saved.status,saved.startedAt,saved.completedAt,JSON.stringify(saved)])}
  async submitSession(session:MobileSession){
    const now=new Date().toISOString(),attempts:MobileAttempt[]=[],results:boolean[]=[];for(const questionId of session.questionIds){const question=this.questions.find(item=>item.id===questionId)!;const ok=sameAnswer(session.answers[questionId]??[],question.options.filter(option=>option.isCorrect).map(option=>option.id));results.push(ok);attempts.push({id:uid(),sessionId:session.id,questionId,isCorrect:ok,attemptedAt:now})}
    const completed={...session,status:'completed' as const,score:calculateScore(results),completedAt:now,savedAt:now};await this.database.beginTransaction();try{await this.database.executeSet(attempts.map(attempt=>({statement:'INSERT INTO attempts(id,session_id,question_id,is_correct,attempted_at) VALUES(?,?,?,?,?)',values:[attempt.id,attempt.sessionId,attempt.questionId,attempt.isCorrect?1:0,attempt.attemptedAt]})),false);await this.database.run('UPDATE sessions SET status=?,completed_at=?,payload_json=? WHERE id=?',['completed',now,JSON.stringify(completed),session.id],false);await this.database.commitTransaction()}catch(error){await this.database.rollbackTransaction();throw error}return completed;
  }
  async history(){return ((await this.database.query("SELECT payload_json FROM sessions WHERE status='completed' ORDER BY completed_at DESC")).values??[]).map(row=>this.rowSession(row))}
  async attempts(){return ((await this.database.query('SELECT id,session_id,question_id,is_correct,attempted_at FROM attempts ORDER BY attempted_at')).values??[]).map(row=>({id:String(row.id),sessionId:String(row.session_id),questionId:String(row.question_id),isCorrect:Boolean(row.is_correct),attemptedAt:String(row.attempted_at)}))}
  async statistics():Promise<MobileStatistics>{
    const attempts=await this.attempts(),history=await this.history(),bookmarks=await this.bookmarkIds(),correct=attempts.filter(item=>item.isCorrect).length,days=new Map<string,number>(),topics=new Map<string,{correct:number;total:number}>();
    for(const attempt of attempts){const date=attempt.attemptedAt.slice(0,10);days.set(date,(days.get(date)??0)+1);const question=this.questions.find(item=>item.id===attempt.questionId);for(const tag of question?.tags.length?question.tags:['Genel']){const value=topics.get(tag)??{correct:0,total:0};value.total++;if(attempt.isCorrect)value.correct++;topics.set(tag,value)}}
    const activeDays=new Set(days.keys());let studyStreak=0,cursor=new Date();while(activeDays.has(cursor.toISOString().slice(0,10))){studyStreak++;cursor.setDate(cursor.getDate()-1)}
    return{totalQuestions:this.questions.length,practicedQuestions:new Set(attempts.map(item=>item.questionId)).size,completedExams:history.length,averageScore:history.length?Math.round(history.reduce((sum,item)=>sum+(item.score??0),0)/history.length*10)/10:0,correctAnswers:correct,incorrectAnswers:attempts.length-correct,successRate:attempts.length?Math.round(correct/attempts.length*1000)/10:0,bookmarks:bookmarks.size,streak:studyStreak,recent:history.slice(0,5).map(item=>({id:item.id,date:item.completedAt??item.startedAt,score:item.score??0,questionCount:item.questionIds.length})),activity:[...days].map(([date,questions])=>({date,questions})).slice(-7),weakTopics:[...topics].map(([topic,value])=>({topic,accuracy:Math.round(value.correct/value.total*1000)/10,attempts:value.total})).filter(item=>item.attempts>=2).sort((a,b)=>a.accuracy-b.accuracy).slice(0,5)};
  }
  async resetStatistics(){await this.database.beginTransaction();try{await this.database.execute('DELETE FROM attempts;DELETE FROM sessions;',false);await this.database.commitTransaction()}catch(error){await this.database.rollbackTransaction();throw error}}
  async getSettings(){const rows=(await this.database.query("SELECT value_json FROM settings WHERE key='preferences'")).values??[];return parse<MobileSettings>(rows[0]?.value_json,DEFAULT_SETTINGS)}
  async saveSettings(settings:MobileSettings){await this.database.run("INSERT INTO settings(key,value_json) VALUES('preferences',?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json",[JSON.stringify(settings)])}
  async createBackup():Promise<MobileBackup>{const active=await this.activeSession();return{format:'certmaster-mobile-backup',version:1,createdAt:new Date().toISOString(),sessions:[...(await this.history()),...(active?[active]:[])],attempts:await this.attempts(),bookmarks:[...await this.bookmarkIds()],settings:await this.getSettings()}}
  async restoreBackup(backup:MobileBackup){
    if(backup.format!=='certmaster-mobile-backup'||backup.version!==1)throw new Error('Desteklenmeyen yedek biçimi');await this.database.beginTransaction();try{await this.database.execute('DELETE FROM attempts;DELETE FROM sessions;DELETE FROM bookmarks;',false);const records=[...backup.sessions.map(session=>({statement:'INSERT INTO sessions(id,status,started_at,completed_at,payload_json) VALUES(?,?,?,?,?)',values:[session.id,session.status,session.startedAt,session.completedAt,JSON.stringify(session)]})),...backup.attempts.map(attempt=>({statement:'INSERT INTO attempts(id,session_id,question_id,is_correct,attempted_at) VALUES(?,?,?,?,?)',values:[attempt.id,attempt.sessionId,attempt.questionId,attempt.isCorrect?1:0,attempt.attemptedAt]})),...backup.bookmarks.map(id=>({statement:'INSERT INTO bookmarks(question_id,created_at) VALUES(?,?)',values:[id,new Date().toISOString()]}))];if(records.length)await this.database.executeSet(records,false);await this.database.run("INSERT INTO settings(key,value_json) VALUES('preferences',?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json",[JSON.stringify(backup.settings)],false);await this.database.commitTransaction()}catch(error){await this.database.rollbackTransaction();throw error}
  }
}
