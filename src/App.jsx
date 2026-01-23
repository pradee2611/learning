import React, { useState, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import StudyMode from './components/StudyMode'
import ExamMode from './components/ExamMode'
import databrickDump from './data/databrickDump.json'
import databrickMock2 from './data/DatabrickMock2.json'
import databrickMock3 from './data/databrickMock3.json'
import './App.css'

function App() {
  const [allQuestions, setAllQuestions] = useState([])
  const [questions, setQuestions] = useState([])
  const [selectedSets, setSelectedSets] = useState(new Set())
  const [mode, setMode] = useState('select') // 'select', 'upload', 'study', 'exam'
  const [examStarted, setExamStarted] = useState(false)
  const [questionSets, setQuestionSets] = useState([])

  useEffect(() => {
    // Combine all question sets
    const allQuestionSets = [
      { data: databrickDump, source: 'Databricks Dump', key: 'dump' },
      { data: databrickMock2, source: 'Databricks Mock 2', key: 'mock2' },
      { data: databrickMock3, source: 'Databricks Mock 3', key: 'mock3' }
    ]

    // Store question set metadata
    const setsMetadata = allQuestionSets.map(set => ({
      key: set.key,
      source: set.source,
      count: set.data.length
    }))
    setQuestionSets(setsMetadata)

    // Transform and combine all questions
    let transformedQuestions = []
    let globalQuestionId = 1

    allQuestionSets.forEach((questionSet) => {
      const questionsFromSet = questionSet.data.map((q) => {
        // Extract option letters from choices (they have "A. ", "B. " prefixes)
        const options = q.choices.map(choice => {
          // Remove the "A. ", "B. " prefix if present
          return choice.replace(/^[A-Z]\.\s*/, '').trim()
        })
        
        // Handle correct_answer - can be string or array
        // Some questions have string answers like "CE" or "DE" for multiple choice
        let correctAnswer = ''
        let originalCorrectAnswer = q.correct_answer
        
        if (Array.isArray(q.correct_answer)) {
          // For multiple choice array, join with comma
          correctAnswer = q.correct_answer.join(', ')
        } else {
          const answerStr = String(q.correct_answer || '')
          // Check if it's a multi-character string representing multiple answers (e.g., "CE", "DE")
          if (q.is_multiple_choice && answerStr.length > 1 && /^[A-Z]+$/.test(answerStr)) {
            // Convert "CE" to ["C", "E"] for consistency
            originalCorrectAnswer = answerStr.split('')
            correctAnswer = originalCorrectAnswer.join(', ')
          } else {
            correctAnswer = answerStr
          }
        }
        
        return {
          id: globalQuestionId++,
          question: q.question,
          options: options,
          correctAnswer: correctAnswer,
          isMultipleChoice: q.is_multiple_choice,
          originalCorrectAnswer: originalCorrectAnswer, // Keep original for comparison (now normalized)
          source: questionSet.source, // Add source identifier
          sourceKey: questionSet.key, // Add source key for filtering
          originalQuestionNumber: q.question_number // Keep original question number from source
        }
      })
      
      transformedQuestions = transformedQuestions.concat(questionsFromSet)
    })
    
    setAllQuestions(transformedQuestions)
  }, [])

  // Filter questions based on selected sets
  useEffect(() => {
    if (selectedSets.size === 0) {
      setQuestions([])
    } else {
      const filtered = allQuestions.filter(q => selectedSets.has(q.sourceKey))
      setQuestions(filtered)
    }
  }, [selectedSets, allQuestions])

  const handleSetToggle = (setKey) => {
    const newSelected = new Set(selectedSets)
    if (newSelected.has(setKey)) {
      newSelected.delete(setKey)
    } else {
      newSelected.add(setKey)
    }
    setSelectedSets(newSelected)
  }

  const handleSelectAll = () => {
    const allKeys = questionSets.map(s => s.key)
    setSelectedSets(new Set(allKeys))
  }

  const handleDeselectAll = () => {
    setSelectedSets(new Set())
  }

  const handleStartStudy = () => {
    if (selectedSets.size > 0) {
      setMode('study')
    }
  }

  const handleQuestionsLoaded = (loadedQuestions) => {
    setQuestions(loadedQuestions)
    setMode('study')
  }

  const startExam = () => {
    setExamStarted(true)
    setMode('exam')
  }

  const resetExam = () => {
    setExamStarted(false)
    setMode('select')
    setSelectedSets(new Set())
  }

  const backToSelection = () => {
    setMode('select')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 Databricks Exam Practice</h1>
        <p>Study and practice for your Databricks certification exam</p>
        {questions.length > 0 && mode !== 'select' && (
          <p className="question-count">
            Selected Questions: {questions.length} ({selectedSets.size} set{selectedSets.size !== 1 ? 's' : ''} selected)
          </p>
        )}
        {mode === 'select' && allQuestions.length > 0 && (
          <p className="question-count">
            Total Available: {allQuestions.length} questions from {questionSets.length} sets
          </p>
        )}
      </header>

      {mode === 'select' && (
        <div className="question-set-selector">
          <div className="selector-container">
            <h2>Select Question Sets to Study</h2>
            <p className="selector-description">Choose one or more question sets to study from</p>
            
            <div className="selector-actions">
              <button className="btn btn-secondary" onClick={handleSelectAll}>
                Select All
              </button>
              <button className="btn btn-secondary" onClick={handleDeselectAll}>
                Deselect All
              </button>
            </div>

            <div className="question-sets-grid">
              {questionSets.map((set) => {
                const isSelected = selectedSets.has(set.key)
                return (
                  <div
                    key={set.key}
                    className={`question-set-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSetToggle(set.key)}
                  >
                    <div className="set-checkbox">
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                    <div className="set-info">
                      <h3>{set.source}</h3>
                      <p>{set.count} questions</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="selector-footer">
              <button
                className="btn btn-primary btn-large"
                onClick={handleStartStudy}
                disabled={selectedSets.size === 0}
              >
                Start Studying ({selectedSets.size} set{selectedSets.size !== 1 ? 's' : ''} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <FileUpload onQuestionsLoaded={handleQuestionsLoaded} />
      )}

      {mode === 'study' && questions.length > 0 && (
        <div className="mode-selector">
          <div className="mode-buttons">
            <button className="btn btn-secondary" onClick={backToSelection}>
              ← Change Question Sets
            </button>
            <button className="btn btn-primary" onClick={() => setMode('study')}>
              📖 Study Mode
            </button>
            <button className="btn btn-success" onClick={startExam}>
              ⏱️ Exam Mode
            </button>
          </div>
          <StudyMode questions={questions} />
        </div>
      )}

      {mode === 'exam' && questions.length > 0 && (
        <ExamMode 
          questions={questions} 
          onFinish={resetExam}
          examStarted={examStarted}
        />
      )}
    </div>
  )
}

export default App



