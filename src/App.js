import React, { useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import CoordinatesSelector from './components/CoordinatesSelector';
import TemplateEditor from './components/TemplateEditor';
import languages from './assets/languages'
import Jimp from 'jimp';

const App = () => {
  const [imageData, setImageData] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [template, setTemplate] = useState([]);
  const [lang, setLang] = useState('eng');
  const jimp = require('jimp');

  useEffect(() => {
    const convertImageToText = async () => {
      if (!imageData || !selectedCoordinates) return;

      const getCroppedImage = async (imageSrc, crop) => {
        try {
          Jimp.read(imageSrc)
            .then((image) => {
              const croppedImage = image.clone().crop(crop.x, crop.y, crop.width, crop.height);
            })
            .catch((err) => {
              // Handle an exception.
            });

          const buffer = await croppedImage.getBufferAsync(Jimp.AUTO);

          return buffer;
        } catch (error) {
          console.error('Error processing image:', error);
          throw error;
        }
      };

      // Kırpılan resmi al
      const croppedImage = await getCroppedImage(imageData, selectedCoordinates);
      const worker = await createWorker(lang)

      const ret = await worker.recognize(croppedImage)

      setTemplate((prevTemplate) => [
        ...prevTemplate,
        { label: '', coordinates: selectedCoordinates, ocrText: ret.data.text }, // Düzeltildi
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
