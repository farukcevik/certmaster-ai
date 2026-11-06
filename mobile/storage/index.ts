import {Capacitor} from '@capacitor/core';
import {BrowserMobileRepository} from './browserRepository';
import {NativeSQLiteRepository} from './nativeSQLiteRepository';
import type {MobileRepository} from './repository';

export const repository:MobileRepository=Capacitor.isNativePlatform()?new NativeSQLiteRepository():new BrowserMobileRepository();
