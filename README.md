# FITCORE Desktop · 0.2.0

Türkçe, çevrimdışı çalışan Windows masaüstü fitness günlüğü. Bu teslim, kapsamlı ürün tarifinin **ilk çalışan sürümüdür**; eksik ileri özellikler aşağıda açıkça listelenmiştir.

## Yeni: kişisel kurulum ve misafir kullanımı

İlk ekrandaki **Hepsini atla · Misafir olarak devam et** düğmesi hiçbir zorunlu alanı doldurmadan uygulamayı açar. Misafir kayıtları da yerel SQLite veritabanında kalıcıdır; yeniden açılışta kurulum zorunlu tutulmaz. Sahte isim, yaş, boy, kilo, ölçüm veya günlük hedef oluşturulmaz. Kişisel veriye bağlı BMI ve hedefler bilgi girilene kadar boş gösterilir. Misafirken program, antrenman, beslenme, su, ölçüm, hedef ve hatırlatıcı ekleyebilirsiniz.

Kişiselleştirmeyi seçerseniz altı adım sunulur:

1. İsim, yaş ve enerji denklemi için biyolojik cinsiyet.
2. Boy, mevcut/hedef kilo, fitness hedefi ve günlük aktivite.
3. Deneyim, haftalık sıklık, uygun günler, süre, ev/salon, mevcut ekipman ve hareket kısıtlaması.
4. Beslenme tercihi, alerji/kısıtlama notu, düzenlenebilir kalori/makro hedefleri, isteğe bağlı hatırlatma.
5. **Programım var:** PDF/XLSX/TXT içe aktarma veya elle gün ekleme; **Benim için oluştur:** yanıtlarla eşleşen program taslağı. Önceden kayıtlı programlar varsa onları koruma seçeneği de vardır.
6. Kişisel hedefler, son program günleri ve hatırlatıcıların özeti; açık kullanıcı onayından sonra tek transaction ile kayıt.

Otomatik öneri internet veya yapay zekâ API'si gerektirmeyen, açıklanabilir kurallı bir başlangıç taslağıdır. Ekipmansız, yalnızca dambıl ve tam salon yolları ayrıdır; günler, seviye, süre ve fitness hedefi set/hareket seçimini etkiler. 1–3 günde tüm vücut, 4 günde üst/alt dönüşümü kullanılır. 1–4 kuvvet günü desteklenir; 5–7 gün için mevcut programınızı ekleyin. Kullanıcı başlangıç yükünü kendisi belirler; **0 kg bilinçli olarak yük atanmadığını ifade eder**. Hareket kısıtlaması belirtildiğinde otomatik öneri sunulmaz; kişiye uygun uzman programı eklenebilir. Taslak son onay öncesinde düzenlenebilir; doğrulanmış kişisel antrenör değerlendirmesi yerine geçmez.

