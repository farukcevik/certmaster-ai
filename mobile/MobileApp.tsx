import {LoaderCircle,WifiOff} from 'lucide-react';
import {useEffect} from 'react';
import {BottomNavigation,type MobileTab} from './components/BottomNavigation';
import {ExamScreen} from './pages/ExamScreen';
import {ExamsPage} from './pages/ExamsPage';
import {HomePage} from './pages/HomePage';
import {QuestionsPage} from './pages/QuestionsPage';
import {ResultsScreen} from './pages/ResultsScreen';
import {SettingsPage} from './pages/SettingsPage';
import {StatisticsPage} from './pages/StatisticsPage';
import {useMobileStore} from './store';

export function MobileApp(){
  const store=useMobileStore();
  useEffect(()=>{void store.initialize()},[]);
  useEffect(()=>{if(store.settings)document.documentElement.dataset.theme=store.settings.theme},[store.settings]);
  if(!store.ready)return <div className="launch-screen"><div className="app-logo">CM</div><h1>CertMaster AI</h1><LoaderCircle className="spin"/><span>Çevrimdışı çalışma alanı hazırlanıyor</span></div>;
  if(store.error||!store.statistics||!store.settings)return <div className="fatal-screen"><WifiOff/><h1>Uygulama başlatılamadı</h1><p>{store.error}</p><button onClick={()=>location.reload()}>Tekrar Dene</button></div>;
  const locale=store.settings.interfaceLanguage;
  if(store.screen==='exam'&&store.session)return <ExamScreen session={store.session} questions={store.questions} locale={locale} onClose={()=>void store.closeExam()} onFinish={()=>void store.finish()}/>;
  if(store.screen==='results'&&store.result)return <ResultsScreen session={store.result} locale={locale} onHome={()=>useMobileStore.setState({screen:'tabs',tab:'home',result:null})} onRetry={()=>useMobileStore.setState({screen:'tabs',tab:'exams',result:null})}/>;
  return <div className="mobile-shell"><div className="offline-indicator"><WifiOff/> {locale==='tr'?'Çevrimdışı hazır':'Offline ready'}</div>{store.tab==='home'&&<HomePage locale={locale} statistics={store.statistics} session={store.session} onStart={config=>void store.start(config)} onResume={()=>void store.resume()}/>} {store.tab==='exams'&&<ExamsPage locale={locale} onStart={store.start}/>} {store.tab==='questions'&&<QuestionsPage questions={store.questions} locale={locale} onBookmark={id=>void store.toggleBookmark(id)}/>} {store.tab==='statistics'&&<StatisticsPage statistics={store.statistics} locale={locale}/>} {store.tab==='settings'&&<SettingsPage settings={store.settings} locale={locale} onSave={settings=>void store.saveSettings(settings)} onReset={store.resetStatistics}/>}<BottomNavigation active={store.tab as MobileTab} locale={locale} onChange={store.setTab}/></div>;
}
