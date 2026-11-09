import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {describe,expect,it,vi} from 'vitest';
import {ExamsPage} from './ExamsPage';

describe('mobile exam configuration',()=>{
  it('allows all questions and preserves the selected question ordering mode',async()=>{
    const onStart=vi.fn().mockResolvedValue(undefined);
    render(<ExamsPage locale="tr" maxQuestions={349} history={[]} onStart={onStart}/>);

    expect(screen.getByRole('spinbutton',{name:'Bitiş'})).toHaveAttribute('max','349');
    fireEvent.click(screen.getByRole('button',{name:'Tümünü seç'}));
    fireEvent.click(screen.getByRole('button',{name:'Orijinal sıra'}));
    fireEvent.click(screen.getByRole('button',{name:'Başla'}));

    await waitFor(()=>expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      questionCount:349,
      randomizeQuestions:false,
      rangeStart:1,
      rangeEnd:349
    })));
  });
});
