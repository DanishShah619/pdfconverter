const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

async function splitPDF(inputPath, outputDir) {
  const pdfBytes = fs.readFileSync(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(page);
    const newPdfBytes = await newPdf.save();
    fs.writeFileSync(path.join(outputDir, `page-${i + 1}.pdf`), newPdfBytes);
  }
}

module.exports = splitPDF;
