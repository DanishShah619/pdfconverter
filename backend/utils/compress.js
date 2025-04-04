const { exec } = require("child_process");

function compressPDF(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `gswin64c -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(stderr);
      resolve();
    });
  });
}

module.exports = compressPDF;
