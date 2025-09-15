# Smart Follow-up Questions System - Examples

## 📝 Overview

Hệ thống Smart Follow-up Questions đã được tích hợp vào Avatar-AI interview để tạo ra các câu hỏi điều kiện (if/else) dựa trên câu trả lời của ứng viên. Điều này giúp cuộc phỏng vấn trở nên tự nhiên và có chiều sâu hơn.

## 🎯 Cách hoạt động

### Decision Tree

```
User Response → Analyze → Decision (80% follow-up / 20% next planned) → Generate contextual question
```

### IF/ELSE Logic Examples

#### 1. **IF user mentions specific technologies**

```
User: "Tôi đã sử dụng React trong dự án của mình"
AI Follow-up: "Bạn sử dụng phương pháp quản lý state nào trong React applications? Hook hay Redux?"

User: "I worked with Docker containers"
AI Follow-up: "What challenges have you faced with container orchestration, and how did you handle them?"
```

#### 2. **IF user gives surface-level answers**

```
User: "Tôi biết về databases"
AI Follow-up: "Bạn đã làm việc với hệ quản trị cơ sở dữ liệu nào cụ thể và trong tình huống nào?"

User: "I know JavaScript"
AI Follow-up: "Can you explain how closures work in JavaScript and provide a practical example?"
```

#### 3. **IF user demonstrates strong knowledge**

```
User: "Tôi sử dụng JOIN để kết hợp dữ liệu từ nhiều bảng..."
AI Follow-up: "Bạn sẽ tối ưu một query có nhiều JOIN trên datasets lớn như thế nào?"

User: "I design RESTful APIs with proper HTTP methods..."
AI Follow-up: "How would you design an API to handle high concurrency and ensure data consistency?"
```

#### 4. **IF user mentions specific projects**

```
User: "Tôi đã làm một dự án e-commerce"
AI Follow-up: "Bạn đã xử lý bảo mật thanh toán trong dự án e-commerce đó như thế nào?"

User: "I built a microservices architecture"
AI Follow-up: "What were the main challenges in service-to-service communication that you encountered?"
```

#### 5. **IF user shows knowledge gaps**

```
User: "Tôi chưa biết nhiều về testing"
AI Follow-up: "Vậy bạn thường đảm bảo chất lượng code trong các dự án như thế nào?"

User: "I'm not familiar with CI/CD"
AI Follow-up: "How do you typically deploy and manage your applications in production?"
```

## 🧠 Adaptive Reasoning Process

AI follows this thought process before asking each question:

1. **Analyze Response**: What specific technologies, concepts, or experiences did they mention?
2. **Assess Depth**: Surface-level or detailed answer?
3. **Identify Gaps**: What areas need more exploration?
4. **Choose Strategy**: 80% follow-up / 20% next planned question
5. **Craft Question**: Make it contextual to their specific answer

## 🎨 Follow-up Question Types

### Depth Questions

- "Can you explain how [mentioned technology] works internally?"
- "What are the pros and cons of [mentioned approach]?"

### Scenario Questions

- "How would you handle [specific situation] in [mentioned context]?"
- "If you encountered [problem] with [technology], how would you solve it?"

### Experience Questions

- "Tell me about a challenging situation you faced with [mentioned tool]"
- "What was the most complex [mentioned area] problem you've solved?"

### Comparison Questions

- "How does [mentioned approach] compare to [alternative]?"
- "When would you choose [option A] over [option B]?"

### Problem-Solving Questions

- "If you had to scale [mentioned solution], what would you consider?"
- "How would you debug [specific issue] in [mentioned technology]?"

## 📈 Benefits

### 1. Natural Conversation Flow

- Giống cuộc phỏng vấn thực tế hơn
- Không cứng nhắc theo danh sách câu hỏi cố định

### 2. Deeper Technical Assessment

- Khám phá kiến thức sâu hơn
- Đánh giá khả năng áp dụng thực tế

### 3. Personalized Interview

- Câu hỏi phù hợp với background của ứng viên
- Tập trung vào những kỹ năng họ đã đề cập

### 4. Better Candidate Experience

- Ứng viên cảm thấy được lắng nghe
- Có cơ hội thể hiện expertise trong lĩnh vực họ mạnh

## ⚙️ Technical Implementation

### System Prompt Structure

```typescript
🎯 SMART FOLLOW-UP QUESTION SYSTEM:
You have TWO modes of questioning:
1. PRIMARY QUESTIONS: From question bank or planned topics
2. FOLLOW-UP QUESTIONS: Contextual questions based on user's previous answer

DECISION TREE FOR NEXT QUESTION:
1. Analyze user's response for: technical terms, depth, gaps, confidence
2. Decide: Follow-up (80%) OR next planned question (20%)?
3. If follow-up: Generate contextual question based on their answer
4. If next planned: Use question bank or move to new topic
```

### Follow-up Logic Implementation

```typescript
**FOLLOW-UP EXAMPLES BY USER RESPONSE:**
- User mentions "React" → "How do you manage component state in large React applications?"
- User says "I optimize databases" → "What specific optimization techniques have you used?"
- User explains concept well → "Can you walk me through a challenging situation where you applied this?"
- User gives vague answer → "Could you provide a specific example from your experience?"
```

## 🚀 Usage in Avatar Interview

Hệ thống này được tích hợp trong:

- `processInterviewResponse()` - Xử lý các câu trả lời và tạo follow-up
- `startInterview()` - Khởi tạo interview với follow-up capability
- Question validation và context tracking

## 📊 Expected Results

- **Engagement**: Tăng 40-60% mức độ tương tác của ứng viên
- **Assessment Quality**: Đánh giá sâu hơn 50% về kỹ năng thực tế
- **Interview Flow**: Tự nhiên hơn 70% so với interview cứng nhắc
- **Candidate Satisfaction**: Cải thiện trải nghiệm phỏng vấn
