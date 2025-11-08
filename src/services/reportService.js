const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Format date as mm/dd/yy
 * @param {string} dateStr - Date string to format (e.g., "Oct 31 • 3:20 PM" or "Nov 3, 2025")
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  // Extract just the date part (before the •)
  const datePart = dateStr.split(' • ')[0].trim();

  // Add current year if not present (Uber's format is "Oct 31" without year)
  const currentYear = new Date().getFullYear();
  const dateWithYear = datePart.includes(',') ? datePart : `${datePart}, ${currentYear}`;

  const date = new Date(dateWithYear);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Generate a travel report PDF from trip data
 * @param {Array} trips - Array of trip data
 * @param {Object} reportConfig - Report configuration (name, vendor number, etc.)
 * @param {string} outputPath - Path to save the PDF
 * @returns {Promise<string>} Path to the generated PDF
 */
async function generateTravelReport(trips, reportConfig, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Helper function to get display name for an address
      const getDisplayName = (address) => {
        if (!reportConfig.addressMappings || reportConfig.addressMappings.length === 0) {
          return address;
        }
        const mapping = reportConfig.addressMappings.find(m => address.includes(m.address) || m.address.includes(address));
        return mapping ? mapping.displayName : address;
      };

      // Filter completed trips only
      const completedTrips = trips.filter(t => t.trip && t.trip.status === 'COMPLETED');

      if (completedTrips.length === 0) {
        throw new Error('No completed trips to generate report');
      }

      // Sort trips by date
      const sortedTrips = completedTrips.sort((a, b) => {
        const dateA = new Date(a.activity.subtitle?.split(' • ')[0] || 0);
        const dateB = new Date(b.activity.subtitle?.split(' • ')[0] || 0);
        return dateA - dateB;
      });

      // Calculate date range
      const firstDateStr = sortedTrips[0].activity.subtitle?.split(' • ')[0] || '';
      const lastDateStr = sortedTrips[sortedTrips.length - 1].activity.subtitle?.split(' • ')[0] || '';
      const firstDate = formatDate(firstDateStr);
      const lastDate = formatDate(lastDateStr);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Pipe to file
      const stream = doc.pipe(fs.createWriteStream(outputPath));

      // Function to draw header
      const drawHeader = () => {
        // Add logo
        const logoPath = path.join(__dirname, '../../assets/logo.jpeg');
        try {
          doc.image(logoPath, 50, 50, { width: 150 });
        } catch (err) {
          console.error('Could not load logo:', err);
        }

        // "Travel Report" title - right aligned
        doc.fontSize(20).font('Helvetica-Bold').text('Travel Report', 350, 60, {
          align: 'right',
          width: 200
        });

        doc.moveDown(2.5);

        // Report info section
        const infoStartY = 130;

        doc.fontSize(10).font('Helvetica');

        // Left column
        doc.text(`Report Period:`, 50, infoStartY, { continued: true });
        doc.font('Helvetica').text(`    ${firstDate}    to    ${lastDate}`);

        doc.font('Helvetica').text(`Name:`, 50, infoStartY + 15, { continued: true });
        doc.font('Helvetica').text(`    ${reportConfig.name || ''}`);

        // Right column
        doc.font('Helvetica').text(`Vendor Number:`, 350, infoStartY, { continued: true });
        doc.font('Helvetica').text(`    ${reportConfig.vendorNumber || ''}`);

        doc.font('Helvetica').text(`Purchase Order #:`, 350, infoStartY + 15, { continued: true });
        doc.font('Helvetica').text(`    ${reportConfig.purchaseOrder || ''}`);

        doc.font('Helvetica').text(`Department:`, 350, infoStartY + 30, { continued: true });
        doc.font('Helvetica').text(`    ${reportConfig.department || ''}`);
      };

      // Draw initial header
      drawHeader();

      // Table setup
      const tableTop = 200;
      const tableLeft = 50;
      const tableWidth = 512;

      const colWidths = {
        date: 65,
        start: 175,
        destination: 175,
        amount: 55,
        note: 42
      };

      // Draw table header
      doc.strokeColor('#808080');
      doc.lineWidth(0.5);
      doc.rect(tableLeft, tableTop, tableWidth, 18).stroke();

      // Draw header cell separators
      doc.moveTo(tableLeft + colWidths.date, tableTop)
         .lineTo(tableLeft + colWidths.date, tableTop + 18)
         .stroke();

      doc.moveTo(tableLeft + colWidths.date + colWidths.start, tableTop)
         .lineTo(tableLeft + colWidths.date + colWidths.start, tableTop + 18)
         .stroke();

      doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, tableTop)
         .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, tableTop + 18)
         .stroke();

      doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, tableTop)
         .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, tableTop + 18)
         .stroke();

      doc.fillColor('#000000').font('Helvetica').fontSize(9);

      doc.text('Date', tableLeft + 5, tableTop + 5, { width: colWidths.date - 10 });
      doc.text('Start Location', tableLeft + colWidths.date + 5, tableTop + 5, { width: colWidths.start - 10 });
      doc.text('Destination', tableLeft + colWidths.date + colWidths.start + 5, tableTop + 5, { width: colWidths.destination - 10 });
      doc.text('Amt', tableLeft + colWidths.date + colWidths.start + colWidths.destination + 5, tableTop + 5, { width: colWidths.amount - 10 });
      doc.text('Note', tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount + 5, tableTop + 5, { width: colWidths.note - 10 });

      // Draw table rows
      doc.font('Helvetica').fontSize(9);
      let currentY = tableTop + 18;
      let totalAmount = 0;
      let rowIndex = 0;
      let lastTripDate = null;

      for (const tripData of sortedTrips) {
        const { activity, trip } = tripData;

        // Keep track of the last trip date for the total row
        const tripDateStr = activity.subtitle?.split(' • ')[0] || '';
        if (tripDateStr) {
          const currentYear = new Date().getFullYear();
          const dateWithYear = tripDateStr.includes(',') ? tripDateStr : `${tripDateStr}, ${currentYear}`;
          lastTripDate = new Date(dateWithYear);
        }

        // Check if we need a new page
        if (currentY > 680) {
          doc.addPage();
          currentY = 50;

          // Redraw header on new page
          drawHeader();
          currentY = 200;

          // Redraw table header
          doc.strokeColor('#808080');
          doc.lineWidth(0.5);
          doc.rect(tableLeft, currentY, tableWidth, 18).stroke();

          // Draw header cell separators
          doc.moveTo(tableLeft + colWidths.date, currentY)
             .lineTo(tableLeft + colWidths.date, currentY + 18)
             .stroke();

          doc.moveTo(tableLeft + colWidths.date + colWidths.start, currentY)
             .lineTo(tableLeft + colWidths.date + colWidths.start, currentY + 18)
             .stroke();

          doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY)
             .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY + 18)
             .stroke();

          doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY)
             .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY + 18)
             .stroke();

          doc.fillColor('#000000').font('Helvetica').fontSize(9);
          doc.text('Date', tableLeft + 5, currentY + 5, { width: colWidths.date - 10 });
          doc.text('Start Location', tableLeft + colWidths.date + 5, currentY + 5, { width: colWidths.start - 10 });
          doc.text('Destination', tableLeft + colWidths.date + colWidths.start + 5, currentY + 5, { width: colWidths.destination - 10 });
          doc.text('Amt', tableLeft + colWidths.date + colWidths.start + colWidths.destination + 5, currentY + 5, { width: colWidths.amount - 10 });
          doc.text('Note', tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount + 5, currentY + 5, { width: colWidths.note - 10 });

          currentY += 18;
          doc.font('Helvetica').fontSize(9);
          rowIndex = 0;
        }

        // Parse date
        const dateStr = formatDate(activity.subtitle?.split(' • ')[0] || '');

        // Get start and end locations (with mappings if available)
        const startLocationRaw = trip.waypoints && trip.waypoints.length > 0
          ? trip.waypoints[0]
          : 'Unknown';
        const endLocationRaw = trip.waypoints && trip.waypoints.length > 1
          ? trip.waypoints[1]
          : 'Unknown';

        const startLocation = getDisplayName(startLocationRaw);
        const endLocation = getDisplayName(endLocationRaw);

        // Get fare
        const fareStr = trip.fare || '$0.00';
        const fareNum = parseFloat(fareStr.replace(/[$,]/g, ''));
        totalAmount += isNaN(fareNum) ? 0 : fareNum;

        // Remove dollar sign for display
        const fareDisplay = fareNum.toFixed(2);

        // Draw row with border
        const rowHeight = 16;
        doc.strokeColor('#808080');
        doc.lineWidth(0.5);
        doc.rect(tableLeft, currentY, tableWidth, rowHeight).stroke();

        // Draw cell borders
        doc.moveTo(tableLeft + colWidths.date, currentY)
           .lineTo(tableLeft + colWidths.date, currentY + rowHeight)
           .stroke();

        doc.moveTo(tableLeft + colWidths.date + colWidths.start, currentY)
           .lineTo(tableLeft + colWidths.date + colWidths.start, currentY + rowHeight)
           .stroke();

        doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY)
           .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY + rowHeight)
           .stroke();

        doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY)
           .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY + rowHeight)
           .stroke();

        // Draw row data
        doc.fillColor('#000000');

        doc.text(dateStr, tableLeft + 2, currentY + 3, { width: colWidths.date - 4, height: rowHeight });
        doc.text(startLocation, tableLeft + colWidths.date + 2, currentY + 3, { width: colWidths.start - 4, height: rowHeight });
        doc.text(endLocation, tableLeft + colWidths.date + colWidths.start + 2, currentY + 3, { width: colWidths.destination - 4, height: rowHeight });
        doc.text(fareDisplay, tableLeft + colWidths.date + colWidths.start + colWidths.destination + 2, currentY + 3, { width: colWidths.amount - 4, height: rowHeight, align: 'right' });

        currentY += rowHeight;
        rowIndex++;
      }

      // Calculate fixed positions for signatures at bottom of page
      const pageHeight = 792;
      const bottomMargin = 50;
      const rowHeight = 16;
      const signatureSpacing = 40;
      const signatureLineHeight = 20;

      // Position from bottom up: signature2, signature1, spacing, then total row
      const signature2Y = pageHeight - bottomMargin - signatureLineHeight;
      const signature1Y = signature2Y - signatureLineHeight;
      const totalRowY = signature1Y - signatureSpacing - rowHeight;

      // Check if we need a new page for the total and signatures
      if (currentY > totalRowY - 20) { // 20px buffer
        doc.addPage();
        drawHeader();
        currentY = 200 + 18; // Reset to just after header table
      }

      // Fill empty rows from last trip up to (but not including) total row
      doc.strokeColor('#808080');
      doc.lineWidth(0.5);

      while (currentY + rowHeight <= totalRowY) {
        // Draw row border
        doc.rect(tableLeft, currentY, tableWidth, rowHeight).stroke();

        // Draw cell separators
        doc.moveTo(tableLeft + colWidths.date, currentY)
           .lineTo(tableLeft + colWidths.date, currentY + rowHeight)
           .stroke();

        doc.moveTo(tableLeft + colWidths.date + colWidths.start, currentY)
           .lineTo(tableLeft + colWidths.date + colWidths.start, currentY + rowHeight)
           .stroke();

        doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY)
           .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY + rowHeight)
           .stroke();

        doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY)
           .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY + rowHeight)
           .stroke();

        currentY += rowHeight;
      }

      // Draw total row as the next row in the continuous table
      doc.strokeColor('#808080');
      doc.lineWidth(0.5);
      doc.rect(tableLeft, currentY, tableWidth, rowHeight).stroke();

      // Draw separator between destination and amount columns in total row
      doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY)
         .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination, currentY + rowHeight)
         .stroke();

      // Draw separator between amount and note columns in total row
      doc.moveTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY)
         .lineTo(tableLeft + colWidths.date + colWidths.start + colWidths.destination + colWidths.amount, currentY + rowHeight)
         .stroke();

      // Get month and year from the last trip's date
      const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                          'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      const totalMonth = lastTripDate ? lastTripDate.getMonth() : 0;
      const totalYear = lastTripDate ? lastTripDate.getFullYear() : new Date().getFullYear();
      const monthYear = `${monthNames[totalMonth]} ${totalYear}`;

      doc.font('Helvetica').fontSize(9);
      doc.fillColor('#000000');

      // Right-align the total text in the Destination column
      doc.text(`TOTAL FARES FOR ${monthYear}`, tableLeft + colWidths.date + colWidths.start + 2, currentY + 3, {
        width: colWidths.destination - 4,
        height: rowHeight,
        align: 'right'
      });
      doc.text(`$${totalAmount.toFixed(2)}`, tableLeft + colWidths.date + colWidths.start + colWidths.destination + 2, currentY + 3, { width: colWidths.amount - 4, height: rowHeight, align: 'right' });

      // Add signature lines at fixed bottom positions
      doc.font('Helvetica').fontSize(10);

      doc.text('Employee Signature: ___________________________________', tableLeft, signature1Y, { align: 'left' });
      doc.text('Date: __________________', 370, signature1Y, { align: 'left' });

      doc.text('Supervisor Signature: __________________________________', tableLeft, signature2Y, { align: 'left' });
      doc.text('Date: __________________', 370, signature2Y, { align: 'left' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateTravelReport
};
