import {Capacitor} from '@capacitor/core';
import {Directory,Encoding,Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import type {MobileBackup} from '../models';

export async function exportBackup(backup:MobileBackup){
  const filename=`certmaster-mobile-${backup.createdAt.slice(0,10)}.json`,data=JSON.stringify(backup,null,2);
  if(Capacitor.isNativePlatform()){
    await Filesystem.writeFile({path:filename,data,directory:Directory.Cache,encoding:Encoding.UTF8});
    const file=await Filesystem.getUri({path:filename,directory:Directory.Cache});
    await Share.share({title:'CertMaster AI Yedeği',text:'CertMaster AI yerel veri yedeği',url:file.uri,dialogTitle:'Yedeği Kaydet veya Paylaş'});return;
  }
  const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url);
}

export async function readBackup(file:File):Promise<MobileBackup>{
  const parsed=JSON.parse(await file.text()) as MobileBackup;
  if(parsed.format!=='certmaster-mobile-backup'||parsed.version!==1||!Array.isArray(parsed.sessions)||!Array.isArray(parsed.attempts)||!Array.isArray(parsed.bookmarks))throw new Error('Bu dosya geçerli bir CertMaster AI mobil yedeği değil.');
  return parsed;
}
