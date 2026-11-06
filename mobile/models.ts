import type {QuestionContentDocument} from '../shared/contracts';

export type MobileLanguage='en'|'tr'|'bilingual';
export type MobileExamMode='exam'|'practice'|'incorrect'|'bookmarked'|'custom';

export interface MobileOption {id:string;label:string;text:string;isCorrect:boolean;sortOrder:number}
export interface MobileQuestion {
  id:string;
  sourceIdentifier:string;
  certificationId:'cert-google-pde';
  type:'single'|'multiple'|'true_false'|'scenario'|'image';
  originalLanguage:'en'|'tr';
  originalText:string;
  rawText:string;
  structuredContent:QuestionContentDocument|null;
  explanation:string;
  difficulty:'easy'|'medium'|'hard';
  tags:string[];
  reviewStatus:'ready'|'needs_review'|'approved';
  options:MobileOption[];
  translation?:{translatedText:string;translatedExplanation:string;optionTranslations:Record<string,string>;status:string}|null;
  bookmarked:boolean;
}

export interface MobileExamConfig {
  mode:MobileExamMode;
  questionCount:number;
  durationMinutes:number;
  difficulties:Array<MobileQuestion['difficulty']>;
  tags:string[];
  language:MobileLanguage;
  randomizeQuestions:boolean;
}

export interface MobileSession {
  id:string;
  mode:MobileExamMode;
  status:'active'|'paused'|'completed';
  questionIds:string[];
  optionOrders:Record<string,string[]>;
  answers:Record<string,string[]>;
  reviewFlags:string[];
  validatedQuestionIds:string[];
  currentIndex:number;
  durationMinutes:number;
  remainingSeconds:number;
  language:MobileLanguage;
  startedAt:string;
  savedAt:string;
  completedAt:string|null;
  score:number|null;
}

export interface MobileAttempt {id:string;sessionId:string;questionId:string;isCorrect:boolean;attemptedAt:string}
export interface MobileSettings {interfaceLanguage:'tr'|'en';questionLanguage:MobileLanguage;theme:'system'|'light'|'dark'}
export interface MobileStatistics {
  totalQuestions:number;practicedQuestions:number;completedExams:number;averageScore:number;correctAnswers:number;incorrectAnswers:number;successRate:number;bookmarks:number;streak:number;
  recent:Array<{id:string;date:string;score:number;questionCount:number}>;
  activity:Array<{date:string;questions:number}>;
  weakTopics:Array<{topic:string;accuracy:number;attempts:number}>;
}

export interface MobileBackup {format:'certmaster-mobile-backup';version:1;createdAt:string;sessions:MobileSession[];attempts:MobileAttempt[];bookmarks:string[];settings:MobileSettings}
