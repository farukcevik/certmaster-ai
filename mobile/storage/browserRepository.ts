import {calculateScore,sameAnswer,shuffled,shuffledDifferentFrom} from '../../shared/examEngine';
import {loadBundledQuestions} from '../data/bundledBank';
import type {MobileAttempt,MobileBackup,MobileExamConfig,MobileQuestion,MobileSession,MobileSettings,MobileStatistics} from '../models';
import type {MobileRepository,QuestionFilters} from './repository';

interface BrowserState {sessions:MobileSession[];attempts:MobileAttempt[];bookmarks:string[];settings:MobileSettings}
const STORAGE_KEY='certmaster.mobile.v1';
const defaults:BrowserState={sessions:[],attempts:[],bookmarks:[],settings:{interfaceLanguage:'tr',questionLanguage:'en',theme:'system'}};
const uid=()=>crypto.randomUUID();

function readState():BrowserState{
  try{return {...defaults,...JSON.parse(localStorage.getItem(STORAGE_KEY)??'{}')} as BrowserState}catch{return structuredClone(defaults)}
}
function writeState(state:BrowserState){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function streak(attempts:MobileAttempt[]){const days=new Set(attempts.map(attempt=>attempt.attemptedAt.slice(0,10)));let count=0,cursor=new Date();while(days.has(cursor.toISOString().slice(0,10))){count++;cursor.setDate(cursor.getDate()-1)}return count}

export class BrowserMobileRepository implements MobileRepository{
  private questions:MobileQuestion[]=[];
  async initialize(){this.questions=loadBundledQuestions();if(!localStorage.getItem(STORAGE_KEY))writeState(structuredClone(defaults))}
  private withBookmarks(question:MobileQuestion){return{...question,bookmarked:readState().bookmarks.includes(question.id)}}
  async listQuestions(filters:QuestionFilters={}){
    const state=readState(),incorrect=new Set(state.attempts.filter(attempt=>!attempt.isCorrect).map(attempt=>attempt.questionId));
    return this.questions.filter(question=>{
      if(filters.search&&!`${question.originalText} ${question.sourceIdentifier}`.toLocaleLowerCase().includes(filters.search.toLocaleLowerCase()))return false;
      if(filters.bookmarked&&!state.bookmarks.includes(question.id))return false;
      if(filters.incorrect&&!incorrect.has(question.id))return false;
      if(filters.difficulties?.length&&!filters.difficulties.includes(question.difficulty))return false;
      if(filters.tags?.length&&!filters.tags.some(tag=>question.tags.includes(tag)))return false;
      return true;
    }).map(question=>this.withBookmarks(question));
  }
  async getQuestion(id:string){const question=this.questions.find(item=>item.id===id);if(!question)throw new Error('Soru bulunamadı');return this.withBookmarks(question)}
  async toggleBookmark(id:string){const state=readState(),index=state.bookmarks.indexOf(id);if(index>=0)state.bookmarks.splice(index,1);else state.bookmarks.push(id);writeState(state);return index<0}
  async createSession(config:MobileExamConfig){
    const filters:QuestionFilters={difficulties:config.difficulties,tags:config.tags,bookmarked:config.mode==='bookmarked',incorrect:config.mode==='incorrect'};
    let available=await this.listQuestions(filters);if(config.randomizeQuestions)available=shuffled(available);available=available.slice(0,config.questionCount);if(!available.length)throw new Error('Bu ölçütlere uygun soru bulunamadı.');
    const previous=readState().sessions.at(-1);const optionOrders:Record<string,string[]>={};
    for(const question of available){const sourceOrder=question.options.map(option=>option.id);optionOrders[question.id]=shuffledDifferentFrom(sourceOrder,previous?.optionOrders[question.id]??sourceOrder)}
    const now=new Date().toISOString();const session:MobileSession={id:uid(),mode:config.mode,status:'active',questionIds:available.map(question=>question.id),optionOrders,answers:{},reviewFlags:[],validatedQuestionIds:[],currentIndex:0,durationMinutes:config.durationMinutes,remainingSeconds:config.durationMinutes*60,language:config.language,startedAt:now,savedAt:now,completedAt:null,score:null};
    const state=readState();state.sessions.push(session);writeState(state);return session;
  }
  async activeSession(){return readState().sessions.filter(session=>session.status!=='completed').at(-1)??null}
  async saveSession(session:MobileSession){const state=readState(),index=state.sessions.findIndex(item=>item.id===session.id),saved={...session,savedAt:new Date().toISOString()};if(index>=0)state.sessions[index]=saved;else state.sessions.push(saved);writeState(state)}
  async submitSession(session:MobileSession){
    const state=readState(),now=new Date().toISOString(),results:boolean[]=[];
    for(const questionId of session.questionIds){const question=this.questions.find(item=>item.id===questionId)!;const ok=sameAnswer(session.answers[questionId]??[],question.options.filter(option=>option.isCorrect).map(option=>option.id));results.push(ok);state.attempts.push({id:uid(),sessionId:session.id,questionId,isCorrect:ok,attemptedAt:now})}
    const completed={...session,status:'completed' as const,completedAt:now,savedAt:now,score:calculateScore(results)};const index=state.sessions.findIndex(item=>item.id===session.id);if(index>=0)state.sessions[index]=completed;else state.sessions.push(completed);writeState(state);return completed;
  }
  async history(){return readState().sessions.filter(session=>session.status==='completed').sort((a,b)=>(b.completedAt??'').localeCompare(a.completedAt??''))}
  async attempts(){return readState().attempts}
  async statistics(){
    const state=readState(),completed=state.sessions.filter(session=>session.status==='completed'),correct=state.attempts.filter(attempt=>attempt.isCorrect).length;
    const dates=new Map<string,number>();for(const attempt of state.attempts){const date=attempt.attemptedAt.slice(0,10);dates.set(date,(dates.get(date)??0)+1)}
    const topics=new Map<string,{correct:number;total:number}>();for(const attempt of state.attempts){const question=this.questions.find(item=>item.id===attempt.questionId);for(const tag of question?.tags.length?question.tags:['Genel']){const value=topics.get(tag)??{correct:0,total:0};value.total++;if(attempt.isCorrect)value.correct++;topics.set(tag,value)}}
    return {totalQuestions:this.questions.length,practicedQuestions:new Set(state.attempts.map(item=>item.questionId)).size,completedExams:completed.length,averageScore:completed.length?Math.round(completed.reduce((sum,item)=>sum+(item.score??0),0)/completed.length*10)/10:0,correctAnswers:correct,incorrectAnswers:state.attempts.length-correct,successRate:state.attempts.length?Math.round(correct/state.attempts.length*1000)/10:0,bookmarks:state.bookmarks.length,streak:streak(state.attempts),recent:completed.slice(-5).reverse().map(item=>({id:item.id,date:item.completedAt??item.startedAt,score:item.score??0,questionCount:item.questionIds.length})),activity:[...dates].map(([date,questions])=>({date,questions})).slice(-7),weakTopics:[...topics].map(([topic,value])=>({topic,accuracy:Math.round(value.correct/value.total*1000)/10,attempts:value.total})).filter(item=>item.attempts>=2).sort((a,b)=>a.accuracy-b.accuracy).slice(0,5)};
  }
  async resetStatistics(){const state=readState();state.sessions=[];state.attempts=[];writeState(state)}
  async getSettings(){return readState().settings}
  async saveSettings(settings:MobileSettings){const state=readState();state.settings=settings;writeState(state)}
  async createBackup():Promise<MobileBackup>{const state=readState();return{format:'certmaster-mobile-backup',version:1,createdAt:new Date().toISOString(),sessions:state.sessions,attempts:state.attempts,bookmarks:state.bookmarks,settings:state.settings}}
  async restoreBackup(backup:MobileBackup){if(backup.format!=='certmaster-mobile-backup'||backup.version!==1)throw new Error('Desteklenmeyen yedek biçimi');writeState({sessions:backup.sessions,attempts:backup.attempts,bookmarks:backup.bookmarks,settings:backup.settings})}
}
