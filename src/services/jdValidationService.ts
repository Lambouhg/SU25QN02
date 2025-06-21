export interface JDValidationResult {
  isValidJD: boolean;
  confidence: number;
  reasons: string[];
  detectedSections: string[];
  missingCriticalSections: string[];
}

export class JDValidationService {
  // Các từ khóa bắt buộc phải có trong JD
  private static readonly REQUIRED_KEYWORDS = [
    // Job-related terms
    'job', 'position', 'role', 'career', 'employment', 'work',
    'company', 'organization', 'team', 'department',
    
    // Responsibility terms
    'responsibility', 'responsibilities', 'duties', 'tasks',
    'requirements', 'qualifications', 'skills',
    'experience', 'years of experience', 'minimum',
    
    // Common JD sections
    'description', 'requirements', 'qualifications',
    'benefits', 'salary', 'compensation', 'package'
  ];

  // Các section phổ biến trong JD
  private static readonly COMMON_JD_SECTIONS = [
    'job title', 'job description', 'position', 'role',
    'responsibilities', 'duties', 'requirements', 'qualifications',
    'skills required', 'experience', 'education', 'background',
    'benefits', 'salary', 'compensation', 'package',
    'about company', 'about us', 'company overview',
    'what you will do', 'what we offer', 'preferred qualifications'
  ];

