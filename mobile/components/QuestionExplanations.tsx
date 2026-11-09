import type {MobileQuestion} from '../models';

export function QuestionExplanations({question,locale}:{question:MobileQuestion;locale:'tr'|'en'}){
  const tr=locale==='tr',userEn=question.userExplanation?.en.trim(),userTr=question.userExplanation?.tr.trim();
  if(!userEn&&!userTr&&!question.explanation)return null;
  return <div className="question-explanations">
    {(userTr||userEn)&&<section className="user-explanation"><strong>{tr?'Kullanıcı Açıklaması':'User Explanation'}</strong>{userTr&&<div><small>Türkçe</small><pre>{userTr}</pre></div>}{userEn&&<div><small>English</small><pre>{userEn}</pre></div>}</section>}
    {question.explanation&&<section className="pdf-explanation"><strong>{tr?'Orijinal PDF Açıklaması':'Original PDF Explanation'}</strong><pre>{question.explanation}</pre></section>}
  </div>;
}