Beslenme taslağında Mifflin–St Jeor enerji hesabı ve %20/%50/%30 protein/karbonhidrat/yağ enerji dağılımı başlangıç varsayımlarıdır; hedefler düzenlenebilir. Alerji bilgisi otomatik menü veya tıbbi öneri üretmez. Genel aktivite bağlamı: [CDC yetişkin aktivite rehberi](https://www.cdc.gov/physical-activity-basics/adding-adults/).

**Ayarlar → Kişisel kurulumu yeniden yap** ile misafirden kişisel kullanıma geçebilirsiniz. Misafir kayıtlarınız korunur. Yeniden kurulumda mevcut programlar varsayılan olarak korunur; değiştirmek ayrıca seçilir. İlk kişisel kurulum yalnızca ölçüm kaydı yoksa başlangıç ölçümü ekler. Eski 0.1 yedekleri desteklenir; migration v2 yeni egzersizleri kullanıcı verisini silmeden ekler.

## Çalıştırma

Hazır 0.2 uygulama: `release-v020/win-unpacked/FITCORE.exe`. Yeniden paketleme varsayılan olarak `release/win-unpacked/` klasörünü üretir.

Bu EXE'yi **yanındaki dosyalardan ayırmayın**. `win-unpacked` klasörünün tamamı birlikte taşınmalıdır. İlk açılışta profilinizi oluşturabilir veya misafir olarak devam edebilirsiniz. Test verileri teslim edilen uygulamanın kullanıcı veritabanına eklenmez.

Geliştirme için Node.js 22.13+ (önerilen 24 LTS), npm ve Windows x64 gerekir:

```powershell
npm ci
npm run build
npm start
```

`npm run dev`, üretim arayüzünü derleyip gerçek Electron penceresini açar; geliştirme sunucusu veya HMR kullanmaz. Uygulama kullanımında Node.js kurulumu ve internet gerekmez. Bağımlılık kurulumu/paketleme sırasında internet gerekir.

## Kullanım

1. Profil bilgilerinizi ve günlük hedeflerinizi kaydedin.
2. **Antrenman Programım → Program oluştur** ile gün, egzersiz, set, tekrar, kg ve dinlenme süresi belirleyin. Programı çoğaltarak şablon olarak kullanabilirsiniz.
3. **Başlat** ile aktif antrenmana geçin. Kg ve tekrarları düzenleyip ilgili setin onay düğmesine basın. İşaretlenmeyen setler asla otomatik tamamlanmaz.
4. Duraklatma, devam etme ve bitirme ayrı işlemlerdir. Erken bitirilen antrenmanlarda tamamlanmayan setler geçmişte açıkça gösterilir.
5. Beslenmede öğün, makro ve su kaydı; Vücut Analizi'nde tarihli kilo/çevre ölçümleri ekleyin.
6. Takvimde günlük veya haftalık tekrar eden hatırlatıcıları oluşturun.
7. Ayarlardan tema, vurgu rengi, kompakt dashboard, profil, yedek, geri yükleme, CSV ve PDF işlemlerine ulaşın.

Antrenman durumu her işlemde SQLite transaction ile diske yazılır. Uygulama yeniden açıldığında aktif antrenman geri gelir. Duraklatmadan çıkarsanız geçen süre işlemeye devam eder; duraklatılmış antrenmanın süresi ve dinlenmesi sabit kalır. Henüz onaylamadığınız set alanı düzenlemeleri kayıt sayılmaz. Notlar metin alanından çıkıldığında kaydedilir.

### İçe aktarma

TXT, CSV, metin içeren PDF ve XLSX desteklenir. İçe aktarma yerel, kurallı ayrıştırma kullanır; yapay zekâ servisi yoktur.

```text
Bench Press 4 x 10 40 kg
Incline Dumbbell Press 3 x 12 15 kg
Triceps Pushdown 4 x 12 20 kg
```

XLSX sütunları: `Egzersiz | Set | Tekrar | Kg`. Bir satır bir egzersizdir. Kütüphanedeki İngilizce isimler kullanılır. Eşleşmeyen satırlar gösterilir ve sessizce kaydedilmez. Önizlemede egzersiz, set, tekrar, ağırlık ve dinlenme süresini düzelttikten sonra kaydedin. İçe aktarma tek bir düzenlenebilir gün programı üretir; gün başlıklarını otomatik haftalık takvime ayırmaz. Taranmış PDF/OCR, XLS ve karmaşık tablo düzenleri desteklenmez. Dosya sınırı 20 MB.

### Bildirimler

Pencere kapatıldığında varsayılan olarak sistem tepsisine gizlenir. Tepsi menüsündeki **Tamamen çık**, süreci sonlandırır. Windows açılışında başlatma yalnızca paketlenmiş sürümde etkinleştirilebilir. Uygulama tamamen kapalıyken veya bilgisayar kapalıyken bildirim çalışmaz. Bildirimler yerel sistem saatiyle, seçilen dakikada kontrol edilir ve aynı gün tekrarlanmaz. Uyku sırasında kaçırılan antrenman hatırlatıcıları sonradan topluca gönderilmez; süresi geçen dinlenme bildirimi uygulama yeniden çalıştığında gelebilir. Windows bildirim izinleri ve Rahatsız Etmeyin ayarı gösterimi etkileyebilir.

### Beslenme hesapları

Mifflin–St Jeor: `10 × kilo + 6.25 × boy − 5 × yaş + (erkek: 5, kadın: −161)`. Sonuç aktivite katsayısıyla çarpılır. Hedef ayarı: kilo koruma 0, verme −300, alma +250, kas hedefi +150 kcal. Aktivite katsayıları ve hedef ayarları uygulamanın genel tahmin varsayımlarıdır; kişiye özel tıbbi reçete değildir. Kullanıcı hedefi elle belirler. Makro değerleri de düzenlenebilir. Örnek kayıtlı besinler yaklaşık değerlerdir; etiket bilgisiyle doğrulanmalıdır. Uygulama yetişkin profilleri içindir. Alerjiler kayıt altına alınır; otomatik alerjen denetimi yapılmaz.

Kaynak: [Mifflin ve arkadaşları, 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/). [NIDDK enerji ihtiyacı tahminlerinin bağlamı](https://www.niddk.nih.gov/bwp).

## Mimari

- **Electron 40 + React 19 + TypeScript**. Derleme Vite/esbuild.
- **SQLite (`node:sqlite`)** yalnızca ana süreçte. Ek yerel derleme gerektiren SQLite bağımlılığı yoktur.
- **Zod** tüm mutasyonları ve yedekleri doğrular. Saf domain reducer; arayüz yalnızca dar preload API üzerinden komut gönderir.
- **Recharts** gerçek kullanıcı kayıtlarından etkileşimli grafikler üretir.
- **Three.js** tembel yüklenen GLB/animasyon görüntüleyici altyapısı. Varlık yoksa sahte animasyon veya oynatma düğmesi gösterilmez.
- CSS tasarım tokenları, açık/koyu tema, üç vurgu rengi, azaltılmış hareket tercihi. Tailwind, Framer Motion ve Zustand bu ilk sürümde ek bağımlılık olarak kullanılmadı; görünüm ve sıralı durum güncellemeleri CSS/React ile yönetiliyor.

```text
src/domain.ts          Veri şemaları, set/oturum kuralları, hesaplar, içe aktarma
src/App.tsx             Uygulama kabuğu, dashboard, sıralı komut kuyruğu
src/Workouts.tsx        Programlar, aktif antrenman, egzersiz kütüphanesi
src/Health.tsx          Profil, beslenme, vücut ölçümleri
src/Planning.tsx        İstatistik, hedef, takvim, ayarlar
src/ui.tsx              Ortak erişilebilir form/kart/grafik bileşenleri
src/ExerciseViewer.tsx  GLB animasyon oynatıcı altyapısı
src/animation-assets.ts İncelenmiş animasyonların kayıt defteri (şimdilik boş)
electron/database.ts   SQLite repository, migration, transaction
electron/main.ts       Pencere, IPC, dosya diyalogları, tepsi ve bildirim
electron/preload.ts    Dar API köprüsü
tests/                 İş kuralları ve veri kalıcılığı testleri
scripts/               Gerçek Electron uçtan uca testleri
```

Tablolar: `Migrations`, `Users`, `Exercises`, `WorkoutPrograms`, `WorkoutDays`, `WorkoutSessions`, `WorkoutSets`, `NutritionEntries`, `Foods`, `BodyMeasurements`, `Goals`, `Notifications`, `Settings`, `PersonalRecords`. Gün-program ve set-oturum/egzersiz ilişkileri foreign key ile korunur. Kayıt yükleri JSON sütunlarında saklanır; SQL sorgulama için setler ve rekorlar ayrıca ilişkisel olarak tutulur. Migration v1 başlangıç şemasını oluşturur. İlk sürümde bir komutta doğrulanan durumun tamamı tek transaction ile yazılır; çok yıllık büyük veri için artımlı repository güncellemeleri sonraki optimizasyon konusudur.

### Güvenlik ve veriler

`contextIsolation: true`, `nodeIntegration: false`, renderer `sandbox: true`, CSP, IPC ana pencere/frame doğrulaması, izin isteği reddi, gezinme/yeni pencere engeli bulunur. Renderer keyfi SQL, dosya yolu veya sistem komutu gönderemez. Dosyalar ana süreçte yerel dosya diyaloglarıyla seçilir. PDF rapor metinleri HTML-escape, CSV hücreleri formül enjeksiyonuna karşı escape edilir.

Normal Windows kullanıcı veri konumu: `%APPDATA%/fitcore-desktop/fitcore.sqlite` (kesin konum Electron `app.getPath('userData')`). SQLite WAL ve foreign key denetimleri etkindir. Veritabanı şifreli değildir; Windows hesabı izinleriyle korunur. Yedek dosyaları kişisel verilerinizi içerir. Geri yükleme öncesi veri klasörüne `before-restore-*.json` güvenlik kopyası yazılır. Bozuk/uyumsuz yedek mevcut veriyi değiştirmez. Harici yedekler uygulama verilerini sildiğinizde silinmez.

Electron güvenlik tasarımı: [resmî güvenlik rehberi](https://www.electronjs.org/docs/latest/tutorial/security), [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

## Test ve paketleme

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:desktop
npm run test:guest
npx tsx scripts/files-smoke.ts
npm run pack
```

`npm run pack` Windows x64 NSIS kurulum dosyasını `release/` altında üretir; klasör seçimi ve masaüstü kısayolu desteklenir. Kod imzalama sertifikası bu projeye eklenmemiştir.

Bu oturumda NSIS `makensis.exe` başlatılması ortamda `spawn UNKNOWN` hatası verdi. Bu nedenle **Setup EXE üretildiği iddia edilmiyor**; doğrudan çalıştırılan `win-unpacked/FITCORE.exe` klasörü ve normal Windows ortamında kurulum üretme komutu teslim edilir.

İzole Codex Windows test ortamı Chromium sandbox'ını iç içe başlatamadığından masaüstü testleri `FITCORE_TEST_CONTAINER=1` ile `--no-sandbox --disable-gpu` seçenekleriyle koşuldu. Bu seçenekler sadece test betiğindedir; normal `npm start` ve paketlenmiş uygulama güvenli varsayılanlarla çalışır. Sistem tepsisi/Windows bildirim balonları bu izole ortamda tam görsel doğrulanamaz; gerçek kullanıcı oturumunda son kabul testi gerekir.

## İlk sürüm kapsamı ve kalan işler

Çalışan: on ekran; profil; haftalık program düzenleme/silme/çoğaltma; set işaretleme; ağırlık/tekrar/dinlenme; duraklatma ve yeniden açınca devam; geçmiş; öğün/makro/su; ölçümler/BMI; hacim ve rekor grafikleri; manuel hedefler; takvim ve tekrarlanan bildirim altyapısı; temalar; CSV, PDF, JSON yedek/geri yükleme; önizlemeli program içe aktarma.

Henüz tamamlanmayanlar:

- Lisanslı ve antrenör tarafından doğrulanmış insan hareket animasyonları. Kütüphanedeki 21 egzersizin tamamında animasyon eksikliği açıkça gösterilir. 360° kamera, zoom, hız ve duraklatma kodu hazırdır; gerçek hareket varlığıyla doğrulanması gerekir. Kas vurgulama ve başlangıç/bitiş kareleri henüz yoktur.
- Otomatik kişiselleştirilmiş öğün önerileri, ileri öğün planlayıcı, otomatik alerjen analizi.
- Çok günlük karmaşık PDF/Excel programlarını otomatik takvime dönüştürme ve OCR.
- Tekrarlayan performans düşüşü analizi, hedefe ulaşma tarihi tahmini, ayrı rozet sistemi.
- Sürükleyerek dashboard düzenleme ve tüm kayıt türlerinde evrensel arama. Şimdiki arama egzersiz adı/kas/ekipman aramasıdır.
- Büyük veri performans testi, bildirimlerin gerçek Windows oturumunda kabul testi, kod imzalı NSIS dağıtımı ve otomatik güncelleme.

## Devam planı

1. Gerçek kullanıcı verisiyle temel sürüm kabul testi ve bildirim doğrulaması.
2. Lisans/kalite onaylı GLB varlıklarını `public/animations/` altına ekleme; `animation-assets.ts` içinde kaynak, lisans, klip ve inceleme bilgileriyle kaydetme. Ardından gerçek varlıklarla 3D QA.
3. Çok günlük içe aktarma, öğün planlama ve gelişmiş analiz.
4. Artımlı veritabanı güncellemeleri, büyük veri testleri, imzalı kurulum ve dağıtım.
