# FITCORE 0.2.0 — Doğrulama raporu

## 16 Ekim 2026 · 0.2 güncellemesi

- TypeScript, ESLint ve üretim derlemesi geçti; 16/16 otomatik test başarılı.
- Teslim edilen `release-v020/win-unpacked/FITCORE.exe` üzerinde üç test grubu geçti: `test:guest`, `test:desktop`, `test:files`.
- İlk ekrandan hiçbir alan doldurmadan misafir girişi; 10 sayfa; uygulamayı kapatıp açınca misafir durumunun korunması doğrulandı.
- Misafirden kişisel profile geçiş, içe aktarılan program önizlemesi, mevcut su kaydının korunması ve kişisel kurulumu yeniden açma doğrulandı.
- Otomatik programlı kurulum, antrenman/set kalıcılığı ve 10 ekran akışında renderer hatası: 0.
- JSON yedek/geri yükleme, geçersiz yedeği reddetme, CSV/PDF çıktı ve TXT/XLSX/PDF içe aktarma paketli uygulamada geçti.
- İlk ekran görseli: `../FITCORE-karsilama.png`.
- Eski paket açık olduğundan dosya kilidine takılmamak için yeni paket `release-v020/` klasöründe üretildi.
- GitHub Actions yapılandırması eklendi; uzak CI henüz çalıştırılmadı. Aşağıdaki sandbox, kurulum ve 3D sınırları devam eder.

## Önceki sürümün doğrulama ayrıntıları

Tarih: 15 Ekim 2026. Ortam: Windows x64, Node.js 26.7.0, Electron 40.10.6.

## Geçen kontroller

- TypeScript strict kontrolü (`tsc --noEmit`).
- ESLint (`npm run lint`).
- Vite + Electron main/preload üretim derlemesi.
- 8 otomatik domain/veritabanı testi: manuel set onayı, eksik setlerle bitirme, duraklatma ve donmuş dinlenme sayacı, tek aktif oturum kuralı, giriş doğrulama, program ayrıştırma, SQLite yeniden açılış kalıcılığı, bozuk geri yüklemede verinin korunması, kalori denklemi ve program silinince geçmişin korunması. Bazı testler birden fazla davranışı denetler.
- SQLite `integrity_check=ok`, `foreign_key_check` boş sonuç.
- Gerçek Electron penceresinde profil → program → set onayı → duraklat → kapat/aç → devam et → bitir akışı.
- Aynı genişletilmiş masaüstü akışı teslim edilen `release/win-unpacked/FITCORE.exe` üzerinde de geçti (10 ekran, veri kalıcılığı, besin/su/ölçüm/hedef/hatırlatıcı, tema; renderer hatası: 0).
- İşaretlenmeyen 2 setin yeniden açma/bitirmeden sonra tamamlanmış sayılmadığının kontrolü.
- Gerçek arayüzden besin, su, vücut ölçümü, hedef ve hatırlatıcı ekleme.
- Açık/koyu tema değişimi ve 10 sayfanın açılması; yakalanan renderer hatası yok.
- Gerçek Electron IPC/dosya işlemleriyle JSON yedek, geri yükleme, geçersiz yedeği reddetme, CSV üretimi, Chromium PDF üretimi, TXT/XLSX/PDF program metni okuma. Bu testlerde yerel dosya diyalogları test dosyalarını döndürecek şekilde değiştirilir; gerçek dosya okuma/yazma ve ayrıştırma kodu çalışır.
- Dosya işlemleri testlerinin tamamı paketlenmiş `FITCORE.exe` üzerinde de geçti; üretim bağımlılıklarının paket içinde bulunduğu doğrulandı.
- Dashboard ekran görüntüsü görsel olarak incelendi: `../FITCORE-dashboard.png`. Görseldeki kayıtlar yalnızca izole test profiline aittir.

## Sınırlar

- İç içe Windows sandbox ortamı Chromium'u varsayılan sandbox ile başlatamadı (0x80000003). Test başlatıcısında `FITCORE_TEST_CONTAINER=1` ile `--no-sandbox --disable-gpu` kullanıldı. Normal uygulama/dağıtım ayarlarına bu bayraklar eklenmedi. Tam güvenlik yapılandırmasıyla gerçek Windows oturumunda kabul testi hâlâ gerekir.
- Windows tepsi simgesinin ve bildirim balonunun gerçek kullanıcı masaüstünde gösterimi doğrulanamadı. Açılış kaydı kullanıcı sistemine değiştirilmedi.
- NSIS kurulum üretiminde `makensis.exe` çalıştırılması `spawn UNKNOWN` hatası verdi; imzalı/kurulu sürüm kabul testi yapılmadı. `win-unpacked` uygulama klasörü üretildi.
- 3D yükleyici derlenmiştir; lisanslı gerçek animasyon varlığı olmadığı için animasyon doğruluğu, kamera/oynatma ve kas vurgulama kabul testi yapılmadı. Bu sürümde kullanıcıya gerçek 3D egzersiz sunulduğu iddia edilmez.
- Büyük veri, ekran okuyucu ile kapsamlı erişilebilirlik, güç kesintisi, farklı Windows sürümleri ve bağımsız güvenlik denetimi yapılmadı.

Tekrar üretme komutları ve kalan kapsam `README.md` içindedir. Testler kullanıcı profilini değiştirmeden `work/` altındaki ayrı veri klasörlerinde çalışır.
