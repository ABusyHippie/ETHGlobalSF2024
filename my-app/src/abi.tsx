// my-app/src/abi.tsx
import React, { useState } from 'react';
import axios from 'axios';

const AbiUploader: React.FC = () => {
  const [abi, setAbi] = useState<any>(null);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          try {
            const parsedAbi = JSON.parse(content);
            setAbi(parsedAbi);
            // Optionally, send the ABI to your backend
            axios.post('/api/uploadAbi', { abi: parsedAbi })
              .then(response => console.log('ABI uploaded:', response))
              .catch(error => console.error('Error uploading ABI:', error));
          } catch (error) {
            alert('Invalid ABI file format.');
          }
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please drop a valid JSON file.');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}
    >
      <p>Drag and drop your ABI.json file here</p>
    </div>
  );
};

export default AbiUploader;

