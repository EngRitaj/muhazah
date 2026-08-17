import { GitHubRepoData, GitHubFileItem } from '../types';

export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

/**
 * Parses GitHub URL formats:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubRepoUrl(input: string): ParsedRepoUrl | null {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (!trimmed) return null;

  // Format: owner/repo
  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2].replace(/\.git$/, '') };
  }

  // Format with domain
  const fullMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (fullMatch) {
    return { owner: fullMatch[1], repo: fullMatch[2].replace(/\.git$/, '') };
  }

  return null;
}

// Relevant file extensions and config files to prioritize fetching content for
const SOURCE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 
  'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'dart', 
  'sql', 'sh', 'json', 'yaml', 'yml', 'md', 'html', 'css'
]);

const PRIORITY_FILENAMES = new Set([
  'package.json', 'requirements.txt', 'pyproject.toml', 'cargo.toml', 
  'go.mod', 'pom.xml', 'build.gradle', 'dockerfile', 'readme.md'
]);

function isRelevantSourceFile(path: string): boolean {
  const normalized = path.toLowerCase();
  const filename = normalized.split('/').pop() || '';
  
  if (PRIORITY_FILENAMES.has(filename)) return true;
  
  // Ignore binary, build artifacts, lock files, images
  if (
    normalized.includes('node_modules/') ||
    normalized.includes('.git/') ||
    normalized.includes('dist/') ||
    normalized.includes('build/') ||
    normalized.includes('.next/') ||
    normalized.includes('target/') ||
    normalized.endsWith('.lock') ||
    normalized.endsWith('-lock.json') ||
    normalized.endsWith('.png') ||
    normalized.endsWith('.jpg') ||
    normalized.endsWith('.jpeg') ||
    normalized.endsWith('.gif') ||
    normalized.endsWith('.ico') ||
    normalized.endsWith('.svg') ||
    normalized.endsWith('.pdf') ||
    normalized.endsWith('.zip')
  ) {
    return false;
  }

  const ext = filename.split('.').pop() || '';
  return SOURCE_EXTENSIONS.has(ext);
}

/**
 * Fetches repository structure and relevant file contents using GitHub REST API
 */
export async function fetchGitHubRepoData(
  owner: string, 
  repo: string,
  onProgress?: (msg: string) => void
): Promise<GitHubRepoData> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };

  onProgress?.(`جاري جلب معلومات المستودع الأساسية (${owner}/${repo})...`);
  
  // 1. Get repository metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { credentials: 'omit', headers });
  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`المستودع (${owner}/${repo}) غير موجود أو أنه مستودع خاص (Private).`);
    }
    if (repoRes.status === 403) {
      throw new Error('تم الوصول للحد الأقصى لطلبات GitHub API العامة المؤقتة. يرجى الانتظار قليلاً أو المحاولة لاحقاً.');
    }
    throw new Error(`فشل الاتصال بـ GitHub API (رمز الحالة: ${repoRes.status}).`);
  }

  const repoInfo = await repoRes.json();
  const defaultBranch = repoInfo.default_branch || 'main';

  // 2. Fetch full repository git tree recursively
  onProgress?.(`جاري استعراض شجرة الملفات من الفرع ${defaultBranch}...`);
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    { credentials: 'omit', headers }
  );

  let rawTree: any[] = [];
  if (treeRes.ok) {
    const treeData = await treeRes.json();
    rawTree = Array.isArray(treeData.tree) ? treeData.tree : [];
  } else {
    // Fallback to contents API for root directory if git trees endpoint fails
    const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { credentials: 'omit', headers });
    if (!contentsRes.ok) {
      throw new Error('تعذر جلب محتويات وشجرة ملفات المستودع.');
    }
    const contentsData = await contentsRes.json();
    rawTree = Array.isArray(contentsData) ? contentsData.map((item: any) => ({
      path: item.path,
      type: item.type === 'dir' ? 'tree' : 'blob',
      size: item.size,
      url: item.download_url
    })) : [];
  }

  // Filter for blobs (files)
  const fileNodes = rawTree.filter((item: any) => item.type === 'blob');
  
  // Sort and select relevant source files to fetch content for (up to 15 files to maintain speed and avoid rate limits)
  const relevantFiles = fileNodes.filter((f: any) => isRelevantSourceFile(f.path));
  
  // Sort priority files (like README, config files) first, then shortest paths
  relevantFiles.sort((a: any, b: any) => {
    const aName = a.path.toLowerCase().split('/').pop() || '';
    const bName = b.path.toLowerCase().split('/').pop() || '';
    const aIsPriority = PRIORITY_FILENAMES.has(aName);
    const bIsPriority = PRIORITY_FILENAMES.has(bName);
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return a.path.length - b.path.length;
  });

  const filesToFetch = relevantFiles.slice(0, 15);

  onProgress?.(`جاري قراءة محتوى ${filesToFetch.length} من الملفات المصدرية الرئيسية...`);

  // 3. Fetch file contents in parallel (safely bounded)
  const fileResults: GitHubFileItem[] = [];

  // Add all detected files to the structure list
  for (const node of fileNodes) {
    const fileName = node.path.split('/').pop() || node.path;
    fileResults.push({
      path: node.path,
      name: fileName,
      size: node.size,
      type: 'file',
    });
  }

  // Fetch content for the selected source files
  await Promise.all(
    filesToFetch.map(async (fileNode: any) => {
      try {
        // Try raw.githubusercontent first for speed and size, or GitHub contents API
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${fileNode.path}`;
        const contentRes = await fetch(rawUrl, { credentials: 'omit' });
        
        if (contentRes.ok) {
          const text = await contentRes.text();
          // Find matching item in results
          const item = fileResults.find(f => f.path === fileNode.path);
          if (item) {
            // Cap very large files to 20,000 characters for snappy display
            item.content = text.length > 25000 ? text.slice(0, 25000) + '\n\n... [تم اقتطاع باقي المحتوى لتجاوزه الحد]' : text;
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch content for ${fileNode.path}`, e);
      }
    })
  );

  return {
    owner,
    repo,
    defaultBranch,
    description: repoInfo.description || 'لا يوجد وصف للمستودع',
    stars: repoInfo.stargazers_count || 0,
    language: repoInfo.language || 'غير محدد',
    files: fileResults,
  };
}
