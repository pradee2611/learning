// Test script to verify Excel file parsing
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const questions = [];
  const headers = jsonData[0] ? jsonData[0].map(h => String(h || '').toLowerCase()) : [];
  
  console.log(`\nFile: ${path.basename(filePath)}`);
  console.log(`Headers: ${headers.join(', ')}`);
  console.log(`Total rows: ${jsonData.length}`);
  
  const questionCol = headers.findIndex(h => h.includes('question'));
  const answerCol = headers.findIndex(h => h.includes('answer') || h.includes('correct'));
  
  // Find option columns
  const optionCols = [];
  headers.forEach((h, i) => {
    if (h.includes('option')) {
      const letterMatch = h.match(/option\s*([a-e])/i);
      if (letterMatch) {
        optionCols.push({ index: i, letter: letterMatch[1].toUpperCase() });
      }
    } else if (h.includes('choice')) {
      const numMatch = h.match(/choice\s*(\d+)/i);
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        optionCols.push({ index: i, letter: String.fromCharCode(64 + num) });
      }
    }
  });
  
  optionCols.sort((a, b) => a.letter.localeCompare(b.letter));
  
  console.log(`Question column: ${questionCol >= 0 ? headers[questionCol] : 'NOT FOUND'}`);
  console.log(`Answer column: ${answerCol >= 0 ? headers[answerCol] : 'NOT FOUND'}`);
  console.log(`Option columns: ${optionCols.map(c => `${c.letter}(${headers[c.index]})`).join(', ')}`);
  
  if (questionCol >= 0) {
    let validQuestions = 0;
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row[questionCol]) continue;
      
      const options = [];
      optionCols.forEach(col => {
        if (row[col.index] && String(row[col.index]).trim() && String(row[col.index]).trim() !== 'nan') {
          options.push(String(row[col.index]).trim());
        }
      });
      
      if (options.length >= 2) {
        validQuestions++;
      }
    }
    console.log(`Valid questions found: ${validQuestions}`);
    return validQuestions;
  }
  
  return 0;
}

// Test all files
const resourceDir = path.join(__dirname, 'resoure');
const files = [
  'certified-generative-ai-engineer-associate (4).xlsx',
  "I am sharing 'certified-generative-ai-engineer-associate (3) (1)' with you (1).xlsx",
  'Databricks Generative AI Engineer Associate Exam - Actual Q&As, Page 1 _ ExamTopics.xlsx',
  'Databricks Practice Mock Test .xlsx',
  'Databricks Genai Mock Test 1.xlsx'
];

console.log('Testing Excel file formats...');
console.log('='.repeat(70));

files.forEach(file => {
  const filePath = path.join(resourceDir, file);
  if (fs.existsSync(filePath)) {
    try {
      parseExcelFile(filePath);
    } catch (e) {
      console.log(`\nError parsing ${file}: ${e.message}`);
    }
  } else {
    console.log(`\nFile not found: ${file}`);
  }
});



