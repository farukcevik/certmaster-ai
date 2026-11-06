import {render,screen} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {QuestionContentRenderer} from './QuestionContentRenderer';

describe('QuestionContentRenderer',()=>{
  it('renders structured case studies, lists and code safely',()=>{render(<QuestionContentRenderer fallback="fallback" document={{version:1,caseStudyTitle:'Flowlogistic Case Study',caseStudyBlocks:[{type:'heading',level:2,text:'Company Overview'},{type:'list',ordered:false,items:[{text:'Track every shipment',level:0}]}],promptBlocks:[{type:'paragraph',text:'Which products should you choose?'},{type:'code',language:'sql',text:'SELECT * FROM shipments'}]}}/>);expect(screen.getByRole('heading',{name:'Flowlogistic Case Study'})).toBeTruthy();expect(screen.getByRole('heading',{name:'Company Overview'})).toBeTruthy();expect(screen.getByText('Track every shipment')).toBeTruthy();expect(screen.getByText('SELECT * FROM shipments')).toBeTruthy()});
  it('falls back to preserved plain text',()=>{render(<QuestionContentRenderer fallback={'Line one\nLine two'}/>);expect(screen.getByText(/Line one/)).toBeTruthy()});
  it('renders embedded offline question images with accessible alternative text',()=>{render(<QuestionContentRenderer fallback="image" document={{version:1,caseStudyBlocks:[],promptBlocks:[{type:'image',dataUrl:'data:image/png;base64,AA==',altText:'BigQuery örnek tablosu',caption:'Kaynak görsel',sourcePage:388}]}}/>);expect(screen.getByRole('img',{name:'BigQuery örnek tablosu'})).toHaveAttribute('src','data:image/png;base64,AA==');expect(screen.getByText(/PDF sayfası 388/)).toBeTruthy()});
});
