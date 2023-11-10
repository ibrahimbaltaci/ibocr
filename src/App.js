import React, { useEffect, useState } from "react";
import { createWorker } from 'tesseract.js';
import './App.css'
import TemplateEditor from "./components/TemplateEditor";
import CoordinatesSelector from "./components/CoordinateSelector";
import languages from "./assets/languages";

function App() {
  const [ocr, setOcr] = useState("");
  const [imageData, setImageData] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [lang, setLang] = useState("eng");
  const [selectedCoordinates, setSelectedCoordinates] = useState(null); // Eklenen satır

  useEffect(() => {
    const convertImageToText = async () => {
      if (!imageData) return;
      const worker = await createWorker(lang);
      const ret = await worker.recognize(imageData);
      const text = ret.data.text;
      console.log(text);
      setRecognizedText(text); // Sonucu state'e kaydettik
      await worker.terminate();
    };

    convertImageToText();
  }, [imageData, imageData, lang]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLang(lang);
  };

  const handleImageChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result;
      setImageData(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleSelection = (coordinates) => {
    setSelectedCoordinates(coordinates);
  };

  return (
    <div className="App">
      <div>
        <p>Choose Language:</p>
        <select value={lang} onChange={handleLanguageChange}>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
        <p>Choose an Image</p>
        <input
          type="file"
          name=""
          id=""
          onChange={(e) => handleImageChange(e.target.files[0])}
          accept="image/*"
        />
        <div className="image-preview-container">
          {imageData && <img src={imageData} alt="" />}
          {imageData && <CoordinatesSelector onSelection={handleSelection} />}
        </div>
      </div>
      <div>
        {imageData && selectedCoordinates && (
          <TemplateEditor
            selectedCoordinates={selectedCoordinates}
            onChange={(newTemplate) => console.log(newTemplate)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
