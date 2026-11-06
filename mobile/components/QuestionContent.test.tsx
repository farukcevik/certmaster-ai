import {fireEvent,render,screen} from '@testing-library/react';
import {describe,expect,it,vi} from 'vitest';
import {loadBundledQuestions} from '../data/bundledBank';
import {CaseStudyReader} from './CaseStudyReader';
import {QuestionPrompt} from './QuestionContent';

describe('mobile structured question rendering',()=>{
  const questions=loadBundledQuestions();
  it('renders recovered images offline and opens the image viewer callback',()=>{const question=questions.find(item=>item.id==='GCP-PDE-063')!,onImage=vi.fn();render(<QuestionPrompt question={question} onImage={onImage}/>);const image=screen.getByRole('img');expect(image.getAttribute('src')).toMatch(/^data:image\/png;base64,/);fireEvent.click(screen.getByRole('button'));expect(onImage).toHaveBeenCalledOnce()});
  it('renders Flowlogistic as structured headings instead of a flat paragraph',()=>{const question=questions.find(item=>item.id==='GCP-PDE-083')!;render(<CaseStudyReader question={question} onClose={()=>undefined} onImage={()=>undefined}/>);expect(screen.getByRole('heading',{name:'Flowlogistic Case Study'})).toBeVisible();expect(screen.getByRole('heading',{name:'Company Overview'})).toBeVisible();expect(screen.getByRole('heading',{name:'Business Requirements'})).toBeVisible()});
});
