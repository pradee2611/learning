import React, { useState } from 'react'
import './StudyMode.css'

function StudyMode({ questions }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({}) // Store answers for all questions
  const [showAnswer, setShowAnswer] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set())
  const [questionStatus, setQuestionStatus] = useState({}) // Track correct/incorrect status

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = selectedAnswers[currentIndex] || null
  const isAnswered = answeredQuestions.has(currentIndex)

  // Check if current answer is correct
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
    let newSelected = null
    
    if (currentQuestion.isMultipleChoice) {
      // For multiple choice, toggle the option
      const selectedArray = Array.isArray(selectedAnswer) ? [...selectedAnswer] : []
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
      // Single choice
      newSelected = option
    }
    
    // Update selected answers for current question
    const updatedAnswers = { ...selectedAnswers }
    if (newSelected) {
      updatedAnswers[currentIndex] = newSelected
    } else {
      delete updatedAnswers[currentIndex]
    }
    setSelectedAnswers(updatedAnswers)
    
    // Check correctness in real-time
    if (newSelected) {
      const isCorrect = checkAnswerCorrectness(newSelected, currentQuestion)
      setQuestionStatus({
        ...questionStatus,
        [currentIndex]: isCorrect
      })
      setAnsweredQuestions(new Set([...answeredQuestions, currentIndex]))
    } else {
      // Clear status if answer is deselected
      const newStatus = { ...questionStatus }
      delete newStatus[currentIndex]
      setQuestionStatus(newStatus)
      const newAnswered = new Set(answeredQuestions)
      newAnswered.delete(currentIndex)
      setAnsweredQuestions(newAnswered)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }

  const handleQuestionClick = (index) => {
    setCurrentIndex(index)
    setShowAnswer(false)
  }

  const getOptionLabel = (index) => {
    return String.fromCharCode(65 + index) // A, B, C, D, etc.
  }

  const isCorrect = (option) => {
    // Show correct answer in real-time or when showAnswer is true
    const originalCorrect = currentQuestion.originalCorrectAnswer
    const optionIndex = currentQuestion.options.indexOf(option)
    const optionLabel = getOptionLabel(optionIndex)
    
    if (Array.isArray(originalCorrect)) {
      // Multiple choice - check if this option is in the correct answers
      const correctLabels = originalCorrect.map(c => String(c).trim().toUpperCase())
      return correctLabels.includes(optionLabel)
    } else {
      // Single choice
      const correctAnswer = String(originalCorrect || currentQuestion.correctAnswer || '').trim().toUpperCase()
      return correctAnswer === optionLabel || correctAnswer === option.trim().toUpperCase()
    }
  }

  // Check if current question's answer is correct
  const currentAnswerIsCorrect = questionStatus[currentIndex] === true
  const currentAnswerIsIncorrect = questionStatus[currentIndex] === false

  return (
    <div className="study-mode">
      <div className="study-header">
        <div className="progress-info">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="answered-count">
          Answered: {answeredQuestions.size} / {questions.length}
        </div>
      </div>

      <div className="study-content">
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
                const correct = isCorrect(option)
                const showCorrectness = selectedAnswer !== null || showAnswer
                const isWrongSelection = isSelected && !correct && showCorrectness
                
                return (
                  <button
                    key={index}
                    className={`option-button ${isSelected ? 'selected' : ''} ${showCorrectness && correct ? 'correct' : ''} ${isWrongSelection ? 'incorrect' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <span className="option-label">{optionLabel}</span>
                    <span className="option-text">{option}</span>
                    {showCorrectness && correct && <span className="checkmark">✓</span>}
                    {isWrongSelection && <span className="crossmark">✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Real-time feedback */}
            {selectedAnswer !== null && !showAnswer && (
              <div className={`real-time-feedback ${currentAnswerIsCorrect ? 'correct-feedback' : currentAnswerIsIncorrect ? 'incorrect-feedback' : ''}`}>
                {currentAnswerIsCorrect ? (
                  <div className="feedback-message correct-message">
                    ✓ Correct! Well done!
                  </div>
                ) : currentAnswerIsIncorrect ? (
                  <div className="feedback-message incorrect-message">
                    ✗ Incorrect. Try again or click "Show Answer" to see the correct answer.
                  </div>
                ) : null}
              </div>
            )}

            {showAnswer && (
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

            {!showAnswer && (
              <button 
                className="btn btn-primary show-answer-btn"
                onClick={() => setShowAnswer(true)}
              >
                Show Answer
              </button>
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
              const status = questionStatus[index]
              const isAnswered = answeredQuestions.has(index)
              return (
                <button
                  key={index}
                  className={`question-number ${index === currentIndex ? 'active' : ''} ${isAnswered ? 'answered' : ''} ${status === true ? 'correct' : ''} ${status === false ? 'incorrect' : ''}`}
                  onClick={() => handleQuestionClick(index)}
                  title={status === true ? 'Correct' : status === false ? 'Incorrect' : isAnswered ? 'Answered' : 'Unanswered'}
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
            <div className="legend-item">
              <span className="legend-color correct"></span>
              <span>Correct</span>
            </div>
            <div className="legend-item">
              <span className="legend-color incorrect"></span>
              <span>Incorrect</span>
            </div>
            <div className="legend-item">
              <span className="legend-color unanswered"></span>
              <span>Unanswered</span>
            </div>
          </div>
          <div className="answered-summary">
            <div>Correct: {Object.values(questionStatus).filter(s => s === true).length}</div>
            <div>Incorrect: {Object.values(questionStatus).filter(s => s === false).length}</div>
            <div>Answered: {answeredQuestions.size} / {questions.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudyMode



