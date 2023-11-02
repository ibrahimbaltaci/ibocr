import React, { useEffect, useState } from "react";
import { createWorker } from 'tesseract.js';
import './App.css'

function App() {
  const [ocr, setOcr] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imageDataUri, setImageDataUri] = useState("");
  const [recognizedText, setRecognizedText] = useState(""); // Yeni bir state ekledik
  const [lang, setLang] = useState("eng");

  useEffect(() => {
    const convertImageToText = async () => {
      if (!imageData) return;
      const worker = await createWorker(lang);
      const ret = await worker.recognize(imageDataUri);
      const text = ret.data.text;
      console.log(text);
      setRecognizedText(text); // Sonucu state'e kaydettik
      await worker.terminate();
    };

    convertImageToText();
  }, [imageData, imageDataUri,lang]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLang(lang);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUri = reader.result;
      console.log({ imageDataUri });
      setImageData(imageDataUri);
      setImageDataUri(imageDataUri);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="App">
      <div>
      <div>
          <p>Choose Language:</p>
          <select value={lang} onChange={handleLanguageChange}>
          <option value="eng">English</option>
  <option value="deu">German</option>
  <option value="fra">French</option>
  <option value="rus">Russian</option>
  <option value="bos">Bosnian</option>
  <option value="bul">Bulgarian</option>
  <option value="cat">Catalan; Valencian</option>
  <option value="ceb">Cebuano</option>
  <option value="ces">Czech</option>
  <option value="chi_sim">Chinese - Simplified</option>
  <option value="chi_tra">Chinese - Traditional</option>
  <option value="chr">Cherokee</option>
  <option value="cym">Welsh</option>
  <option value="dan">Danish</option>
  <option value="dzo">Dzongkha</option>
  <option value="ell">Greek, Modern (1453-)</option>
  <option value="enm">English, Middle (1100-1500)</option>
  <option value="epo">Esperanto</option>
  <option value="est">Estonian</option>
  <option value="eus">Basque</option>
  <option value="fas">Persian</option>
  <option value="fin">Finnish</option>
  <option value="frk">German Fraktur</option>
  <option value="frm">French, Middle (ca. 1400-1600)</option>
  <option value="gle">Irish</option>
  <option value="glg">Galician</option>
  <option value="grc">Greek, Ancient (-1453)</option>
  <option value="guj">Gujarati</option>
  <option value="hat">Haitian; Haitian Creole</option>
  <option value="heb">Hebrew</option>
  <option value="hin">Hindi</option>
  <option value="hrv">Croatian</option>
  <option value="hun">Hungarian</option>
  <option value="iku">Inuktitut</option>
  <option value="ind">Indonesian</option>
  <option value="isl">Icelandic</option>
  <option value="ita">Italian</option>
  <option value="ita_old">Italian - Old</option>
  <option value="jav">Javanese</option>
  <option value="jpn">Japanese</option>
  <option value="kan">Kannada</option>
  <option value="kat">Georgian</option>
  <option value="kat_old">Georgian - Old</option>
  <option value="kaz">Kazakh</option>
  <option value="khm">Central Khmer</option>
  <option value="kir">Kirghiz; Kyrgyz</option>
  <option value="kor">Korean</option>
  <option value="kur">Kurdish</option>
  <option value="lao">Lao</option>
  <option value="lat">Latin</option>
  <option value="lav">Latvian</option>
  <option value="lit">Lithuanian</option>
  <option value="mal">Malayalam</option>
  <option value="mar">Marathi</option>
  <option value="mkd">Macedonian</option>
  <option value="mlt">Maltese</option>
  <option value="msa">Malay</option>
  <option value="mya">Burmese</option>
  <option value="nep">Nepali</option>
  <option value="nld">Dutch; Flemish</option>
  <option value="nor">Norwegian</option>
  <option value="ori">Oriya</option>
  <option value="pan">Panjabi; Punjabi</option>
  <option value="pol">Polish</option>
  <option value="por">Portuguese</option>
  <option value="pus">Pushto; Pashto</option>
  <option value="ron">Romanian; Moldavian; Moldovan</option>
  <option value="rus">Russian</option>
  <option value="san">Sanskrit</option>
  <option value="sin">Sinhala; Sinhalese</option>
  <option value="slk">Slovak</option>
  <option value="slv">Slovenian</option>
  <option value="spa">Spanish; Castilian</option>
  <option value="spa_old">Spanish; Castilian - Old</option>
  <option value="sqi">Albanian</option>
  <option value="srp">Serbian</option>
  <option value="srp_latn">Serbian - Latin</option>
  <option value="swa">Swahili</option>
  <option value="swe">Swedish</option>
  <option value="syr">Syriac</option>
  <option value="tam">Tamil</option>
  <option value="tel">Telugu</option>
  <option value="tgk">Tajik</option>
  <option value="tgl">Tagalog</option>
  <option value="tha">Thai</option>
  <option value="tir">Tigrinya</option>
  <option value="tur">Turkish</option>
  <option value="uig">Uighur; Uyghur</option>
  <option value="ukr">Ukrainian</option>
  <option value="urd">Urdu</option>
  <option value="uzb">Uzbek</option>
  <option value="uzb_cyrl">Uzbek - Cyrillic</option>
  <option value="vie">Vietnamese</option>
  <option value="yid">Yiddish</option>
            {/* Diğer dilleri ekleyebilirsiniz */}
          </select>
        </div>
        <p>Choose an Image</p>
        <input
          type="file"
          name=""
          id=""
          onChange={handleImageChange}
          accept="image/*"
        />
      </div>
      <div className="display-flex">
        <div>
          <img src={imageData} alt="" />
          <p>{ocr}</p>
        </div>
        <div>
          <p>Recognized Text:</p>
          <p>{recognizedText}</p> {/* Sonucu görüntülemek için yeni bir <p> ekledik */}
        </div>
      </div>
    </div>
  );
}

export default App;
