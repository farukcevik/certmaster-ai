import React from 'react';
import ReactDOM from 'react-dom/client';
import {App as CapacitorApp} from '@capacitor/app';
import {MobileApp} from './MobileApp';
import {useMobileStore} from './store';
import './styles.css';

CapacitorApp.addListener('appStateChange',async ({isActive})=>{
  if(!isActive){const session=useMobileStore.getState().session;if(session)await useMobileStore.getState().saveSession(session)}
});

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><MobileApp/></React.StrictMode>);
