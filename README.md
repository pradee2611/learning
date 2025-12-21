# Databricks Exam Practice Application

A modern, interactive web application for studying and practicing for the Databricks certification exam.

## Features

### 📖 Study Mode
- Browse questions at your own pace
- See correct answers and explanations immediately
- Track which questions you've answered
- Navigate easily between questions
- Visual progress indicator

### ⏱️ Exam Mode
- Timed exam simulation (60 minutes)
- Real exam-like experience
- Answer review after completion
- Score calculation with detailed results
- Question navigation with answered/unanswered indicators

### 📊 Key Features
- Upload Excel files (.xlsx, .xls) with exam questions
- Modern, responsive UI design
- Question navigator with visual indicators
- Progress tracking
- Answer explanations
- Score calculation and results display

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Excel File Format

The application supports Excel files with the following formats:

### Format 1: Column-based
- Column 1: Questions
- Columns 2-5: Options (A, B, C, D)
- Last column: Correct Answer

### Format 2: Row-based
- Each row contains:
  - Question number/text
  - Options (A, B, C, D, etc.)
  - Correct Answer
  - Explanation (optional)

### Format 3: Structured with Headers
- Headers: Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation
- Each row is a question

## Usage

1. **Upload Questions**: Click "Choose File" and select your Excel file containing exam questions
2. **Study Mode**: Review questions, see answers, and learn at your own pace
3. **Exam Mode**: Click "Exam Mode" to start a timed practice exam
4. **Review Results**: After finishing the exam, review your answers and see your score

## Technologies Used

- React 18
- Vite
- xlsx.js (for Excel file parsing)
- Modern CSS with gradients and animations

## License

MIT



