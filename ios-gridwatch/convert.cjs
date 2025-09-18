const fs = require('fs');
const path = require('path');

// Helper function to test if a string is a valid date
function isValidDate(dateStr) {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Read input file, convert, and write output
async function convertDatesInFile(inputFilePath) {
  try {
    const content = await fs.promises.readFile(inputFilePath, 'utf-8');

    // Match string literals: "..." or '...'
    const stringRegex = /(["'])(.*?)\1/g;

    const replaced = content.replace(stringRegex, (match, quote, inner) => {
      if (isValidDate(inner)) {
        const epoch = new Date(inner).getTime(); // epoch in ms
        return `${epoch}`;
      }
      return match; // leave as-is if not a date
    });

    const outputPath = getOutputFilePath(inputFilePath);
    await fs.promises.writeFile(outputPath, replaced, 'utf-8');
    console.log(`✅ Converted file written to: ${outputPath}`);
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Utility to generate new file path like "module.converted.js"
function getOutputFilePath(inputPath) {
  const ext = path.extname(inputPath);
  const base = inputPath.slice(0, -ext.length);
  return `${base}.converted${ext}`;
}

// Entry point: take file path from command line args
const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node convertDates.cjs <path-to-js-module>');
  process.exit(1);
}

convertDatesInFile(inputPath);
