import {create} from 'zustand';
import {remainingAt} from '../shared/examEngine';
import type {MobileExamConfig,MobileQuestion,MobileSession,MobileSettings,MobileStatistics} from './models';
import {repository} from './storage';

type MobileTab='home'|'exams'|'questions'|'statistics'|'settings';
type MobileScreen='tabs'|'exam'|'results';
interface MobileState {
  ready:boolean;error:string|null;tab:MobileTab;screen:MobileScreen;
  questions:MobileQuestion[];statistics:MobileStatistics|null;settings:MobileSettings|null;session:MobileSession|null;result:MobileSession|null;
  initialize():Promise<void>;refresh():Promise<void>;setTab(tab:MobileTab):void;start(config:MobileExamConfig):Promise<void>;resume():Promise<void>;saveSession(session:MobileSession):Promise<void>;finish():Promise<void>;closeExam():Promise<void>;toggleBookmark(id:string):Promise<void>;saveSettings(settings:MobileSettings):Promise<void>;resetStatistics():Promise<void>;setQuestions(questions:MobileQuestion[]):void;
}

export const useMobileStore=create<MobileState>((set,get)=>({
  ready:false,error:null,tab:'home',screen:'tabs',questions:[],statistics:null,settings:null,session:null,result:null,
  async initialize(){try{await repository.initialize();const [questions,statistics,settings,session]=await Promise.all([repository.listQuestions(),repository.statistics(),repository.getSettings(),repository.activeSession()]);let resumed=session;if(resumed&&resumed.durationMinutes>0&&resumed.status==='active')resumed={...resumed,remainingSeconds:remainingAt(resumed.remainingSeconds,resumed.savedAt)};set({ready:true,questions,statistics,settings,session:resumed,error:null})}catch(error){set({ready:true,error:error instanceof Error?error.message:String(error)})}},
  async refresh(){const [questions,statistics]=await Promise.all([repository.listQuestions(),repository.statistics()]);set({questions,statistics})},
  setTab(tab){set({tab})},
  async start(config){const session=await repository.createSession(config);set({session,screen:'exam',result:null})},
  async resume(){const session=get().session;if(session){const resumed={...session,status:'active' as const,savedAt:new Date().toISOString()};await repository.saveSession(resumed);set({session:resumed,screen:'exam'})}},
  async saveSession(session){await repository.saveSession(session);set({session})},
  async finish(){const session=get().session;if(!session)return;const result=await repository.submitSession(session);set({session:null,result,screen:'results'});await get().refresh()},
  async closeExam(){const session=get().session;if(session)await repository.saveSession({...session,status:'paused'});set({screen:'tabs',tab:'home'})},
  async toggleBookmark(id){await repository.toggleBookmark(id);await get().refresh();const session=get().session;if(session)set({session:{...session}})},
  async saveSettings(settings){await repository.saveSettings(settings);set({settings});document.documentElement.dataset.theme=settings.theme},
  async resetStatistics(){await repository.resetStatistics();set({session:null,result:null,screen:'tabs'});await get().refresh()},
  setQuestions(questions){set({questions})}
}));
