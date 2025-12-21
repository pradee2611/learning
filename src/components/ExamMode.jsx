import React, { useState, useEffect } from 'react'
import './ExamMode.css'

function ExamMode({ questions, onFinish, examStarted }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [questionStatus, setQuestionStatus] = useState({}) // Track correct/incorrect status
  const [timeRemaining, setTimeRemaining] = useState(60 * 60) // 60 minutes in seconds
  const [examFinished, setExamFinished] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!examStarted || examFinished) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleFinishExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [examStarted, examFinished])

  // Check if answer is correct
  const checkAnswerCorrectness = (selected, question) => {
    if (!selected) return null
    
    const originalCorrect = question.originalCorrectAnswer
    const getOptionLabel = (opt) => {
      const idx = question.options.indexOf(opt)
      return String.fromCharCode(65 + idx)
    }
    
    if (Array.isArray(originalCorrect)) {
      // Multiple choice
      const selectedLabels = Array.isArray(selected)
        ? selected.map(s => getOptionLabel(s)).map(s => s.trim().toUpperCase())
        : [getOptionLabel(selected)].map(s => s.trim().toUpperCase())
      const correctLabels = originalCorrect.map(c => String(c).trim().toUpperCase())
      
      // Check if arrays match (same length and same elements)
      if (selectedLabels.length === correctLabels.length &&
          selectedLabels.every(label => correctLabels.includes(label)) &&
          correctLabels.every(label => selectedLabels.includes(label))) {
        return true
      }
      return false
    } else {
      // Single choice
      const correctAnswer = String(originalCorrect || question.correctAnswer || '').trim().toUpperCase()
      const selectedLabel = getOptionLabel(selected).trim().toUpperCase()
      return correctAnswer === selectedLabel
    }
  }

  const handleAnswerSelect = (option) => {
    const currentQ = questions[currentIndex]
    const currentSelected = selectedAnswers[currentIndex]
    let newSelected = null
    
    if (currentQ.isMultipleChoice) {
      // For multiple choice, toggle the option
      const selectedArray = Array.isArray(currentSelected) ? [...currentSelected] : []
      const optionIndex = selectedArray.indexOf(option)
      
      if (optionIndex >= 0) {
        // Remove if already selected
        selectedArray.splice(optionIndex, 1)
      } else {
        // Add if not selected
        selectedArray.push(option)
      }
      
      newSelected = selectedArray.length > 0 ? selectedArray : null
    } else {
      // Single choice - replace selection
      newSelected = option
    }
    
    const updatedAnswers = { ...selectedAnswers }
    if (newSelected) {
      updatedAnswers[currentIndex] = newSelected
    } else {
      delete updatedAnswers[currentIndex]
    }
    setSelectedAnswers(updatedAnswers)
    
    // Don't check correctness during exam - only after finishing
    // Status will be calculated when exam is finished
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleQuestionClick = (index) => {
    setCurrentIndex(index)
  }

  const handleFinishExam = () => {
    // Calculate status for all answered questions
    const newStatus = {}
    questions.forEach((q, index) => {
      const selected = selectedAnswers[index]
      if (selected) {
        const isCorrect = checkAnswerCorrectness(selected, q)
        newStatus[index] = isCorrect
      }
    })
    setQuestionStatus(newStatus)
    setExamFinished(true)
    setShowResults(true)
  }

  const handleReviewAnswers = () => {
    setShowResults(false)
    setExamFinished(true)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getOptionLabel = (index) => {
    return String.fromCharCode(65 + index)
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((q, index) => {
      const selected = selectedAnswers[index]
      if (selected) {
        const originalCorrect = q.originalCorrectAnswer
        const optionIndex = q.options.indexOf(selected)
        const optionLabel = getOptionLabel(optionIndex)
        
        if (Array.isArray(originalCorrect)) {
          // Multiple choice - check if all selected answers match
          const selectedLabels = Array.isArray(selected) 
            ? selected.map(s => getOptionLabel(q.options.indexOf(s)))
            : [optionLabel]
          const correctLabels = originalCorrect.map(c => String(c).trim().toUpperCase())
          const selectedUpper = selectedLabels.map(s => String(s).trim().toUpperCase())
          
          // Check if arrays match (same length and same elements)
          if (selectedUpper.length === correctLabels.length &&
              selectedUpper.every(label => correctLabels.includes(label))) {
            correct++
          }
        } else {
          // Single choice
          const correctAnswer = String(originalCorrect || q.correctAnswer || '').trim().toUpperCase()
          if (correctAnswer === optionLabel || correctAnswer === selected.trim().toUpperCase()) {
            correct++
          }
        }
      }
    })
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) }
  }

  const isCorrect = (option, questionIndex) => {
    // Only show correct answer after exam is finished
    if (!examFinished) return false
    
    const q = questions[questionIndex]
    const originalCorrect = q.originalCorrectAnswer
    const optionIndex = q.options.indexOf(option)
    const optionLabel = getOptionLabel(optionIndex)
    
    if (Array.isArray(originalCorrect)) {
      // Multiple choice - check if this option is in the correct answers
      const correctLabels = originalCorrect.map(c => String(c).trim().toUpperCase())
      return correctLabels.includes(optionLabel)
    } else {
      // Single choice
      const correctAnswer = String(originalCorrect || q.correctAnswer || '').trim().toUpperCase()
      return correctAnswer === optionLabel || correctAnswer === option.trim().toUpperCase()
    }
  }

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = selectedAnswers[currentIndex]
  const score = showResults ? calculateScore() : null

  if (showResults) {
    return (
      <div className="exam-mode">
        <div className="results-container">
          <div className="results-card">
            <h2>📊 Exam Results</h2>
            <div className="score-display">
              <div className="score-circle">
                <div className="score-value">{score.percentage}%</div>
                <div className="score-label">Score</div>
              </div>
              <div className="score-details">
                <div className="score-item">
                  <span className="score-label-text">Correct:</span>
                  <span className="score-value-text correct">{score.correct}</span>
                </div>
                <div className="score-item">
                  <span className="score-label-text">Incorrect:</span>
                  <span className="score-value-text incorrect">{score.total - score.correct}</span>
                </div>
                <div className="score-item">
                  <span className="score-label-text">Total:</span>
                  <span className="score-value-text">{score.total}</span>
                </div>
                <div className="score-item">
                  <span className="score-label-text">Unanswered:</span>
                  <span className="score-value-text">{score.total - Object.keys(selectedAnswers).length}</span>
                </div>
              </div>
            </div>
            <div className="results-actions">
              <button className="btn btn-primary" onClick={handleReviewAnswers}>
                Review Answers
              </button>
              <button className="btn btn-secondary" onClick={onFinish}>
                Start New Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="exam-mode">
      <div className="exam-header">
        <div className="exam-info">
          <h2>⏱️ Exam Mode</h2>
          <div className="timer">
            <span className={timeRemaining < 300 ? 'timer-warning' : ''}>
              ⏰ {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
        <div className="exam-progress">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <button className="btn btn-danger" onClick={handleFinishExam}>
          Finish Exam
        </button>
      </div>

      <div className="exam-content">
        <div className="question-panel">
          <div className="question-card">
            <div className="question-header">
              <div className="question-meta">
                {currentQuestion.source && (
                  <span className="source-badge">{currentQuestion.source}</span>
                )}
                {currentQuestion.isMultipleChoice && (
                  <span className="multiple-choice-badge">
                    ⚠️ Multiple Choice - Select all correct answers
                  </span>
                )}
              </div>
              <h2 className="question-text">{currentQuestion.question}</h2>
            </div>
            
            <div className="options-list">
              {currentQuestion.options.map((option, index) => {
                const optionLabel = getOptionLabel(index)
                const isSelected = currentQuestion.isMultipleChoice
                  ? Array.isArray(selectedAnswer) && selectedAnswer.includes(option)
                  : selectedAnswer === option
                const correct = isCorrect(option, currentIndex)
                // Only show correctness after exam is finished
                const showCorrectness = examFinished
                const isWrongSelection = isSelected && !correct && examFinished
                
                return (
                  <button
                    key={index}
                    className={`option-button ${isSelected ? 'selected' : ''} ${showCorrectness && correct ? 'correct' : ''} ${isWrongSelection ? 'incorrect' : ''}`}
                    onClick={() => !examFinished && handleAnswerSelect(option)}
                    disabled={examFinished}
                  >
                    <span className="option-label">{optionLabel}</span>
                    <span className="option-text">{option}</span>
                    {showCorrectness && correct && <span className="checkmark">✓</span>}
                    {isWrongSelection && <span className="crossmark">✗</span>}
                  </button>
                )
              })}
            </div>

            {examFinished && (
              <div className="answer-explanation">
                <div className="correct-answer">
                  <strong>Correct Answer{currentQuestion.isMultipleChoice ? 's' : ''}:</strong> {
                    Array.isArray(currentQuestion.originalCorrectAnswer)
                      ? currentQuestion.originalCorrectAnswer.join(', ')
                      : currentQuestion.correctAnswer || 'Not specified'
                  }
                </div>
                {currentQuestion.explanation && (
                  <div className="explanation">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="navigation-buttons">
            <button
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="question-nav-panel">
          <h3>Question Navigator</h3>
          <div className="question-grid">
            {questions.map((q, index) => {
              const isAnswered = selectedAnswers[index]
              const isCurrent = index === currentIndex
              const status = examFinished ? questionStatus[index] : undefined
              
              return (
                <button
                  key={index}
                  className={`question-number ${isCurrent ? 'active' : ''} ${isAnswered ? 'answered' : ''} ${examFinished && status === true ? 'correct' : ''} ${examFinished && status === false ? 'incorrect' : ''}`}
                  onClick={() => handleQuestionClick(index)}
                  title={examFinished ? (status === true ? 'Correct' : status === false ? 'Incorrect' : isAnswered ? 'Answered' : 'Unanswered') : (isAnswered ? 'Answered' : 'Unanswered')}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-color current"></span>
              <span>Current</span>
            </div>
            {examFinished && (
              <>
                <div className="legend-item">
                  <span className="legend-color correct"></span>
                  <span>Correct</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color incorrect"></span>
                  <span>Incorrect</span>
                </div>
              </>
            )}
            <div className="legend-item">
              <span className="legend-color answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-color unanswered"></span>
              <span>Unanswered</span>
            </div>
          </div>
          <div className="answered-summary">
            {examFinished && (
              <>
                <div>Correct: {Object.values(questionStatus).filter(s => s === true).length}</div>
                <div>Incorrect: {Object.values(questionStatus).filter(s => s === false).length}</div>
              </>
            )}
            <div>Answered: {Object.keys(selectedAnswers).length} / {questions.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamMode



