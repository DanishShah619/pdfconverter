const express= require("express");
const app= express();
const port= 3000;
const multer= require("multer");
const docxConverter = require('docx-pdf');
const path = require('path');
const cors = require("cors");
const libre = require("libreoffice-convert");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");
const fs = require("fs");
const mergePDFs = require("./utils/merge");
const splitPDF = require("./utils/split");
const compressPDF = require("./utils/compress");

app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.listen(port, () => 
{
    console.log(` app listening on port ${port}`);
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
     
      cb(null, file.originalname + '-' + Date.now())
    }
  })
  
  const upload = multer({ storage: storage });
  app.post("/convert-word", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
  
    const outputPath = path.join(__dirname, `files/${req.file.filename}.pdf`);
    docxConverter(req.file.path, outputPath, (err) => {
      if (err) return res.status(500).json({ message: "Error converting Word to PDF" });
      req.files.forEach(file => fs.unlinkSync(file.path));
      res.download(outputPath, () => fs.unlinkSync(outputPath)); // Send and delete file
    });
  });
  
  // Convert PPT to PDF
  process.env.LIBREOFFICE_BIN = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

  app.post("/convert-ppt", upload.single("files"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, `files/${Date.now()}-converted.pdf`);
    try {
      const inputBuffer = fs.readFileSync(inputPath);
      const convertedBuffer = await new Promise((resolve, reject) => {
        libre.convert(inputBuffer, ".pdf", undefined, (err, done) => {
          if (err) reject(err);
          else resolve(done);
        });
      });
      fs.writeFileSync(outputPath, convertedBuffer);
      
      // Clean up the input file
      fs.unlinkSync(inputPath);
      
      res.download(outputPath, () => fs.unlinkSync(outputPath));
    } catch (err) {
      console.error("LibreOffice conversion error:", err);
      res.status(500).json({ message: "Error converting PPT to PDF" });
    }
  });
  
  
  app.post("/convert-images", upload.array("files", 10), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send("No images uploaded.");
  
    const outputPath = path.join(__dirname, `files/${Date.now()}-images.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
  
    for (const file of req.files) {
      const imgBuffer = await sharp(file.path).resize({ width: 600 }).toBuffer();
      doc.image(imgBuffer, { fit: [600, 800] }).addPage();
    }
    req.files.forEach(file => fs.unlinkSync(file.path));
    doc.end();
    stream.on("finish", () => res.download(outputPath, () => fs.unlinkSync(outputPath)));
  });
 
  
  
  app.post("/split-pdf", upload.single("files"), async (req, res) => {
    const splitPage = parseInt(req.body.splitPage, 10);
  
    if (!req.file || isNaN(splitPage)) return res.status(400).send("Invalid file or split page.");
  
    const inputPath = req.file.path;
    const baseName = Date.now();
    const part1Path = path.join(__dirname, `files/split-part1-${baseName}.pdf`);
    const part2Path = path.join(__dirname, `files/split-part2-${baseName}.pdf`);
  
    try {
      const inputBuffer = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(inputBuffer);
  
      const totalPages = pdfDoc.getPageCount();
      if (splitPage < 1 || splitPage >= totalPages) {
        throw new Error("Split page must be within PDF page range.");
      }
  
      const part1 = await PDFDocument.create();
      const part2 = await PDFDocument.create();
  
      const part1Pages = await part1.copyPages(pdfDoc, [...Array(splitPage).keys()]);
      part1Pages.forEach((page) => part1.addPage(page));
  
      const part2Pages = await part2.copyPages(pdfDoc, [...Array(totalPages - splitPage).keys()].map(i => i + splitPage));
      part2Pages.forEach((page) => part2.addPage(page));
  
      fs.writeFileSync(part1Path, await part1.save());
      fs.writeFileSync(part2Path, await part2.save());
  
      fs.unlinkSync(inputPath);
  
      res.zip([
        { path: part1Path, name: "part1.pdf" },
        { path: part2Path, name: "part2.pdf" },
      ]);
    } catch (err) {
      console.error("Split error:", err);
      res.status(500).send("Error splitting PDF.");
    }
  });
  
  app.post("/compress-pdf", upload.single("files"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
  
    const outputPath = path.join(__dirname, `files/compressed-${Date.now()}.pdf`);
    try {
      await compressPDF(req.file.path, outputPath);
      fs.unlinkSync(req.file.path);
      res.download(outputPath, () => fs.unlinkSync(outputPath));
    } catch (err) {
      console.error("Compression error:", err);
      res.status(500).send("Error compressing PDF.");
    }
  });
   app.post("/merge-pdf", upload.array("files", 10), async (req, res) => {
    if (!req.files || req.files.length < 2) return res.status(400).send("Upload at least 2 PDFs to merge.");
  
    const outputPath = path.join(__dirname, `files/merged-${Date.now()}.pdf`);
    try {
      const filePaths = req.files.map(file => file.path);
      await mergePDFs(filePaths, outputPath);
      req.files.forEach(file => fs.unlinkSync(file.path));
      res.download(outputPath, () => fs.unlinkSync(outputPath));
    } catch (err) {
      console.error("Merge error:", err);
      res.status(500).send("Error merging PDFs.");
    }
  });