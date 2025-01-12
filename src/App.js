import React, { useState, useEffect } from 'react';
import { createWorker, createScheduler, PSM } from 'tesseract.js';
import { franc } from 'franc-min';
import LanguageDetect from 'languagedetect';
import CoordinatesSelector from './components/CoordinatesSelector';
import TemplateEditor from './components/TemplateEditor';
import languages from './assets/languages';
import './App.css';

const App = () => {
  const [imageData, setImageData] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [template, setTemplate] = useState([]);
  const [lang, setLang] = useState('tur');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [autoDetectProgress, setAutoDetectProgress] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  const preprocessImage = (ctx, canvas) => {
    // Görüntüyü siyah beyaz yap
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Eşik değeri ile siyah beyaz dönüşümü
      const threshold = 180;
      const value = avg > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
    }
    
    ctx.putImageData(imageData, 0, 0);

    // Keskinleştirme filtresi
    ctx.filter = 'contrast(1.4) brightness(1.1) saturate(1.2)';
    ctx.drawImage(canvas, 0, 0);
    
    // Filtreleri sıfırla
    ctx.filter = 'none';
  };

  const detectTextRegions = async (imageData) => {
    try {
      const worker = await createWorker();
      await worker.loadLanguage(lang);
      await worker.initialize(lang);
      
      // Önce sayfa düzenini analiz et
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        tessjs_create_hocr: '1',
        tessjs_create_tsv: '1',
      });

      const { data } = await worker.recognize(imageData);
      const { hocr, tsv } = data;
      
      // HOCR'dan metin bölgelerini çıkar
      const parser = new DOMParser();
      const doc = parser.parseFromString(hocr, 'text/html');
      
      // Satır seviyesinde bölgeleri al
      const lines = Array.from(doc.getElementsByClassName('ocr_line'));
      const regions = [];

      // TSV'den güven skorlarını al
      const confidenceMap = new Map();
      const tsvLines = tsv.split('\n');
      tsvLines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length >= 11) {
          const [, , , , , , , , conf] = parts;
          const text = parts[11];
          if (text && conf) {
            confidenceMap.set(text.trim(), parseFloat(conf));
          }
        }
      });

      lines.forEach((line) => {
        const title = line.getAttribute('title');
        if (!title) return;

        const bbox = title.match(/bbox (\d+) (\d+) (\d+) (\d+)/);
        if (!bbox) return;

        const [, x1, y1, x2, y2] = bbox.map(Number);
        const words = Array.from(line.getElementsByClassName('ocrx_word'));
        
        // Satırdaki kelimelerin ortalama güven skorunu hesapla
        let totalConfidence = 0;
        let wordCount = 0;
        let hasValidText = false;

        words.forEach(word => {
          const text = word.textContent.trim();
          if (text.length > 0) {
            hasValidText = true;
          }
          if (confidenceMap.has(text)) {
            totalConfidence += confidenceMap.get(text);
            wordCount++;
          }
        });

        const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;
        
        // Minimum güven skoruna ve boyuta sahip satırları filtrele
        const minWidth = 20;  // minimum 20 piksel genişlik
        const minHeight = 10; // minimum 10 piksel yükseklik
        const width = x2 - x1;
        const height = y2 - y1;

        if (averageConfidence > 30 && width >= minWidth && height >= minHeight && hasValidText) {
          // Satırın etrafına biraz boşluk ekle
          const padding = 5;
          regions.push({
            x: Math.max(0, x1 - padding),
            y: Math.max(0, y1 - padding),
            width: width + (padding * 2),
            height: height + (padding * 2),
            confidence: averageConfidence,
          });
        }
      });

      await worker.terminate();
      console.log('Tespit edilen satırlar:', regions);
      return regions;
    } catch (err) {
      console.error('Metin satırı tespit hatası:', err);
      throw err;
    }
  };

  const handleOCR = async (selection = null) => {
    const targetSelection = selection || pendingSelection;
    if (!imageData || !targetSelection) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Canvas oluştur
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        // Seçilen alanı kırp
        const scale = 3; // 3x büyütme
        canvas.width = targetSelection.width * scale;
        canvas.height = targetSelection.height * scale;
        
        // Görüntü işleme ayarları
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(
          img,
          targetSelection.x,
          targetSelection.y,
          targetSelection.width,
          targetSelection.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Görüntü ön işleme
        preprocessImage(ctx, canvas);

        try {
          // OCR işlemi
          const worker = await createWorker();
          
          // OCR ayarları
          await worker.loadLanguage(lang);
          await worker.initialize(lang);
          await worker.setParameters({
            tessedit_pageseg_mode: '7', // Tek metin bloğu olarak işle
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzğüşıöçĞÜŞİÖÇ0123456789.,:-_@/\\()[]{}%&*+=' + ' ', // Boşluk ekledik
            tessjs_create_pdf: '0',
            tessjs_create_hocr: '0',
            preserve_interword_spaces: '1',
            user_defined_dpi: '300',
            textord_heavy_nr: '1', // Gürültü azaltma
            textord_min_linesize: '3.0', // Minimum satır boyutu
            edges_max_children_per_outline: '40', // Karakter tanıma hassasiyeti
            edges_children_per_grandchild: '10',
            edges_children_count_limit: '45',
            edges_min_nonhole: '12',
            edges_threshold_greedy: '50',
            paragraph_text_based: '1',
            language_model_penalty_non_freq_dict_word: '0.15',
            language_model_penalty_non_dict_word: '0.15',
            language_model_min_compound_length: '3',
            textord_force_make_prop_words: 'F',
            tessedit_enable_dict_correction: '1',
            tessedit_enable_bigram_correction: '1',
          });

          const result = await worker.recognize(canvas.toDataURL('image/png'));
          
          // Sonucu temizle ve düzenle
          const cleanText = result.data.text
            .trim()
            .replace(/[\n\r]+/g, ' ') // Satır sonlarını boşluğa çevir
            .replace(/\s+/g, ' ') // Fazla boşlukları tek boşluğa indir
            .replace(/([.,!?:;])\s*/g, '$1 ') // Noktalama işaretlerinden sonra tek boşluk
            .trim();

          setTemplate((prevTemplate) => [
            ...prevTemplate,
            {
              id: Date.now(),
              label: `Seçim ${prevTemplate.length + 1}`,
              coordinates: targetSelection,
              ocrText: cleanText,
              confidence: result.data.confidence,
            },
          ]);

          // İşlem bittikten sonra seçimi sıfırla
          setPendingSelection(null);
          await worker.terminate();
          setIsProcessing(false);
        } catch (err) {
          setError('OCR işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
          console.error('OCR Error:', err);
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setError('Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        setIsProcessing(false);
      };

      img.src = imageData;
    } catch (err) {
      setError('Görüntü işleme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      console.error('Error:', err);
      setIsProcessing(false);
    }
  };

  // Dil algılama fonksiyonu
  const detectLanguage = async (imageData) => {
    try {
      // OCR ile metni çıkar
      const worker = await createWorker();
      // Daha geniş dil desteği için multi-language modeli kullan
      await worker.loadLanguage('osd');
      await worker.initialize('osd');
      
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      if (!text || text.trim().length < 10) {
        console.log('Yeterli metin bulunamadı');
        return 'eng';
      }

      // Dil algılama kütüphanelerini hazırla
      const lngDetector = new LanguageDetect();
      // Franc için dil kısıtlamasını kaldır ve minimum metin uzunluğunu azalt
      const francResult = franc(text, { minLength: 5 });

      // LanguageDetect ile dil tespiti (yedek olarak)
      const detectResults = lngDetector.detect(text, 10); // Daha fazla alternatif dil getir

      console.log('Dil tespit sonuçları:', {
        text: text.substring(0, 100) + '...',
        franc: francResult,
        languagedetect: detectResults
      });

      // Sonuçları değerlendir ve güven skorlarını hesapla
      let languageScores = new Map();

      // Franc sonucunu değerlendir (ana dil tespiti olarak)
      if (francResult !== 'und') {
        languageScores.set(francResult, 0.8); // Franc'a daha yüksek güven (%80)
      }

      // LanguageDetect sonuçlarını değerlendir (yedek olarak)
      if (detectResults && detectResults.length > 0) {
        detectResults.forEach(([lang, probability]) => {
          const mappedLang = mapDetectorLanguage(lang);
          if (mappedLang) {
            const currentScore = languageScores.get(mappedLang) || 0;
            languageScores.set(mappedLang, currentScore + (probability * 0.2)); // LanguageDetect'e daha düşük güven (%20)
          }
        });
      }

      // En yüksek skora sahip dili seç
      let bestLang = 'eng';
      let bestScore = 0;
      
      languageScores.forEach((score, lang) => {
        // Eğer dil Tesseract tarafından destekleniyorsa değerlendir
        if (languageMap[lang]) {
          if (score > bestScore) {
            bestScore = score;
            bestLang = lang;
          }
        }
      });

      // Eğer güven skoru çok düşükse varsayılan dili kullan
      const finalLang = bestScore > 0.3 ? mapLanguageCode(bestLang) : 'eng';
      console.log('Seçilen dil:', finalLang, 'Güven skoru:', bestScore);
      return finalLang;
    } catch (err) {
      console.error('Dil algılama hatası:', err);
      return 'eng';
    }
  };

  // LanguageDetect'in dil kodlarını bizim formatımıza çevir
  const mapDetectorLanguage = (detectedLang) => {
    const languageMapping = {
      'turkish': 'tur',
      'english': 'eng',
      'german': 'deu',
      'french': 'fra',
      'spanish': 'spa',
      'italian': 'ita',
      'portuguese': 'por',
      'russian': 'rus',
      'arabic': 'ara',
      'hindi': 'hin',
      'japanese': 'jpn',
      'korean': 'kor',
      'chinese': 'chi_sim',
      'dutch': 'nld',
      'ukrainian': 'ukr',
      'vietnamese': 'vie',
      'czech': 'ces',
      'danish': 'dan',
      'finnish': 'fin',
      'greek': 'ell',
      'hebrew': 'heb',
      'hungarian': 'hun',
      'indonesian': 'ind',
      'latvian': 'lav',
      'lithuanian': 'lit',
      'norwegian': 'nor',
      'polish': 'pol',
      'romanian': 'ron',
      'slovak': 'slk',
      'slovenian': 'slv',
      'swedish': 'swe',
      'thai': 'tha'
    };
    
    return languageMapping[detectedLang.toLowerCase()] || null;
  };

  // Dil kodlarını Tesseract formatına çevir
  const languageMap = {
    tur: 'tur',
    eng: 'eng',
    deu: 'deu',
    fra: 'fra',
    spa: 'spa',
    ita: 'ita',
    por: 'por',
    rus: 'rus',
    ara: 'ara',
    hin: 'hin',
    jpn: 'jpn',
    kor: 'kor',
    chi: 'chi_sim',
    chi_tra: 'chi_tra',
    nld: 'nld',
    ukr: 'ukr',
    vie: 'vie',
    ces: 'ces',
    dan: 'dan',
    fin: 'fin',
    ell: 'ell',
    heb: 'heb',
    hun: 'hun',
    ind: 'ind',
    lav: 'lav',
    lit: 'lit',
    nor: 'nor',
    pol: 'pol',
    ron: 'ron',
    slk: 'slk',
    slv: 'slv',
    swe: 'swe',
    tha: 'tha',
    tur: 'tur'
  };

  const mapLanguageCode = (code) => {
    return languageMap[code] || 'eng';
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setTemplate([]);
      setPendingSelection(null);
      setAutoDetectProgress(0);

      // Resmi base64'e çevir
      const base64Image = await new Promise((resolve, reject) => {
    const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
    reader.readAsDataURL(file);
      });

      setImageData(base64Image);

      // Önce dili tespit et
      const detectedLang = await detectLanguage(base64Image);
      setLang(detectedLang);
      setDetectedLanguage(detectedLang);
      console.log('Tespit edilen dil:', detectedLang);

      // Metin bölgelerini tespit et
      const regions = await detectTextRegions(base64Image);
      
      // Her bölge için OCR işlemi yap
      const totalRegions = regions.length;
      console.log(`Tespit edilen bölge sayısı: ${totalRegions}`);

      for (let i = 0; i < totalRegions; i++) {
        const region = regions[i];
        console.log(`Bölge ${i + 1} işleniyor:`, region);
        
        await handleOCR({
          ...region,
          canvasWidth: 800,
          canvasHeight: 600,
        });
        setAutoDetectProgress(((i + 1) / totalRegions) * 100);
      }
    } catch (err) {
      console.error('Resim yükleme hatası:', err);
      setError('Otomatik metin tespiti sırasında bir hata oluştu.');
    } finally {
      setIsProcessing(false);
      setAutoDetectProgress(0);
    }
  };

  const handleLanguageChange = (e) => {
    setLang(e.target.value);
  };

  const handleDeleteSelection = (id) => {
    setTemplate(prevTemplate => prevTemplate.filter(item => item.id !== id));
  };

  const handleClearSelections = () => {
    setTemplate([]);
    setPendingSelection(null);
  };

  const handleSelectionChange = (coords) => {
    setPendingSelection(coords);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>IBO OCR</h1>
        <p className="subtitle">Resim Üzerinde Metin Tanıma</p>
      </header>

      <main className="main-content">
        <div className="controls-section">
          <div className="language-selector">
            <label htmlFor="language">Dil Seçimi:</label>
            <select
              id="language"
              value={lang}
              onChange={handleLanguageChange}
              className={`select-input ${detectedLanguage === lang ? 'detected-language' : ''}`}
            >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
                  {language.name} {detectedLanguage === language.code ? '(Tespit Edilen)' : ''}
          </option>
        ))}
      </select>
          </div>

          <div className="file-upload">
            <label htmlFor="image-upload" className="upload-button">
              Resim Yükle
      <input
                id="image-upload"
        type="file"
                onChange={handleImageChange}
        accept="image/*"
                className="hidden-input"
              />
            </label>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

      {imageData && (
          <div className="image-processing-section">
          <CoordinatesSelector
            imageData={imageData}
              onSelection={handleSelectionChange}
              isProcessing={isProcessing}
              selectedAreas={template.map(item => item.coordinates)}
              pendingSelection={pendingSelection}
            />
            
            {pendingSelection && !isProcessing && (
              <button 
                onClick={() => handleOCR()}
                className="recognize-button"
              >
                Metni Tanı
              </button>
            )}

            {isProcessing && autoDetectProgress > 0 && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${autoDetectProgress}%` }}
                />
                <span className="progress-text">
                  Otomatik Tanıma: %{Math.round(autoDetectProgress)}
                </span>
              </div>
            )}

            {template.length > 0 && (
              <div className="results-section">
                <div className="results-header">
                  <h2>Tanınan Metinler</h2>
                  <button 
                    onClick={handleClearSelections}
                    className="clear-button"
                  >
                    Tümünü Temizle
                  </button>
                </div>
                <TemplateEditor 
                  template={template} 
                  onDelete={handleDeleteSelection}
                />
              </div>
            )}
        </div>
        )}

        {isProcessing && (
          <div className="processing-overlay">
            <div className="spinner"></div>
            <p>İşleniyor...</p>
            {autoDetectProgress > 0 && (
              <p>Otomatik Tanıma: %{Math.round(autoDetectProgress)}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
