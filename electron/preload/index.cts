import { contextBridge, ipcRenderer } from 'electron';
import type { AppApi } from '../../shared/contracts.js';
const invoke=<T,>(channel:string,...args:unknown[])=>ipcRenderer.invoke(channel,...args) as Promise<T>;
const api:AppApi={
 system:{getInfo:()=>invoke('system:info'),openFile:k=>invoke('system:open-file',k),saveFile:k=>invoke('system:save-file',k)},
 catalog:{listProviders:()=>invoke('catalog:providers'),createProvider:x=>invoke('catalog:create-provider',x),listCertifications:()=>invoke('catalog:certifications'),createCertification:x=>invoke('catalog:create-certification',x),listCategories:id=>invoke('catalog:categories',id),createCategory:x=>invoke('catalog:create-category',x)},
 questions:{list:f=>invoke('questions:list',f),get:id=>invoke('questions:get',id),save:x=>invoke('questions:save',x),remove:id=>invoke('questions:remove',id),duplicate:id=>invoke('questions:duplicate',id),toggleBookmark:id=>invoke('questions:bookmark',id),export:f=>invoke('questions:export',f)},
 exams:{create:x=>invoke('exams:create',x),active:()=>invoke('exams:active'),get:id=>invoke('exams:get',id),answer:x=>invoke('exams:answer',x),navigate:x=>invoke('exams:navigate',x),setStatus:x=>invoke('exams:status',x),submit:id=>invoke('exams:submit',id),history:()=>invoke('exams:history')},
 stats:{dashboard:()=>invoke('stats:dashboard'),reset:()=>invoke('stats:reset')},imports:{preview:x=>invoke('imports:preview',x),commit:x=>invoke('imports:commit',x)},
 translations:{list:id=>invoke('translations:list',id),save:x=>invoke('translations:save',x),glossary:()=>invoke('translations:glossary'),saveTerm:x=>invoke('translations:save-term',x),removeTerm:id=>invoke('translations:remove-term',id),translate:x=>invoke('translations:translate',x),explain:x=>invoke('translations:explain',x)},
 backup:{create:p=>invoke('backup:create',p),restore:p=>invoke('backup:restore',p),integrity:()=>invoke('backup:integrity')},settings:{get:()=>invoke('settings:get'),set:(k,v)=>invoke('settings:set',k,v),setCredential:(p,s)=>invoke('settings:credential',p,s),testAi:p=>invoke('settings:test-ai',p)}
};contextBridge.exposeInMainWorld('certmaster',api);
