import {ArrowLeft,Bookmark,Check,ChevronLeft,ChevronRight,Clock3,Flag,Grid3X3,X} from 'lucide-react';
import {useEffect,useMemo,useState} from 'react';
import {sameAnswer} from '../../shared/examEngine';
import {t,type MobileLocale} from '../i18n';
import type {MobileQuestion,MobileSession} from '../models';
import {useMobileStore} from '../store';
import {CaseStudyReader} from '../components/CaseStudyReader';
import {ImageViewer} from '../components/ImageViewer';
import {ContentBlocks,QuestionPrompt} from '../components/QuestionContent';

const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const formatTime=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.max(0,seconds%60).toString().padStart(2,'0')}`;

export function ExamScreen({session,questions,locale,onClose,onFinish}:{session:MobileSession;questions:MobileQuestion[];locale:MobileLocale;onClose:()=>void;onFinish:()=>void}){
  const save=useMobileStore(state=>state.saveSession),toggleBookmark=useMobileStore(state=>state.toggleBookmark);
  const [navigator,setNavigator]=useState(false),[caseOpen,setCaseOpen]=useState(false),[image,setImage]=useState<{url:string;alt:string}|null>(null);
  const question=questions.find(item=>item.id===session.questionIds[session.currentIndex]);
  const selected=question?session.answers[question.id]??[]:[],validated=question?session.validatedQuestionIds.includes(question.id):false;
  const orderedOptions=useMemo(()=>question?(session.optionOrders[question.id]??question.options.map(option=>option.id)).map(id=>question.options.find(option=>option.id===id)).filter(Boolean) as MobileQuestion['options']:[],[question,session.optionOrders]);

  useEffect(()=>{if(session.durationMinutes===0||session.status!=='active')return;const timer=setInterval(()=>{const current=useMobileStore.getState().session;if(!current)return;const remaining=Math.max(0,current.remainingSeconds-1),next={...current,remainingSeconds:remaining};useMobileStore.setState({session:next});if(remaining===0){clearInterval(timer);void useMobileStore.getState().finish()}},1000);return()=>clearInterval(timer)},[session.durationMinutes,session.status]);
  useEffect(()=>{const timer=setInterval(()=>{const current=useMobileStore.getState().session;if(current)void save(current)},15000);return()=>clearInterval(timer)},[save]);
  if(!question)return <div className="fatal-screen">Soru yüklenemedi.</div>;

  const update=async(patch:Partial<MobileSession>,persist=false)=>{const next={...session,...patch};useMobileStore.setState({session:next});if(persist)await save(next)};
  const choose=(id:string)=>{if(validated&&session.mode==='practice')return;const answers=question.type==='multiple'?(selected.includes(id)?selected.filter(item=>item!==id):[...selected,id]):[id];void update({answers:{...session.answers,[question.id]:answers}})};
  const check=()=>{if(!selected.length)return;void update({validatedQuestionIds:[...new Set([...session.validatedQuestionIds,question.id])]},true)};
  const move=(index:number)=>{void update({currentIndex:Math.max(0,Math.min(session.questionIds.length-1,index))},true);setCaseOpen(false)};
  const finish=()=>{if(session.mode==='practice'||confirm(locale==='tr'?'Sınavı bitirip sonuçları görmek istiyor musunuz?':'Submit the exam and view results?'))onFinish()};
  const answerCorrect=sameAnswer(selected,question.options.filter(option=>option.isCorrect).map(option=>option.id));
  const hasCase=Boolean(question.structuredContent?.caseStudyBlocks.length);
  const displayText=question.translation?.translatedText;
  return <div className="exam-screen">
    <header className="exam-top"><button onClick={onClose} aria-label={locale==='tr'?'Sınavdan çık':'Exit exam'}><ArrowLeft/></button><div><span>Professional Data Engineer</span><strong>{t(locale,'question')} {session.currentIndex+1} {t(locale,'of')} {session.questionIds.length}</strong></div>{session.durationMinutes>0?<time className={session.remainingSeconds<300?'urgent':''}><Clock3/>{formatTime(session.remainingSeconds)}</time>:<span className="practice-pill">{locale==='tr'?'Pratik':'Practice'}</span>}</header>
    <div className="exam-progress"><i style={{width:`${(session.currentIndex+1)/session.questionIds.length*100}%`}}/></div>
    <div className={`exam-layout ${hasCase?'has-case':''}`}>{hasCase&&<aside className="ipad-case-pane"><div className="case-pane-heading"><span>Vaka Çalışması</span><strong>{question.structuredContent?.caseStudyTitle??'Case Study'}</strong></div><div>{question.structuredContent&&<QuestionCaseInline question={question} onImage={(url,alt)=>setImage({url,alt})}/>}</div></aside>}
      <main className="exam-content"><div className="question-meta"><span>{question.sourceIdentifier}</span><span>{question.type==='multiple'?(locale==='tr'?'Birden fazla seçenek işaretleyin':'Select all that apply'):(locale==='tr'?'Tek seçenek işaretleyin':'Select one answer')}</span></div>{hasCase&&<button className="read-case" onClick={()=>setCaseOpen(true)}>{t(locale,'readCase')} <ChevronRight/></button>}<QuestionPrompt question={question} onImage={(url,alt)=>setImage({url,alt})}/>{session.language==='tr'&&displayText&&<p className="translated-question">{displayText}</p>}{session.language==='bilingual'&&displayText&&<div className="translation-card"><span>Türkçe</span><p>{displayText}</p></div>}
        <div className="answer-list">{orderedOptions.map((option,index)=>{const isSelected=selected.includes(option.id),isCorrect=validated&&option.isCorrect,isWrong=validated&&isSelected&&!option.isCorrect;return <button key={option.id} className={`${isSelected?'selected':''} ${isCorrect?'correct':''} ${isWrong?'wrong':''}`} onClick={()=>choose(option.id)} aria-pressed={isSelected}><span className={question.type==='multiple'?'checkbox':'radio'}>{isCorrect?<Check/>:letters[index]}</span><span className={option.text.includes('\n')?'code-option':''}>{option.text}</span></button>})}</div>
        {session.mode==='practice'&&!validated&&<button className="check-answer" disabled={!selected.length} onClick={check}>{t(locale,'check')}</button>}{validated&&<section className={`feedback ${answerCorrect?'correct':'wrong'}`}><strong>{answerCorrect?t(locale,'correct'):t(locale,'wrong')}</strong>{question.explanation&&<><h3>{t(locale,'explanation')}</h3><p>{question.explanation}</p></>}</section>}
      </main>
    </div>
    <footer className="exam-controls"><button disabled={session.currentIndex===0} onClick={()=>move(session.currentIndex-1)}><ChevronLeft/><span>{t(locale,'previous')}</span></button><button className={question.bookmarked?'active':''} onClick={()=>toggleBookmark(question.id)}><Bookmark fill={question.bookmarked?'currentColor':'none'}/><span>{locale==='tr'?'Kaydet':'Save'}</span></button><button className={session.reviewFlags.includes(question.id)?'active':''} onClick={()=>update({reviewFlags:session.reviewFlags.includes(question.id)?session.reviewFlags.filter(id=>id!==question.id):[...session.reviewFlags,question.id]},true)}><Flag/><span>{t(locale,'markReview')}</span></button><button onClick={()=>setNavigator(true)}><Grid3X3/><span>{t(locale,'questions')}</span></button>{session.currentIndex===session.questionIds.length-1?<button className="finish" onClick={finish}><Check/><span>{t(locale,'submit')}</span></button>:<button onClick={()=>move(session.currentIndex+1)}><ChevronRight/><span>{t(locale,'next')}</span></button>}</footer>
    {navigator&&<div className="sheet-backdrop" onClick={()=>setNavigator(false)}><section className="question-sheet" onClick={event=>event.stopPropagation()}><header><div><span>{locale==='tr'?'Soru Gezgini':'Question Navigator'}</span><strong>{Object.values(session.answers).filter(value=>value.length).length} / {session.questionIds.length} {locale==='tr'?'yanıtlandı':'answered'}</strong></div><button onClick={()=>setNavigator(false)}><X/></button></header><div>{session.questionIds.map((id,index)=><button key={id} className={`${index===session.currentIndex?'current':''} ${session.answers[id]?.length?'answered':''} ${session.reviewFlags.includes(id)?'review':''}`} onClick={()=>{move(index);setNavigator(false)}}>{index+1}</button>)}</div></section></div>}
    {caseOpen&&<CaseStudyReader question={question} onClose={()=>setCaseOpen(false)} onImage={(url,alt)=>setImage({url,alt})}/>}<ImageViewer image={image} onClose={()=>setImage(null)}/>
  </div>;
}

function QuestionCaseInline({question,onImage}:{question:MobileQuestion;onImage:(url:string,alt:string)=>void}){return question.structuredContent?<ContentBlocks blocks={question.structuredContent.caseStudyBlocks} onImage={onImage}/>:null}
