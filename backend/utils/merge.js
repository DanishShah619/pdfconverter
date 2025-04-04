const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

async function mergePDFs(filePaths, outputPath) {
  const mergedPdf = await PDFDocument.create();

  for (const filePath of filePaths) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedBytes);
}

module.exports = mergePDFs;
