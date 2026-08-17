export type ActiveRadar = 'curriculum' | 'github';

export interface UploadedFileState {
  file: File | null;
  name: string;
  size: number;
  lastModified?: number;
}

export interface ModernToolOrAlternative {
  name: string;
  category: string;
  description: string;
}

export interface PracticalProjectSuggestion {
  title: string;
  description: string;
  suggestedStack: string[];
  learningOutcomes: string[];
}

export interface IndustryRelevance {
  isUsedInIndustry: boolean;
  statusSummary: string;
  whyItMatters: string;
}

export interface CurriculumAnalysisResult {
  conceptTitle: string;
  academicOverview: string;
  industryRelevance: IndustryRelevance;
  modernAlternativesAndTools: ModernToolOrAlternative[];
  practicalProject: PracticalProjectSuggestion;
}

export interface GitHubFileItem {
  path: string;
  name: string;
  size?: number;
  content?: string;
  type: 'file' | 'dir';
  url?: string;
}

export interface CodePracticeFinding {
  currentUsage: string;
  reasonOutdated: string;
  modernAlternative: string;
  improvementExample: string;
}

export interface GitHubAnalysisResult {
  overallAssessment: string;
  detectedTechnologies: string[];
  detectedPractices: string[];
  findings: CodePracticeFinding[];
}

export interface GitHubRepoData {
  owner: string;
  repo: string;
  defaultBranch?: string;
  description?: string;
  stars?: number;
  language?: string;
  files: GitHubFileItem[];
  analysis?: GitHubAnalysisResult;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export interface GoogleUserInfo {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
