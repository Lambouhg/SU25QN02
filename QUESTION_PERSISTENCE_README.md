# Question Set Persistence Implementation

## Problem Solved

Previously, when users generated interview questions from job descriptions and then navigated to practice a question, returning to the JD page would lose all generated questions. Users had to regenerate questions every time.

## Solution Overview

Implemented a comprehensive question set persistence system with the following components:

### 1. Database Schema (MongoDB)

- **QuestionSet Model** (`src/models/questionSet.ts`)
  - Stores question sets with metadata (job title, level, type, questions)
  - User-specific storage with timestamps
  - Supports both technical and behavioral questions

### 2. API Endpoints

- **POST `/api/question-sets`** - Save new question set
- **GET `/api/question-sets`** - Retrieve user's saved question sets
- **GET `/api/question-sets/[id]`** - Get specific question set
- **DELETE `/api/question-sets/[id]`** - Delete question set

### 3. Level-Based AI Question Generation

Enhanced the AI service (`src/services/azureAiservicesforJD.js`) with:

- **Junior Level**: Focus on fundamental concepts, learning ability, basic problem-solving
- **Mid Level**: Practical experience, architecture decisions, team leadership
- **Senior Level**: System design, strategic thinking, organizational impact

### 4. Frontend Components

#### New Components:

- **LevelSelector** (`src/components/JobDescription/LevelSelector.tsx`)

  - Beautiful UI for selecting experience level
  - Visual cards with descriptions for each level

- **SavedQuestionSets** (`src/components/JobDescription/SavedQuestionSets.tsx`)
  - Displays saved question sets with metadata
  - Click to load, delete functionality
  - Real-time refresh and error handling

#### Enhanced Components:

- **UploadSection** - Now includes level selection
- **QuestionsDisplay** - Added clear session functionality and return URL handling

### 5. State Management

- **localStorage persistence** - Current session state preserved
- **URL-based navigation** - Smart return URLs to maintain context
- **Automatic save** - Questions automatically saved after generation

### 6. Navigation Flow

```
JD Upload → Generate Questions (Auto-saved) → Practice Question → Return to Same State
    ↑                                                                      ↓
    ←←←←←←←←← Saved Question Sets (Load Previous) ←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

## Key Features

### 🎯 Level-Appropriate Questions

- **Junior**: "Describe your understanding of React hooks and give an example of when you would use useState vs useEffect"
- **Mid**: "How would you architect a scalable React application with multiple teams contributing to different features?"
- **Senior**: "Design a technical strategy for migrating a legacy monolith to a modern React-based microservices architecture"

### 💾 Persistent Storage

- Questions saved automatically after generation
- Metadata includes job title, file name, creation date
- User-specific storage with MongoDB

### 🔄 Seamless Navigation

- Click question → Practice → Return to exact same state
- No loss of generated questions
- Smart URL handling for context preservation

### 📚 Question Set Management

- Browse previously generated question sets
- Load any saved set instantly
- Delete unwanted sets
- Visual indicators for question type and level

## Technical Implementation

### Database Connection

```typescript
// MongoDB connection with Mongoose
const questionSet = new QuestionSet({
  userId,
  jobTitle,
  questionType: 'technical' | 'behavioral',
  level: 'junior' | 'mid' | 'senior',
  questions: string[],
  originalJDText,
  fileName
});
```

### Level-Based Prompts

```javascript
const systemPrompts = {
  technical: {
    vi: {
      junior: "Focus on fundamental concepts...",
      mid: "Focus on practical experience...",
      senior: "Focus on system design...",
    },
  },
};
```

### State Persistence

```typescript
// localStorage for session state
const state = {
  questions,
  questionType,
  level,
  currentQuestionSetId,
  timestamp: Date.now(),
};
localStorage.setItem("jd_page_state", JSON.stringify(state));
```

## Usage Flow

1. **Upload JD & Select Level**

   - Choose experience level (Junior/Mid/Senior)
   - Select question type (Technical/Behavioral)
   - Upload job description file

2. **Generate & Auto-Save**

   - AI generates level-appropriate questions
   - Questions automatically saved to database
   - Current state stored in localStorage

3. **Practice Questions**

   - Click any question to practice
   - Get AI feedback on answers
   - Return button preserves context

4. **Manage Question Sets**
   - View saved question sets
   - Load previous sessions instantly
   - Clean up unwanted sets

## Files Modified/Created

### New Files:

- `src/models/questionSet.ts` - MongoDB schema
- `src/services/questionSetService.ts` - Service layer
- `src/app/api/question-sets/route.ts` - API endpoints
- `src/app/api/question-sets/[id]/route.ts` - Individual set API
- `src/components/JobDescription/LevelSelector.tsx` - Level selection UI
- `src/components/JobDescription/SavedQuestionSets.tsx` - Saved sets management

### Enhanced Files:

- `src/app/(dashboard)/jd/page.tsx` - Main JD page with persistence
- `src/components/JobDescription/UploadSection.tsx` - Added level selector
- `src/components/JobDescription/QuestionsDisplay.tsx` - Enhanced navigation
- `src/app/(dashboard)/interview/[questionId]/page.tsx` - Smart return URLs
- `src/services/azureAiservicesforJD.js` - Level-based prompts

## Environment Setup

Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/interview-app
# Add other required environment variables
```

## Benefits Achieved

✅ **No more lost questions** - Generated questions persist across navigation
✅ **Smart question difficulty** - AI adapts questions to experience level  
✅ **Efficient workflow** - Users can resume where they left off
✅ **Question library** - Build a personal collection of relevant questions
✅ **Better user experience** - Seamless practice sessions without regeneration

The implementation solves the core issue while adding significant value through level-based question generation and comprehensive question set management.
