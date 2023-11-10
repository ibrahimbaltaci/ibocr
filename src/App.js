import React, { useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import CoordinatesSelector from './components/CoordinatesSelector';
import TemplateEditor from './components/TemplateEditor';
import languages from './assets/languages'

const App = () => {
  const [imageData, setImageData] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [template, setTemplate] = useState([]);
  const [lang, setLang] = useState('eng');

  useEffect(() => {
    const convertImageToText = async () => {
      if (!imageData || !selectedCoordinates) return;

      const worker = createWorker();
      await worker.load();
      await worker.loadLanguage(lang);
      await worker.initialize(lang);
      const {
        data: { text },
      } = await worker.recognize(imageData, {
        rectangle: selectedCoordinates,
      });

      setTemplate((prevTemplate) => [
        ...prevTemplate,
        { label: '', coordinates: selectedCoordinates, ocrText: text },
      ]);

      await worker.terminate();
    };

    convertImageToText();
  }, [imageData, selectedCoordinates, lang]);

  const handleImageChange = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUri = reader.result;
      setImageData(imageDataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleLanguageChange = (e) => {
    setLang(e.target.value);
  };

  return (
    <div>
      <h1>OCR Template Builder</h1>
      <p>Choose Language:</p>
      <select value={lang} onChange={handleLanguageChange}>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
      <input
        type="file"
        onChange={(e) => handleImageChange(e.target.files[0])}
        accept="image/*"
      />
      {imageData && (
        <div>
          <CoordinatesSelector
            imageData={imageData}
            onSelection={setSelectedCoordinates}
          />
          <TemplateEditor template={template} />
        </div>
      )}
    </div>
  );
};

export default App;
