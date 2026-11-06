import {fireEvent,render,screen} from '@testing-library/react';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import type {MobileQuestion,MobileSession} from '../models';
import {useMobileStore} from '../store';
import {ExamScreen} from './ExamScreen';

const question:MobileQuestion={id:'multi-1',sourceIdentifier:'MULTI-1',certificationId:'cert-google-pde',type:'multiple',originalLanguage:'en',originalText:'Select two correct services.',rawText:'Select two correct services.',structuredContent:null,explanation:'Two services are required.',difficulty:'medium',tags:[],reviewStatus:'ready',bookmarked:false,translation:null,options:[{id:'a',label:'A',text:'BigQuery',isCorrect:true,sortOrder:0},{id:'b',label:'B',text:'Cloud Storage',isCorrect:false,sortOrder:1},{id:'c',label:'C',text:'Dataflow',isCorrect:true,sortOrder:2}]};
const session:MobileSession={id:'session-1',mode:'practice',status:'active',questionIds:[question.id],optionOrders:{[question.id]:['b','c','a']},answers:{},reviewFlags:[],validatedQuestionIds:[],currentIndex:0,durationMinutes:0,remainingSeconds:0,language:'en',startedAt:new Date().toISOString(),savedAt:new Date().toISOString(),completedAt:null,score:null};

describe('mobile multiple-answer practice',()=>{
  beforeEach(()=>useMobileStore.setState({session,questions:[question]}));
  it('allows every intended option before explicit validation',()=>{const Harness=()=>{const current=useMobileStore(state=>state.session);return current?<ExamScreen session={current} questions={[question]} locale="tr" onClose={vi.fn()} onFinish={vi.fn()}/>:null};render(<Harness/>);const dataflow=screen.getByRole('button',{name:/Dataflow/}),bigQuery=screen.getByRole('button',{name:/BigQuery/});fireEvent.click(dataflow);fireEvent.click(bigQuery);expect(dataflow).toHaveAttribute('aria-pressed','true');expect(bigQuery).toHaveAttribute('aria-pressed','true');expect(screen.queryByText('Doğru')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Cevabı Kontrol Et'})).toBeEnabled()});
});
