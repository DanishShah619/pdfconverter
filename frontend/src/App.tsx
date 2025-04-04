import React, { useState } from "react";
import "./App.css";

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [splitPage, setSplitPage] = useState<number>(1);

  const [fileType, setFileType] = useState<
    "word" | "ppt" | "images" | "merge" | "split" | "compress"
  >("word");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Please select a file to upload");
      return;
    }

    setLoading(true);
    setDownloadUrl(null);
    const formData = new FormData();

    if (fileType === "images" || fileType === "merge") {
      Array.from(selectedFiles).forEach((file) => formData.append("files", file));
    } else {
      formData.append("files", selectedFiles[0]);
    }
    if (fileType === "split") {
      formData.append("splitPage", splitPage.toString());
    }
    let endpoint = "";
    switch (fileType) {
      case "word":
        endpoint = "http://localhost:3000/convert-word";
        break;
      case "ppt":
        endpoint = "http://localhost:3000/convert-ppt";
        break;
      case "images":
        endpoint = "http://localhost:3000/convert-images";
        break;
      case "merge":
        endpoint = "http://localhost:3000/merge-pdf";
        break;
      case "split":
        endpoint = "http://localhost:3000/split-pdf";
        break;
      case "compress":
        endpoint = "http://localhost:3000/compress-pdf";
        break;
      default:
        break;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Conversion failed");

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      setDownloadUrl(fileUrl);
    } catch (error) {
      alert("An error occurred during the conversion.");
    } finally {
      setLoading(false);
    }
  };

  const getAcceptTypes = () => {
    switch (fileType) {
      case "word":
        return ".doc,.docx";
      case "ppt":
        return ".ppt,.pptx";
      case "images":
        return "image/*";
      case "merge":
      case "split":
      case "compress":
        return ".pdf";
      default:
        return "";
    }
  };

  return (
    <div className="container">
      <header>
        <h1>PDF Converter Suite</h1>
      </header>
      <main>
        <div className="content">
          <h2>Choose a Conversion Type</h2>

          <label>Select Operation:</label>
          <select
            className="drop-text"
            value={fileType}
            onChange={(e) => setFileType(e.target.value as any)}
          >
         

            <option value="word">Word to PDF</option>
            <option value="ppt">PPT to PDF</option>
            <option value="images">Images to PDF</option>
            <option value="merge">Merge PDFs</option>
            <option value="split">Split PDF (1st Page)</option>
            <option value="compress">Compress PDF</option>
          </select>
          {fileType === "split" && (
  <input
    type="number"
    className="file-name"
    placeholder="Split after page..."
    min={1}
    value={splitPage}
    onChange={(e) => setSplitPage(Number(e.target.value))}
  />
)}

          <input
            type="file"
            className="file-name"
            accept={getAcceptTypes()}
            multiple={fileType === "images" || fileType === "merge"}
            onChange={handleFileChange}
          />

          <button
            className="convert-button upload-button"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Processing..." : "Convert"}
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download="converted.pdf"
              className="download-button"
            >
              Download PDF
            </a>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
