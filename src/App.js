import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import mammoth from 'mammoth';
import './App.css';

function App() {
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [file, setFile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [scanning, setScanning] = useState(false);

  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setRecommendations([]);
    if (industry && region && uploadedFile) {
      setScanning(true);
      if (uploadedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // DOCX file
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const { value: fileContent } = await mammoth.extractRawText({ arrayBuffer });
          try {
            const response = await fetch('http://localhost:5000/api/recommendations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ industry, region, fileContent }),
            });
            const data = await response.json();
            setRecommendations([data.recommendations]);
          } catch (error) {
            setRecommendations(['Error fetching recommendations.']);
          }
          setScanning(false);
        };
        reader.readAsArrayBuffer(uploadedFile);
      } else {
        // TXT or other text file
        const reader = new FileReader();
        reader.onload = async (event) => {
          const fileContent = event.target.result;
          try {
            const response = await fetch('http://localhost:5000/api/recommendations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ industry, region, fileContent }),
            });
            const data = await response.json();
            setRecommendations([data.recommendations]);
          } catch (error) {
            setRecommendations(['Error fetching recommendations.']);
          }
          setScanning(false);
        };
        reader.readAsText(uploadedFile);
      }
    } else {
      setScanning(false);
      setRecommendations([]);
    }
  };

  return (
    <div className="App" style={{background: '#f4f6fa', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif'}}>
      {/* Hero Section */}
      <div style={{width: '100%', background: 'linear-gradient(90deg, #1a237e 60%, #3949ab 100%)', color: '#fff', padding: '2rem 0 1.2rem 0', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)'}}>
        <h1 style={{margin: 0, fontWeight: 700, fontSize: '2.2rem'}}>Compliance Coach</h1>
        <p style={{margin: '1rem 0 0 0', fontSize: '1.3rem', fontWeight: 500, letterSpacing: '0.02em', color: '#fff', textShadow: '0 2px 8px rgba(26,35,126,0.15)'}}>AI-driven compliance assistant for regulated industries</p>
      </div>
      {/* Main Card Section */}
      <main style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 180px)'}}>
        <div style={{width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '18px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '2.5rem 2rem', margin: '2rem 0'}}>
          {/* Controls */}
          <div style={{marginBottom: '2rem'}}>
            <h2 style={{fontSize: '1.15rem', marginBottom: '1.2rem', color: '#1a237e'}}>Select Industry & Region</h2>
            <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
              <label style={{flex: 1, minWidth: '180px'}}>
                Industry:<br/>
                <select value={industry} onChange={e => setIndustry(e.target.value)} style={{marginTop: '0.5rem', padding: '0.5rem', borderRadius: '8px', width: '100%', border: '1px solid #c5cae9'}}>
                  <option value="">Select</option>
                  <option value="Banking">Banking</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Retail">Retail</option>
                </select>
              </label>
              <label style={{flex: 1, minWidth: '180px'}}>
                Region:<br/>
                <select value={region} onChange={e => setRegion(e.target.value)} style={{marginTop: '0.5rem', padding: '0.5rem', borderRadius: '8px', width: '100%', border: '1px solid #c5cae9'}}>
                  <option value="">Select</option>
                  <option value="India">India</option>
                  <option value="EU">EU</option>
                  <option value="US">US</option>
                </select>
              </label>
            </div>
          </div>
          <div style={{marginBottom: '2rem'}}>
            <h2 style={{fontSize: '1.15rem', marginBottom: '1.2rem', color: '#1a237e'}}>Upload Project Document</h2>
            <input type="file" onChange={handleFileChange} style={{padding: '0.5rem', borderRadius: '8px', border: '1px solid #c5cae9', width: '100%'}} />
            {file && <div style={{marginTop: '0.5rem', fontSize: '0.95rem', color: '#333'}}>Selected: {file.name}</div>}
          </div>
          {/* Recommendations */}
          <section>
            <h2 style={{fontSize: '1.15rem', marginBottom: '1.2rem', color: '#1a237e'}}>Recommendations</h2>
            {scanning ? (
              <div style={{textAlign: 'center', minHeight: '40vh', fontSize: '1.2rem', color: '#0078d4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{marginBottom: '1.5rem'}}>Scanning in progress...</div>
                <div style={{width: '60%', height: '8px', background: '#e3e3e3', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{width: '100%', height: '100%', background: 'linear-gradient(90deg, #1a237e 0%, #3949ab 100%)', animation: 'progressBar 1.2s linear infinite'}}></div>
                </div>
                <style>{`
                  @keyframes progressBar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                `}</style>
              </div>
            ) : recommendations.length > 0 ? (
              <div style={{background: '#f9f9f9', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'left'}}>
                <ReactMarkdown>{recommendations[0]}</ReactMarkdown>
              </div>
            ) : (
              <p style={{color: '#888'}}>No recommendations yet. Select industry and region, then upload a document to begin analysis.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;