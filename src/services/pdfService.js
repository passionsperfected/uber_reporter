const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { PDF_CACHE_DIR } = require('./cacheService');

/**
 * Download a single PDF receipt
 * @param {string} tripUUID - The UUID of the trip
 * @param {Object} cookies - Cookie jar object
 * @param {string} outputDir - Directory to save the PDF
 * @returns {Promise<string>} Path to the downloaded PDF
 */
async function downloadPDF(tripUUID, cookies, outputDir) {
  const url = `https://riders.uber.com/trips/${tripUUID}/receipt?contentType=PDF`;
  const cachedPath = path.join(PDF_CACHE_DIR, `${tripUUID}.pdf`);
  const outputPath = path.join(outputDir, `${tripUUID}.pdf`);

  try {
    // Ensure both cache and output directories exist
    await fs.mkdir(PDF_CACHE_DIR, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Check if PDF exists in cache
    try {
      await fs.access(cachedPath);
      // PDF is cached, copy from cache to output directory
      await fs.copyFile(cachedPath, outputPath);
      return outputPath;
    } catch (cacheError) {
      // PDF not cached, download it
      const cookieString = Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');

      const response = await axios.get(url, {
        headers: {
          'Cookie': cookieString
        },
        responseType: 'arraybuffer'
      });

      // Save to cache first
      await fs.writeFile(cachedPath, response.data);

      // Then copy from cache to output directory
      await fs.copyFile(cachedPath, outputPath);

      return outputPath;
    }
  } catch (error) {
    throw new Error(`Failed to download PDF for ${tripUUID}: ${error.message}`);
  }
}

/**
 * Merge multiple PDFs into a single PDF
 * @param {Array<string>} pdfPaths - Array of paths to PDF files
 * @param {string} outputDir - Directory to save the merged PDF
 * @param {string} filename - Name of the merged PDF file (default: merged_receipt.pdf)
 * @returns {Promise<string>} Path to the merged PDF
 */
async function mergePDFs(pdfPaths, outputDir, filename = 'merged_receipt.pdf') {
  try {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Load and merge each PDF
    for (const pdfPath of pdfPaths) {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const outputPath = path.join(outputDir, filename);
    await fs.writeFile(outputPath, mergedPdfBytes);

    return outputPath;
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error.message}`);
  }
}

module.exports = {
  downloadPDF,
  mergePDFs
};
