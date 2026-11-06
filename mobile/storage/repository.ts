import type {MobileAttempt,MobileBackup,MobileExamConfig,MobileQuestion,MobileSession,MobileSettings,MobileStatistics} from '../models';

export interface QuestionFilters {search?:string;bookmarked?:boolean;incorrect?:boolean;difficulties?:MobileQuestion['difficulty'][];tags?:string[]}

export interface MobileRepository {
  initialize():Promise<void>;
  listQuestions(filters?:QuestionFilters):Promise<MobileQuestion[]>;
  getQuestion(id:string):Promise<MobileQuestion>;
  toggleBookmark(id:string):Promise<boolean>;
  createSession(config:MobileExamConfig):Promise<MobileSession>;
  activeSession():Promise<MobileSession|null>;
  saveSession(session:MobileSession):Promise<void>;
  submitSession(session:MobileSession):Promise<MobileSession>;
  history():Promise<MobileSession[]>;
  attempts():Promise<MobileAttempt[]>;
  statistics():Promise<MobileStatistics>;
  resetStatistics():Promise<void>;
  getSettings():Promise<MobileSettings>;
  saveSettings(settings:MobileSettings):Promise<void>;
  createBackup():Promise<MobileBackup>;
  restoreBackup(backup:MobileBackup):Promise<void>;
}
