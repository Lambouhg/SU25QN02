import { PrismaClient, QuestionItemType, QuizLevel, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

// Quick seed data for testing the new features
const QUICK_QUESTIONS = [
  {
    stem: "What is the virtual DOM in React?",
    type: "single_choice",
    level: "junior",
    difficulty: "easy",
    category: "Frontend",
    fields: ["Frontend Development"],
    topics: ["React", "Virtual DOM"],
    skills: ["React", "JavaScript"],
    explanation: "The virtual DOM is a programming concept where a virtual representation of the UI is kept in memory and synced with the real DOM.",
    options: [
      { text: "A virtual representation of the UI kept in memory", isCorrect: true, order: 0 },
      { text: "A CSS framework for React", isCorrect: false, order: 1 },
      { text: "A database for React apps", isCorrect: false, order: 2 },
      { text: "A testing framework", isCorrect: false, order: 3 }
    ]
  },
  {
    stem: "Explain the difference between SQL INNER JOIN and LEFT JOIN",
    type: "free_text",
    level: "middle",
    difficulty: "medium",
    category: "Database",
    fields: ["Database"],
    topics: ["SQL", "Joins"],
    skills: ["SQL", "Database Design"],
    explanation: "INNER JOIN returns only matching rows from both tables, while LEFT JOIN returns all rows from the left table and matching rows from the right table."
  },
  {
    stem: "How would you implement rate limiting in a REST API?",
    type: "free_text",
    level: "senior",
    difficulty: "hard",
    category: "Backend",
    fields: ["Backend Development", "API Design"],
    topics: ["Rate Limiting", "API Security"],
    skills: ["API Design", "Security", "System Design"],
    explanation: "Rate limiting can be implemented using token bucket, sliding window, or fixed window algorithms, often with Redis for distributed systems."
  },
  {
    stem: "Which HTTP status code indicates a successful POST request that created a resource?",
    type: "single_choice",
    level: "junior",
    difficulty: "easy",
    category: "Backend",
    fields: ["Backend Development"],
    topics: ["HTTP", "REST API"],
    skills: ["HTTP", "Web Development"],
    explanation: "201 Created indicates that the request has been fulfilled and resulted in a new resource being created.",
    options: [
      { text: "201 Created", isCorrect: true, order: 0 },
      { text: "200 OK", isCorrect: false, order: 1 },
      { text: "202 Accepted", isCorrect: false, order: 2 },
      { text: "204 No Content", isCorrect: false, order: 3 }
    ]
  },
  {
    stem: "What is the time complexity of binary search?",
    type: "single_choice",
    level: "middle",
    difficulty: "medium",
    category: "Algorithms",
    fields: ["Computer Science"],
    topics: ["Algorithms", "Time Complexity"],
    skills: ["Algorithms", "Big O Notation"],
    explanation: "Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.",
    options: [
      { text: "O(log n)", isCorrect: true, order: 0 },
      { text: "O(n)", isCorrect: false, order: 1 },
      { text: "O(n log n)", isCorrect: false, order: 2 },
      { text: "O(1)", isCorrect: false, order: 3 }
    ]
  }
];

async function main() {
  console.log('🌱 Seeding quick questions for testing...');

  for (const questionData of QUICK_QUESTIONS) {
    try {
      const question = await prisma.questionItem.create({
        data: {
          stem: questionData.stem,
          type: questionData.type as any,
          level: questionData.level as any,
          difficulty: questionData.difficulty as any,
          category: questionData.category,
          fields: questionData.fields,
          topics: questionData.topics,
          skills: questionData.skills,
          explanation: questionData.explanation,
          version: 1,
          isArchived: false,
          options: questionData.options ? {
            createMany: {
              data: questionData.options
            }
          } : undefined
        },
        include: { options: true }
      });

      console.log(`✅ Created question: ${question.stem.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to create question: ${questionData.stem.substring(0, 50)}...`, error);
    }
  }

  console.log('🎉 Quick seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
