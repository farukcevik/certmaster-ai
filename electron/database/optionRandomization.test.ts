// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {AppDatabase} from './index.js';
import type {ExamConfig,Question} from '../../shared/contracts.js';

const certificationId='cert-google-pde';
let directory:string;
let database:AppDatabase;

const config:ExamConfig={
  certificationId,
  mode:'exam',
  categoryIds:[],
  difficulties:[],
  questionCount:1,
  durationMinutes:10,
  passingScore:70,
  randomizeQuestions:false,
  randomizeOptions:false,
  languageMode:'en',
  onlyUnanswered:false
};

const addQuestion=(type:'single'|'multiple')=>database.saveQuestion({
  certificationId,
  categoryId:null,
  type,
  originalLanguage:'en',
  originalText:`Option randomization ${type}`,
  explanation:'Integrity test',
  difficulty:'medium',
  sourceInfo:'test',
  reviewStatus:'approved',
  tags:['randomization'],
  options:[
    {label:'A',text:'Option A',isCorrect:true,sortOrder:0},
    {label:'B',text:'Option B',isCorrect:type==='multiple',sortOrder:1},
    {label:'C',text:'Option C',isCorrect:false,sortOrder:2},
    {label:'D',text:'Option D',isCorrect:false,sortOrder:3}
  ]
});

const correctOptionIds=(question:Question)=>question.options.filter(option=>option.isCorrect).map(option=>option.id);

beforeEach(()=>{
  directory=mkdtempSync(join(tmpdir(),'certmaster-option-order-'));
  database=new AppDatabase(join(directory,'database.sqlite'));
});

afterEach(()=>{
  database.close();
  rmSync(directory,{recursive:true,force:true});
});

describe('mandatory answer option randomization',()=>{
  it('creates a different option order for every consecutive exam session',()=>{
    const question=addQuestion('single');
    const sourceOrder=question.options.map(option=>option.id);
    let previousOrder=sourceOrder;

    for(let attempt=0;attempt<8;attempt++){
      const session=database.createSession(config);
      const order=session.questions[0].optionOrder;
      expect(order).not.toEqual(previousOrder);
      expect(new Set(order)).toEqual(new Set(sourceOrder));
      previousOrder=order;
    }
  });

  it.each(['single','multiple'] as const)('preserves %s-choice correct-answer identity after shuffling',type=>{
    const question=addQuestion(type);
    const session=database.createSession(config);
    const correctIds=correctOptionIds(question);

    database.answer({sessionId:session.id,questionId:question.id,selectedOptionIds:correctIds});

    expect(database.submitSession(session.id).score).toBe(100);
    expect(new Set(session.questions[0].optionOrder)).toEqual(new Set(question.options.map(option=>option.id)));
  });

  it('resets exam statistics without deleting question-bank or user-library data',()=>{
    const question=addQuestion('single');
    database.toggleBookmark(question.id);
    database.saveTranslation({
      questionId:question.id,
      language:'tr',
      translatedText:'Seçenek karıştırma sorusu',
      translatedExplanation:'Yerel açıklama',
      optionTranslations:Object.fromEntries(question.options.map(option=>[option.id,option.text])),
      status:'approved',
      provider:'manual'
    });
    database.setSetting('theme','dark');
    const session=database.createSession(config);
    database.answer({sessionId:session.id,questionId:question.id,selectedOptionIds:correctOptionIds(question)});
    database.submitSession(session.id);

    expect(database.resetStatistics()).toEqual({deletedSessions:1,deletedAttempts:1});
    expect(database.history()).toEqual([]);
    expect(database.activeSession()).toBeNull();
    expect(database.dashboard()).toMatchObject({completedExams:0,correctAnswers:0,incorrectAnswers:0,unanswered:0});
    expect(database.getQuestion(question.id)).toMatchObject({bookmarked:true,translation:{translatedText:'Seçenek karıştırma sorusu'}});
    expect(database.settings().theme).toBe('dark');
  });
});
