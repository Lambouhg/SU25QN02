/**
 * 📊 TÓM TẮT CÁCH TÍNH AVERAGE SCORE TRONG HỆ THỐNG
 * 
 * Document này giải thích chi tiết cách hệ thống tính Average Score
 * và tại sao chọn Daily Average Method
 */

// ============================================================================
// 🎯 PHƯƠNG PHÁP HIỆN TẠI: DAILY AVERAGE METHOD
// ============================================================================

/**
 * FLOW TÍNH TOÁN:
 * 
 * 1. Lấy tất cả UserActivityEvent trong 30 ngày có score ≠ null
 * 2. Group activities theo ngày (YYYY-MM-DD format)
 * 3. Tính trung bình score cho mỗi ngày
 * 4. Tính trung bình của các daily averages
 * 
 * CÔNG THỨC:
 * AverageScore = (Sum of Daily Averages) / (Number of Days with Activities)
 */

const exampleCalculation = {
  rawData: [
    { date: '2025-09-15', scores: [3.8], count: 1 },
    { date: '2025-09-16', scores: [8.3, 8.3], count: 2 },
    { date: '2025-09-17', scores: [8.5, 8.3, 2.7, 3.8, 2.3], count: 5 },
    { date: '2025-09-20', scores: [3.8], count: 1 }
  ],
  
  dailyAverages: [
    { date: '2025-09-15', average: 3.80 },
    { date: '2025-09-16', average: 8.30 },
    { date: '2025-09-17', average: 5.12 },
    { date: '2025-09-20', average: 3.80 }
  ],
  
  calculation: {
    totalDailyAverages: 21.02,
    numberOfDays: 4,
    finalAverage: 5.26 // 21.02 ÷ 4 = 5.26
  }
};

// ============================================================================
// 🔄 SO SÁNH VỚI CÁC PHƯƠNG PHÁP KHÁC
// ============================================================================

const comparisonMethods = {
  // Phương pháp hiện tại
  dailyAverage: {
    method: "Group by day → Calculate daily averages → Average the daily averages",
    result: 5.26,
    formula: "(3.80 + 8.30 + 5.12 + 3.80) ÷ 4 = 5.26"
  },
  
  // Phương pháp đơn giản
  simpleAverage: {
    method: "Average all individual scores directly",
    result: 5.53,
    formula: "(3.8 + 8.3 + 8.3 + 8.5 + 8.3 + 2.7 + 3.8 + 2.3 + 3.8) ÷ 9 = 5.53"
  },
  
  // Phương pháp có trọng số
  weightedAverage: {
    method: "Weight daily averages by number of activities",
    result: 5.53,
    formula: "((3.80×1) + (8.30×2) + (5.12×5) + (3.80×1)) ÷ 9 = 5.53"
  }
};

// ============================================================================
// 🎯 TẠI SAO CHỌN DAILY AVERAGE METHOD?
// ============================================================================

const educationalReasons = {
  consistency: {
    description: "Khuyến khích học đều đặn hàng ngày",
    example: "User học 1 bài/ngày x 5 ngày sẽ có advantage hơn user học 5 bài trong 1 ngày"
  },
  
  fairness: {
    description: "Công bằng cho tất cả learning patterns",
    example: "User bận không thể học nhiều trong 1 ngày vẫn có cơ hội cạnh tranh"
  },
  
  antiGaming: {
    description: "Tránh gaming behavior",
    example: "User không thể 'spam' nhiều activities trong 1 ngày để tăng average"
  },
  
  pedagogical: {
    description: "Phù hợp với nguyên lý giáo dục",
    example: "Spaced learning tốt hơn massed learning theo research"
  }
};

// ============================================================================
// 💾 CODE IMPLEMENTATION
// ============================================================================

