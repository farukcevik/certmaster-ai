import {BarChart3,BookOpen,GraduationCap,Home,Settings} from 'lucide-react';
import {t,type MobileLocale} from '../i18n';

export type MobileTab='home'|'exams'|'questions'|'statistics'|'settings';
const tabs=[{id:'home',icon:Home},{id:'exams',icon:GraduationCap},{id:'questions',icon:BookOpen},{id:'statistics',icon:BarChart3},{id:'settings',icon:Settings}] as const;

export function BottomNavigation({active,locale,onChange}:{active:MobileTab;locale:MobileLocale;onChange:(tab:MobileTab)=>void}){
  return <nav className="bottom-navigation" aria-label="Ana navigasyon">{tabs.map(({id,icon:Icon})=><button key={id} className={active===id?'active':''} onClick={()=>onChange(id)} aria-current={active===id?'page':undefined}><Icon/><span>{t(locale,id)}</span></button>)}</nav>;
}
