import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {loadBundledQuestions} from '../data/bundledBank';
import {QuestionsPage} from './QuestionsPage';

describe('mobile question editor',()=>{
  beforeEach(()=>vi.stubGlobal('confirm',vi.fn(()=>true)));
  it('saves a multiple-answer key and separate Turkish/English explanations',async()=>{const question=loadBundledQuestions().find(item=>item.type==='single')!,onSave=vi.fn(async()=>undefined),originalCorrect=question.options.find(option=>option.isCorrect)!;render(<QuestionsPage questions={[question]} locale="tr" onBookmark={()=>undefined} onSave={onSave}/>);fireEvent.click(screen.getByRole('button',{name:'Soruyu Düzenle'}));fireEvent.click(screen.getByRole('radio',{name:'Çoklu cevap'}));const choices=screen.getAllByRole('checkbox') as HTMLInputElement[],additional=choices.find(choice=>!choice.checked)!,additionalId=question.options[choices.indexOf(additional)].id;fireEvent.click(additional);fireEvent.change(screen.getByLabelText('Kullanıcı açıklaması (Türkçe)'),{target:{value:'Türkçe\nSELECT 1;'}});fireEvent.change(screen.getByLabelText('Kullanıcı açıklaması (İngilizce)'),{target:{value:'English\nSELECT 1;'}});fireEvent.click(screen.getByRole('button',{name:/Değişiklikleri Kaydet/}));await waitFor(()=>expect(onSave).toHaveBeenCalledOnce());expect(onSave).toHaveBeenCalledWith(expect.objectContaining({questionId:question.id,type:'multiple',correctOptionIds:expect.arrayContaining([originalCorrect.id,additionalId]),userExplanationTr:'Türkçe\nSELECT 1;',userExplanationEn:'English\nSELECT 1;'}));expect(confirm).toHaveBeenCalledOnce()});
});
