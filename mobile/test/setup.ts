import '@testing-library/jest-dom/vitest';

// Node 25 exposes an incomplete experimental localStorage global unless a
// backing file is configured. Mobile repository tests need browser semantics.
const values=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
  get length(){return values.size},
  clear:()=>values.clear(),
  getItem:(key:string)=>values.get(key)??null,
  key:(index:number)=>[...values.keys()][index]??null,
  removeItem:(key:string)=>values.delete(key),
  setItem:(key:string,value:string)=>values.set(key,String(value))
} satisfies Storage});
