// @vitest-environment node
import {afterEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {AppDatabase} from '../database/index.js';
import {seedBundledQuestionBank} from './bundledBank.js';

const temporary:string[]=[];
afterEach(()=>{for(const directory of temporary.splice(0))rmSync(directory,{recursive:true,force:true})});

describe('bundled question-bank initialization',()=>{
  it('loads all 349 questions once and remains idempotent',()=>{
    const directory=mkdtempSync(join(tmpdir(),'certmaster-bundled-bank-'));temporary.push(directory);
    const database=new AppDatabase(join(directory,'certmaster.db'));
    const bankPath=join(process.cwd(),'question-banks/GCP_PDE_349_questions.json');
    expect(seedBundledQuestionBank(database,bankPath)).toEqual({imported:349,updated:0,duplicates:0,failed:0,available:true});
    expect(seedBundledQuestionBank(database,bankPath)).toEqual({imported:0,updated:349,duplicates:349,failed:0,available:true});
    expect(database.listQuestions({certificationId:'cert-google-pde'})).toHaveLength(349);
    database.close();
  });

  it('allows the application to start when no bundled bank is present',()=>{
    const directory=mkdtempSync(join(tmpdir(),'certmaster-no-bank-'));temporary.push(directory);
    const database=new AppDatabase(join(directory,'certmaster.db'));
    expect(seedBundledQuestionBank(database,join(directory,'missing.json'))).toEqual({imported:0,duplicates:0,failed:0,available:false});
    database.close();
  });
});
