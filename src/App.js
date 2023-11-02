import React, { useEffect, useState } from "react";
import { createWorker } from 'tesseract.js';


function App() {
  const [ocr, setOcr] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imageDataUri, setImageDataUri] = useState("");
  useEffect(() => {
    const convertImageToText = async () => {
      if (!imageData) return;
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageDataUri);
      console.log(ret.data.text);
      await worker.terminate();
    };

    convertImageToText();
  }, [imageData,imageDataUri]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUri = reader.result;
      console.log({ imageDataUri });
      setImageData(imageDataUri); // imageData'yi güncelleyin
      setImageDataUri(imageDataUri); // imageDataUri'yi güncelleyin
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
        <img src={imageData} alt="" />
        <p>{ocr}</p>
      </div>
    </div>
  );
}

export default App;