  // Từ khóa kỹ thuật phổ biến
  private static readonly TECH_KEYWORDS = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue',
    'node.js', 'nodejs', 'express', 'mongodb', 'mysql', 'postgresql',
    'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes',
    'api', 'rest', 'graphql', 'microservices',
    'frontend', 'backend', 'fullstack', 'full-stack',
    'html', 'css', 'typescript', 'php', 'c++', 'c#',
    'git', 'github', 'gitlab', 'ci/cd', 'devops'
  ];

  // Từ khóa blacklist (không phải JD)
  private static readonly BLACKLIST_KEYWORDS = [
    // Academic documents
    'abstract', 'conclusion', 'methodology', 'bibliography', 'citations',
    'research paper', 'thesis', 'dissertation', 'journal', 'publication',
    
    // Legal documents
    'whereas', 'hereby', 'aforementioned', 'jurisdiction',
    'contract', 'agreement', 'terms and conditions', 'legal notice',
    
    // Financial documents
    'balance sheet', 'income statement', 'cash flow',
    'assets', 'liabilities', 'equity', 'financial report',
    
    // Personal documents (CV/Resume)
    'curriculum vitae', 'resume', 'cv', 'personal statement',
    'dear sir/madam', 'sincerely yours', 'cover letter',
    'references available', 'portfolio', 'objective statement'
  ];

  // Validate nội dung có phải JD không
  static validateJD(text: string): JDValidationResult {
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);
    const wordCount = words.length;    // Kiểm tra độ dài tối thiểu
    if (wordCount < 50) {
      return {
        isValidJD: false,
        confidence: 0,
        reasons: ['Document too short to be a job description (minimum 50 words)'],
        detectedSections: [],
        missingCriticalSections: this.COMMON_JD_SECTIONS.slice(0, 5)
      };
    }

    let confidence = 0;
    const reasons: string[] = [];
    const detectedSections: string[] = [];
    const missingCriticalSections: string[] = [];    // 1. Kiểm tra từ khóa bắt buộc (35% weight)
    const foundRequiredKeywords = this.REQUIRED_KEYWORDS.filter(keyword => 
      normalizedText.includes(keyword)
    );
    
    const requiredKeywordRatio = foundRequiredKeywords.length / this.REQUIRED_KEYWORDS.length;
    const keywordScore = Math.min(requiredKeywordRatio * 50, 35); // Tăng multiplier
    confidence += keywordScore;

    if (foundRequiredKeywords.length >= 5) {
      reasons.push(`✓ Contains ${foundRequiredKeywords.length} job-related keywords`);
    } else if (foundRequiredKeywords.length >= 3) {
      reasons.push(`⚠ Contains ${foundRequiredKeywords.length} job-related keywords (could be more)`);
    } else {
      reasons.push(`❌ Missing critical job-related keywords (found only ${foundRequiredKeywords.length})`);
    }    // 2. Kiểm tra các section phổ biến trong JD (25% weight)
    const foundSections = this.COMMON_JD_SECTIONS.filter(section => 
      normalizedText.includes(section)
    );
    
    foundSections.forEach(section => detectedSections.push(section));
    
    const sectionRatio = foundSections.length / this.COMMON_JD_SECTIONS.length;
    const sectionScore = Math.min(sectionRatio * 40, 25); // Tăng multiplier
    confidence += sectionScore;

    if (foundSections.length >= 3) {
      reasons.push(`✓ Contains typical JD sections: ${foundSections.slice(0, 3).join(', ')}`);
    } else if (foundSections.length >= 1) {
      reasons.push(`⚠ Contains some JD sections: ${foundSections.join(', ')}`);
    } else {
      reasons.push(`❌ Missing typical JD sections`);
      this.COMMON_JD_SECTIONS.forEach(section => {
        if (!foundSections.includes(section) && missingCriticalSections.length < 5) {
          missingCriticalSections.push(section);
        }
      });
    }    // 3. Kiểm tra từ khóa kỹ thuật (25% weight)
    const foundTechKeywords = this.TECH_KEYWORDS.filter(keyword => 
      normalizedText.includes(keyword)
    );
    
    if (foundTechKeywords.length > 0) {
      const techScore = Math.min(foundTechKeywords.length * 3, 25); // Tăng multiplier
      confidence += techScore;
      reasons.push(`✓ Contains technical keywords: ${foundTechKeywords.slice(0, 3).join(', ')}`);
    } else {
      reasons.push(`⚠ No technical keywords found (may be non-tech role)`);
    }    // 4. Kiểm tra cấu trúc văn bản (15% weight)
    const hasStructure = this.checkDocumentStructure(normalizedText);
    if (hasStructure) {
      confidence += 15;
      reasons.push('✓ Document has proper structure');
    } else {
      reasons.push('⚠ Document lacks clear structure');
    }

    // 5. Kiểm tra blacklist (penalty)
    const blacklistScore = this.checkBlacklist(normalizedText);
    confidence -= blacklistScore;
    
    if (blacklistScore > 0) {
      reasons.push('Contains content not typical of job descriptions');
    }

    // 6. Kiểm tra các patterns đặc trưng của JD
    const jdPatterns = this.checkJDPatterns(normalizedText);
    confidence += jdPatterns;    // Đảm bảo confidence trong khoảng 0-100
    confidence = Math.max(0, Math.min(100, confidence));

    // Giảm ngưỡng xuống 45% và thêm logic đặc biệt
    let isValidJD = confidence >= 45;
    
    // Nếu có ít nhất 3 điều kiện sau thì accept ngay cả khi confidence thấp:
    const hasJobKeywords = foundRequiredKeywords.length >= 3;
    const hasJDSections = foundSections.length >= 2;
    const hasTechKeywords = foundTechKeywords.length >= 1;
    const hasGoodStructure = this.checkDocumentStructure(normalizedText);
    
    const positiveIndicators = [hasJobKeywords, hasJDSections, hasTechKeywords, hasGoodStructure]
      .filter(Boolean).length;
    
    // Nếu có ít nhất 3/4 indicators tích cực thì accept
    if (positiveIndicators >= 3 && confidence >= 35) {
      isValidJD = true;
      reasons.push('Document meets multiple JD criteria despite lower confidence');
    }

    return {
      isValidJD,
      confidence: Math.round(confidence),
      reasons,
      detectedSections,
      missingCriticalSections
    };
  }

  // Kiểm tra cấu trúc document
  private static checkDocumentStructure(text: string): boolean {
    // Kiểm tra có bullet points hoặc numbered lists
    const hasBullets = /[-•*]\s/.test(text) || /\d+\.\s/.test(text);
    
    // Kiểm tra có headers/sections
    const hasHeaders = /\n[A-Z][A-Za-z\s]+:\s*\n/.test(text);
    
    // Kiểm tra có paragraphs
    const paragraphCount = text.split('\n\n').length;
    
    return hasBullets || hasHeaders || paragraphCount >= 3;
  }

  // Kiểm tra blacklist (nội dung không phải JD)
  private static checkBlacklist(text: string): number {
    let blacklistScore = 0;
    
    this.BLACKLIST_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword)) {
        blacklistScore += 15; // Penalty for each blacklist keyword
      }
    });

    // Kiểm tra patterns của CV/Resume
    if (text.includes('dear hiring manager') || 
        text.includes('i am writing to') ||
        text.includes('i believe i would be') ||
        text.includes('thank you for your consideration')) {
      blacklistScore += 30;
    }

    return Math.min(blacklistScore, 60); // Max penalty 60%
  }

  // Kiểm tra patterns đặc trưng của JD
  private static checkJDPatterns(text: string): number {
    let score = 0;

    // Pattern: "We are looking for"
    if (text.includes('we are looking for') || text.includes('we are seeking')) {
      score += 10;
    }

    // Pattern: "X+ years of experience"
    if (/\d+\+?\s+years?\s+of\s+experience/.test(text)) {
      score += 10;
    }

    // Pattern: "Bachelor's degree" hoặc "Master's degree"
    if (/bachelor'?s?\s+degree|master'?s?\s+degree/.test(text)) {
      score += 5;
    }

    // Pattern: "Strong knowledge of" hoặc "Experience with"
    if (text.includes('strong knowledge of') || text.includes('experience with')) {
      score += 5;
    }

    return score;
  }

  // Tạo message chi tiết cho user
  static getValidationMessage(result: JDValidationResult): string {
    if (result.isValidJD) {
      return `✅ Valid Job Description detected (${result.confidence}% confidence)`;
    } else {
      let message = `❌ This doesn't appear to be a Job Description (${result.confidence}% confidence)\n\n`;
      message += `Issues found:\n`;
      result.reasons.forEach(reason => {
        message += `• ${reason}\n`;
      });
      
      if (result.missingCriticalSections.length > 0) {
        message += `\nMissing typical JD sections:\n`;
        result.missingCriticalSections.forEach(section => {
          message += `• ${section}\n`;
        });
      }
      
      message += `\nPlease upload a proper Job Description that includes:\n`;
      message += `• Job title and description\n`;
      message += `• Required skills and qualifications\n`;
      message += `• Job responsibilities\n`;
      message += `• Experience requirements\n`;
      message += `• Company information`;
      
      return message;
    }
  }

  // Lấy suggestions để cải thiện JD
  static getSuggestions(result: JDValidationResult): string[] {
    const suggestions: string[] = [];

    if (!result.isValidJD) {
      suggestions.push('Ensure the document contains a clear job title');
      suggestions.push('Include detailed job responsibilities and duties');
      suggestions.push('Add required skills and qualifications section');
      suggestions.push('Specify minimum experience requirements');
      suggestions.push('Include company information and benefits');
      
      if (result.confidence < 30) {
        suggestions.push('This appears to be a different type of document (CV, contract, etc.)');
      }
    }

    return suggestions;
  }
}
