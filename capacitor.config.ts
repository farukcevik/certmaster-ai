import type {CapacitorConfig} from '@capacitor/cli';

const config:CapacitorConfig={
  appId:'com.farukcevik.certmasterai',
  appName:'CertMaster AI',
  webDir:'dist-mobile',
  ios:{contentInset:'always',preferredContentMode:'mobile'},
  plugins:{
    CapacitorSQLite:{iosDatabaseLocation:'Library/CapacitorDatabase',iosIsEncryption:false},
    SplashScreen:{launchShowDuration:1200,backgroundColor:'#F5F7FF'}
  }
};

export default config;
