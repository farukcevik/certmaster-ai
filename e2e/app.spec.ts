import {test,expect,_electron as electron} from '@playwright/test';
import {copyFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

test('application starts offline and exposes core navigation',async()=>{
  test.setTimeout(60_000);
  const userData=mkdtempSync(join(tmpdir(),'certmaster-e2e-'));
  const seededDatabase=process.env.CERTMASTER_E2E_DATABASE;if(seededDatabase)copyFileSync(seededDatabase,join(userData,'certmaster.db'));
  const executablePath=process.env.CERTMASTER_E2E_EXECUTABLE;
  const app=await electron.launch({executablePath,args:executablePath?[`--user-data-dir=${userData}`]:['.',`--user-data-dir=${userData}`]});
  try{
    const window=await app.firstWindow();
    await expect(window).toHaveTitle(/CertMaster AI/);
    await expect(window.getByText('Çalışma Özeti')).toBeVisible();
    await expect(window.getByText('Çevrimdışı kullanıma hazır')).toBeVisible();
    await window.getByText('Sertifika Kütüphanesi').click();
    await expect(window.getByRole('heading',{name:'Sertifika Kütüphanesi'})).toBeVisible();
    await expect(window.getByText('Professional Data Engineer',{exact:true})).toBeVisible();
    if(seededDatabase){
      await window.getByText('Soru Bankası',{exact:true}).click();
      await expect(window.getByText(/TensorFlow neutral-network model/)).toBeVisible();
      await window.getByText('Sınav Başlat',{exact:true}).click();
      await window.getByLabel('Soru sayısı').fill('349');
      await window.getByLabel('Soruları karıştır').uncheck();
      await window.getByRole('button',{name:/Oturumu Başlat/}).click();
      await expect(window.getByText(/Soru 1\/349/)).toBeVisible();
      await window.getByRole('button',{name:'63',exact:true}).click();
      await expect(window.getByRole('img',{name:/X ve Y eksenlerinde/})).toBeVisible();
      await window.screenshot({path:join(process.cwd(),'test-results/question-image-rendering.png'),fullPage:true});
      await window.getByRole('button',{name:'83',exact:true}).click();
      await expect(window.getByRole('heading',{name:'Flowlogistic Case Study'})).toBeVisible();
      await expect(window.getByRole('heading',{name:'Company Overview'})).toBeVisible();
      await expect(window.getByRole('heading',{name:'Business Requirements'})).toBeVisible();
      await expect(window.getByText("Flowlogistic's management",{exact:false})).toBeVisible();
      await window.getByRole('button',{name:'Bölünmüş vaka görünümü'}).click();
      await expect(window.getByRole('button',{name:'Standart görünüm'})).toBeVisible();
      await window.screenshot({path:join(process.cwd(),'test-results','flowlogistic-structured.png'),fullPage:true});
      await window.getByText('Soru Bankası',{exact:true}).click();
      await window.getByPlaceholder('Soru metni veya açıklamada ara…').fill('taking days to train');
      await window.getByTitle('Soruyu ve doğru cevabı düzenle').click();
      await expect(window.getByText('Doğru cevap seçimi')).toBeVisible();
      await window.getByLabel(/A.*Doğru cevap/).check();
      await window.screenshot({path:join(process.cwd(),'test-results/correct-answer-editor.png'),fullPage:true});
      await window.getByRole('button',{name:'Soruyu ve Doğru Cevabı Kaydet'}).click();
      await expect(window.getByText('1 doğru')).toBeVisible();
      await window.getByText('Ayarlar',{exact:true}).click();
      await window.getByRole('button',{name:'Tüm İstatistikleri Sıfırla'}).click();
      await expect(window.getByText(/Tüm sınav geçmişi, puanlar ve cevap denemeleri kalıcı olarak silinecek/)).toBeVisible();
      await window.getByRole('button',{name:'İptal'}).click();
    }
  }finally{
    await app.close();
    rmSync(userData,{recursive:true,force:true});
  }
});
