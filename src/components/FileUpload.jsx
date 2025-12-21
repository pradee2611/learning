import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import './FileUpload.css'

function FileUpload({ onQuestionsLoaded }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          const questions = []
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // Try to detect question format
          // Common formats: Question, Option A, Option B, Option C, Option D, Correct Answer
          let currentQuestion = null
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (!row || row.length === 0) continue
            
            const firstCell = String(row[0] || '').trim()
            
            // Check if this is a question (starts with number or Q)
            if (firstCell.match(/^\d+[\.\)]|^Q\d+|^Question/i)) {
              if (currentQuestion) {
                questions.push(currentQuestion)
              }
              currentQuestion = {
                id: questions.length + 1,
                question: firstCell.replace(/^\d+[\.\)]\s*|^Q\d+[\.\):]\s*|^Question\s*:?\s*/i, '').trim() || row.slice(1).join(' ').trim(),
                options: [],
                correctAnswer: '',
                explanation: ''
              }
            } else if (currentQuestion) {
              // Check if this is an option (starts with A, B, C, D, etc.)
              if (firstCell.match(/^[A-Z][\.\)]\s*/i)) {
                const optionText = firstCell.replace(/^[A-Z][\.\)]\s*/i, '').trim() || row.slice(1).join(' ').trim()
                currentQuestion.options.push(optionText)
              }
              // Check if this is the correct answer
              else if (firstCell.match(/^(Correct|Answer|Key|Solution)/i)) {
                currentQuestion.correctAnswer = row.slice(1).join(' ').trim() || firstCell.replace(/^(Correct|Answer|Key|Solution):?\s*/i, '').trim()
              }
              // Check if this is an explanation
              else if (firstCell.match(/^(Explanation|Note|Reason)/i)) {
                currentQuestion.explanation = row.slice(1).join(' ').trim() || firstCell.replace(/^(Explanation|Note|Reason):?\s*/i, '').trim()
              }
            }
          }
          
          if (currentQuestion) {
            questions.push(currentQuestion)
          }
          
          // Alternative parsing: if structured as columns
          if (questions.length === 0 && jsonData.length > 1) {
            const headers = jsonData[0].map(h => String(h || '').toLowerCase())
            const questionCol = headers.findIndex(h => h.includes('question'))
            const answerCol = headers.findIndex(h => h.includes('answer') || h.includes('correct') || h.includes('key'))
            const explanationCol = headers.findIndex(h => h.includes('explanation') || h.includes('note'))
            
            // Find option columns - support both "Option A/B/C/D" and "Choice1/2/3/4" formats
            const optionCols = []
            const choiceCols = []
            
            headers.forEach((h, i) => {
              if (h.includes('option')) {
                // Extract letter from "option a", "option b", etc.
                const letterMatch = h.match(/option\s*([a-e])/i)
                if (letterMatch) {
                  optionCols.push({ index: i, letter: letterMatch[1].toUpperCase() })
                } else {
                  optionCols.push({ index: i, letter: String.fromCharCode(65 + optionCols.length) })
                }
              } else if (h.includes('choice')) {
                // Extract number from "choice1", "choice2", etc.
                const numMatch = h.match(/choice\s*(\d+)/i)
                if (numMatch) {
                  const num = parseInt(numMatch[1])
                  choiceCols.push({ index: i, letter: String.fromCharCode(64 + num) }) // A=65, B=66, etc.
                }
              } else if (/^[a-e]$/i.test(h.trim())) {
                // Direct letter column
                optionCols.push({ index: i, letter: h.trim().toUpperCase() })
              }
            })
            
            // Sort option columns by letter
            optionCols.sort((a, b) => a.letter.localeCompare(b.letter))
            choiceCols.sort((a, b) => a.letter.localeCompare(b.letter))
            
            const allOptionCols = optionCols.length > 0 ? optionCols : choiceCols
            
            if (questionCol >= 0) {
              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i]
                if (!row[questionCol]) continue
                
                const question = {
                  id: i,
                  question: String(row[questionCol] || '').trim(),
                  options: [],
                  correctAnswer: '',
                  explanation: explanationCol >= 0 ? String(row[explanationCol] || '').trim() : ''
                }
                
                // Get options in order
                const optionsMap = {}
                allOptionCols.forEach(col => {
                  const cellValue = row[col.index]
                  if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                    const strValue = String(cellValue).trim()
                    if (strValue && strValue.toLowerCase() !== 'nan' && strValue !== 'None') {
                      optionsMap[col.letter] = strValue
                    }
                  }
                })
                
                // Add options in order (A, B, C, D, E)
                ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
                  if (optionsMap[letter]) {
                    question.options.push(optionsMap[letter])
                  }
                })
                
                // Get correct answer
                if (answerCol >= 0 && row[answerCol]) {
                  let answer = String(row[answerCol]).trim()
                  
                  // Handle NaN values
                  if (answer.toLowerCase() === 'nan' || answer === '' || answer === 'None') {
                    answer = ''
                  } else {
                    // If answer is a full text, try to match with options
                    if (answer && answer.length > 1 && !/^[A-E]+$/.test(answer)) {
                      // Find matching option
                      for (let j = 0; j < question.options.length; j++) {
                        if (question.options[j].toLowerCase().includes(answer.toLowerCase()) || 
                            answer.toLowerCase().includes(question.options[j].toLowerCase())) {
                          answer = String.fromCharCode(65 + j) // A, B, C, D, E
                          break
                        }
                      }
                    }
                  }
                  
                  question.correctAnswer = answer
                }
                
                if (question.question && question.options.length >= 2) {
                  questions.push(question)
                }
              }
            }
          }
          
          // If still no questions, try a simpler approach
          if (questions.length === 0) {
            // Assume first column is questions, next columns are options
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i].filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
              if (row.length < 2) continue
              
              const question = {
                id: i,
                question: String(row[0]).trim(),
                options: row.slice(1, row.length - 1).map(cell => String(cell).trim()).filter(opt => opt),
                correctAnswer: String(row[row.length - 1]).trim(),
                explanation: ''
              }
              
              if (question.question) {
                questions.push(question)
              }
            }
          }
          
          resolve(questions.filter(q => q.question && q.options.length > 0))
        } catch (err) {
          reject(err)
        }
      }
      
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const questions = await parseExcelFile(file)
      if (questions.length === 0) {
        setError('No questions found in the file. Please check the file format.')
      } else {
        onQuestionsLoaded(questions)
      }
    } catch (err) {
      setError(`Error parsing file: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="file-upload-container">
      <div className="upload-box">
        <div className="upload-icon">📁</div>
        <h2>Upload Exam Questions</h2>
        <p>Upload your Excel file (.xlsx or .xls) containing exam questions</p>
        
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={loading}
            className="file-input"
          />
          <label htmlFor="file-upload" className="file-label">
            {loading ? 'Loading...' : 'Choose File'}
          </label>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="upload-hint">
          <p><strong>Supported formats:</strong></p>
          <ul>
            <li>Excel files (.xlsx, .xls)</li>
            <li>Questions with multiple choice options</li>
            <li>Correct answers marked</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default FileUpload

