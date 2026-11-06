import {describe,expect,it} from 'vitest';
import {calculateScore,remainingAt,sameAnswer,shuffledDifferentFrom} from './examEngine.js';

describe('shared examination engine',()=>{
  it('preserves stable identifiers while changing option order',()=>{
    expect(shuffledDifferentFrom(['a','b','c'],['a','b','c'],()=>0.999)).toEqual(['b','c','a']);
  });

  it('validates multiple answers without depending on display order',()=>{
    expect(sameAnswer(['option-c','option-a'],['option-a','option-c'])).toBe(true);
    expect(sameAnswer(['option-a'],['option-a','option-c'])).toBe(false);
  });

  it('calculates score and elapsed countdown consistently',()=>{
    expect(calculateScore([true,false,true])).toBe(66.7);
    expect(remainingAt(120,'2026-01-01T00:00:00.000Z',Date.parse('2026-01-01T00:00:30.000Z'))).toBe(90);
    expect(remainingAt(120,'2026-01-01T00:00:00.000Z',Date.parse('2026-01-01T00:00:30.000Z'),false)).toBe(120);
  });
});