const actualImplementation = `
// Trong /api/tracking/route.ts

// Bước 1: Lấy activities trong 30 ngày
const monthlyActivityEvents = await prisma.userActivityEvent.findMany({
  where: { 
    userId: user.id,
    timestamp: { gte: thirtyDaysAgo, lte: now },
    score: { not: null }
  },
  select: { score: true, timestamp: true }
});

// Bước 2: Group theo ngày
const dailyScoresMap = new Map<string, number[]>();
monthlyActivityEvents.forEach(event => {
  const day = event.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
  if (!dailyScoresMap.has(day)) {
    dailyScoresMap.set(day, []);
  }
  if (event.score) {
    dailyScoresMap.get(day)!.push(event.score);
  }
});

// Bước 3: Tính daily averages
const dailyAverages = Array.from(dailyScoresMap.values()).map(scores => 
  scores.reduce((sum, score) => sum + score, 0) / scores.length
);

// Bước 4: Tính overall average
const averageScore = dailyAverages.length > 0 
  ? dailyAverages.reduce((sum, avg) => sum + avg, 0) / dailyAverages.length
  : 0;
`;

// ============================================================================
// 📈 IMPACT ANALYSIS
// ============================================================================

const impactAnalysis = {
  scenarios: {
    consistentLearner: {
      pattern: "1 activity per day × 5 days",
      scores: [7, 7, 7, 7, 7],
      dailyAverage: 7.0,
      simpleAverage: 7.0,
      result: "Không có sự khác biệt"
    },
    
    bingeLearner: {
      pattern: "5 activities in 1 day",
      scores: [6, 7, 7, 8, 9], // Cùng total nhưng concentrated
      dailyAverage: 7.4, // (7.4) ÷ 1 = 7.4
      simpleAverage: 7.4,
      result: "Không có sự khác biệt nếu chỉ có 1 ngày"
    },
    
    mixedPattern: {
      pattern: "Day 1: [9], Day 2: [5, 5], Day 3: [7, 7, 7]",
      dailyAverage: 7.0, // (9 + 5 + 7) ÷ 3 = 7.0
      simpleAverage: 6.67, // (9 + 5 + 5 + 7 + 7 + 7) ÷ 6 = 6.67
      result: "Daily method rewards consistency"
    }
  }
};

// ============================================================================
// 🏆 KẾT LUẬN
// ============================================================================

console.log(`
📊 TỔNG KẾT: CÁCH TÍNH AVERAGE SCORE

🎯 PHƯƠNG PHÁP HIỆN TẠI:
   Daily Average Method - Tính trung bình theo ngày, sau đó tính trung bình của các ngày

📝 CÁC BƯỚC TÍNH TOÁN:
   1. Lấy UserActivityEvent trong 30 ngày (score ≠ null)
   2. Group theo ngày (timestamp → YYYY-MM-DD)
   3. Tính average score cho mỗi ngày
   4. Tính average của các daily averages
   
💡 VÍ DỤ MINH HỌA:
   Raw data: [3.8], [8.3, 8.3], [8.5, 8.3, 2.7, 3.8, 2.3], [3.8]
   Daily avgs: 3.80, 8.30, 5.12, 3.80
   Final avg: (3.80 + 8.30 + 5.12 + 3.80) ÷ 4 = 5.26

✅ ƯU ĐIỂM:
   • Khuyến khích học đều đặn hàng ngày
   • Công bằng cho mọi learning pattern  
   • Tránh gaming behavior (spam activities)
   • Phù hợp với mục tiêu giáo dục
   • Dễ hiểu và giải thích cho user

🔄 ĐỒNG BỘ:
   Cả /api/tracking và /api/enhanced-analytics đều dùng cùng logic này
   
🎓 GIÁO DỤC HỌC:
   Spaced learning > Massed learning
   Consistency > Volume
   Good habits > Quick gains
`);

export { 
  exampleCalculation, 
  comparisonMethods, 
  educationalReasons, 
  impactAnalysis,
  actualImplementation 
};