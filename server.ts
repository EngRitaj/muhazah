import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable JSON body parsing with large payload limit for PDF base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialization of Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح GEMINI_API_KEY غير متوفر في بيئة العمل.');
  }
  return new GoogleGenAI({ 
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback models in case of high demand / 503 unavailability
const FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

async function generateWithRetryAndFallback(
  ai: GoogleGenAI,
  requestParams: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>,
  maxRetriesPerModel = 2
) {
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...requestParams,
          model,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || JSON.stringify(err);
        const isTransient =
          errMessage.includes('503') ||
          errMessage.includes('UNAVAILABLE') ||
          errMessage.includes('high demand') ||
          errMessage.includes('429') ||
          errMessage.includes('RESOURCE_EXHAUSTED') ||
          errMessage.includes('timeout');

        if (isTransient && attempt < maxRetriesPerModel) {
          const delay = (attempt + 1) * 800 + Math.random() * 400;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        // Move to the next model
        break;
      }
    }
  }

  throw lastError || new Error('فشلت جميع المحاولات للاتصال بنموذج الذكاء الاصطناعي.');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Curriculum Radar Analysis API endpoint
app.post('/api/analyze-curriculum', async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'لم يتم توفير ملف PDF للتحليل.' });
    }

    // Clean base64 string if data URL header was included
    const cleanedBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');

    const ai = getGeminiClient();

    const prompt = `
أنت خبير أكاديمي وتقني متخصص في مواءمة مناهج علوم الحاسب والبرمجة مع متطلبات سوق العمل التقني الحديث.
قم بتحليل محتوى هذا العرض التقديمي الأكاديمي (PDF) بدقة باللغة العربية، واستخرج المعلومات التالية بدقة وموضوعية:

1. المفهوم أو التقنية الأساسية المشروحة (Main concept / technology).
2. ملخص موجز للمحتوى الأكاديمي الموجود في السلايدات (Overview summary).
3. هل هذا المفهوم/التقنية مستخدم وشائع في سوق العمل والشركات اليوم؟ (Explain industry relevance & status).
4. التقنيات، المكتبات، والأدوات الحديثة المرتبطة بهذا المفهوم والمعتمدة في بيئات العمل الحالية (Modern industry technologies & libraries).
5. فكرة مشروع عملي تطبيقي حديث يربط هذا المفهوم الأكاديمي بأفضل ممارسات الشركات وسوق العمل المعاصر (Practical project idea with clear tech stack and steps).

أجب باللغة العربية بأسلوب احترافي، واضح، وموجه لطلاب علوم الحاسب والتقنية.
`;

    const response = await generateWithRetryAndFallback(ai, {
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanedBase64,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptTitle: {
              type: Type.STRING,
              description: 'المفهوم الأساسي أو التقنية المشروحة في العرض',
            },
            academicOverview: {
              type: Type.STRING,
              description: 'ملخص موجز للمحتوى الأكاديمي المشروح في السلايدات',
            },
            industryRelevance: {
              type: Type.OBJECT,
              properties: {
                isUsedInIndustry: {
                  type: Type.BOOLEAN,
                  description: 'هل المفهوم مستخدم وشائع في سوق العمل حالياً',
                },
                statusSummary: {
                  type: Type.STRING,
                  description: 'حالة استخدام هذا المفهوم في سوق العمل اليوم وشرح واقعي',
                },
                whyItMatters: {
                  type: Type.STRING,
                  description: 'أهمية هذا المفهوم وكيف تطور من النظرية إلى التطبيق في الشركات',
                },
              },
              required: ['isUsedInIndustry', 'statusSummary', 'whyItMatters'],
            },
            modernAlternativesAndTools: {
              type: Type.ARRAY,
              description: 'قائمة بالتقنيات، الأطر، المكتبات، والأدوات الحديثة المعتمدة في سوق العمل المرتبطة بهذا المفهوم',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'اسم الأداة أو المكتبة أو التقنية' },
                  category: { type: Type.STRING, description: 'تصنيفها (مثلاً: إطار عمل، مكتبة، أداة سحابية، قاعدة بيانات)' },
                  description: { type: Type.STRING, description: 'كيف تُستخدم في سوق العمل وعلاقتها بالمفهوم الأكاديمي' },
                },
                required: ['name', 'category', 'description'],
              },
            },
            practicalProject: {
              type: Type.OBJECT,
              description: 'فكرة مشروع عملي تطبيقي حديث يربط المفهوم الأكاديمي بممارسات الصناعة',
              properties: {
                title: { type: Type.STRING, description: 'عنوان المشروع المقترح' },
                description: { type: Type.STRING, description: 'وصف المشروع والهدف منه' },
                suggestedStack: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'المكدس التقني المقترح لبناء المشروع (لغات، مكتبات، أدوات)',
                },
                learningOutcomes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'المخرجات التعليمية والمهنية التي سيكتسبها الطالب',
                },
              },
              required: ['title', 'description', 'suggestedStack', 'learningOutcomes'],
            },
          },
          required: [
            'conceptTitle',
            'academicOverview',
            'industryRelevance',
            'modernAlternativesAndTools',
            'practicalProject',
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('لم يتم استلام رد صالح من نموذج التحليل الذكي.');
    }

    const parsedResult = JSON.parse(rawText);
    return res.json({
      success: true,
      analysis: parsedResult,
      fileName: fileName || 'document.pdf',
    });
  } catch (error: any) {
    console.error('Error analyzing curriculum PDF in server:', error);
    const errorMessage = error?.message || 'حدث خطأ غير متوقع أثناء معالجة ملف PDF وتحليله.';
    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// GitHub Radar Gemini Analysis API endpoint
app.post('/api/analyze-github-repo', async (req, res) => {
  try {
    const { owner, repo, description, language, files } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({ error: 'لم يتم توفير معلومات المستودع.' });
    }

    const ai = getGeminiClient();

    // Prepare code and structure summary
    const fileListStr = Array.isArray(files) 
      ? files.map((f: any) => `- ${f.path} (${f.size || 0} bytes)`).slice(0, 50).join('\n')
      : 'لا يوجد قائمة ملفات';

    const fileContentsStr = Array.isArray(files)
      ? files
          .filter((f: any) => f.content)
          .slice(0, 10)
          .map((f: any) => `### File: ${f.path}\n\`\`\`\n${f.content.slice(0, 5000)}\n\`\`\``)
          .join('\n\n')
      : '';

    const prompt = `
أنت خبير هندسة برمجيات ومراجع جودة أكواد متقدم (Senior Software Architect & Code Auditor).
لديك هنا معلومات ومحتويات ملفات مصدرية من مستودع GitHub:
اسم المستودع: ${owner}/${repo}
الوصف: ${description || 'غير متوفر'}
اللغة الأساسية: ${language || 'غير محدد'}

شجرة الملفات في المستودع:
${fileListStr}

عينة من الملفات المصدرية المتاحة:
${fileContentsStr || 'تم توفير هيكل الملفات فقط'}

المطلوب:
قم بتحليل المستودع والأكواد المصدرية المقدمة بدقة باللغة العربية:
1. استخرج التقنيات، المكتبات، الأطر، وأدوات البناء المستخدمة (detectedTechnologies).
2. استخرج الأنماط والممارسات البرمجية المكتشفة في الكود (detectedPractices).
3. حدد الممارسات البرمجية، المكتبات، أو الأنماط القديمة أو غير الموصى بها حالياً في سوق العمل (Outdated / Less-recommended practices) مع تقديم حلول وتحديثات لها.
لكل ممارسة أو جزئية تحتاج تحسين، قدم:
   - ما يُستخدم حالياً (currentUsage)
   - لماذا تعد هذه الممارسة قديمة أو غير موصى بها (reasonOutdated)
   - البديل الحديث المعتمد في الصناعة وسوق العمل (modernAlternative)
   - مثال برمجي قصير يوضح كيفية تحسين الكود وتطبيق البديل الحديث (improvementExample)
4. قدم تقييماً عاماً شاملاً وموضوعياً للمشروع ومدى جودته وحداثته البرمجية (overallAssessment).

أجب باللغة العربية بأسلوب هندسي دقيق، احترافي، ومباشر.
`;

    const response = await generateWithRetryAndFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: {
              type: Type.STRING,
              description: 'تقييم عام شامل للمستودع ومدى حداثة الأكواد والممارسات',
            },
            detectedTechnologies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'التقنيات والمكتبات والأطر المكتشفة في المستودع',
            },
            detectedPractices: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'الممارسات والأنماط البرمجية المكتشفة',
            },
            findings: {
              type: Type.ARRAY,
              description: 'الممارسات البرمجية القديمة أو غير الموصى بها وبدائلها الحديثة',
              items: {
                type: Type.OBJECT,
                properties: {
                  currentUsage: {
                    type: Type.STRING,
                    description: 'ما يُستخدم حالياً في الكود',
                  },
                  reasonOutdated: {
                    type: Type.STRING,
                    description: 'لماذا تعد هذه الممارسة قديمة أو أقل ملاءمة',
                  },
                  modernAlternative: {
                    type: Type.STRING,
                    description: 'البديل الحديث المعتمد في سوق العمل',
                  },
                  improvementExample: {
                    type: Type.STRING,
                    description: 'مثال كود قصير يوضح التحديث والتحسين',
                  },
                },
                required: ['currentUsage', 'reasonOutdated', 'modernAlternative', 'improvementExample'],
              },
            },
          },
          required: ['overallAssessment', 'detectedTechnologies', 'detectedPractices', 'findings'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('لم يتم استلام رد صالح من نموذج Gemini لتحليل المستودع.');
    }

    const parsedResult = JSON.parse(rawText);
    return res.json({
      success: true,
      analysis: parsedResult,
    });
  } catch (error: any) {
    console.error('Error analyzing GitHub repository in server:', error);
    const errorMessage = error?.message || 'حدث خطأ أثناء تحليل المستودع بواسطة Gemini.';
    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
