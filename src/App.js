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
          <p>Choose Language:</p>
          <select value={lang} onChange={handleLanguageChange}>
            <option value="eng">English</option>
            <option value="deu">German</option>
            <option value="fra">French</option>
            <option value="rus">Russian</option>
            {/* Diğer dilleri ekleyebilirsiniz */}
          </select>
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
