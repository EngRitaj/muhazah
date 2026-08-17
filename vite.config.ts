import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
          return;
        }

        if (req.url === '/api/analyze-curriculum' && req.method === 'POST') {
          try {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const { pdfBase64, fileName } = JSON.parse(body || '{}');
                if (!pdfBase64) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'لم يتم توفير ملف PDF للتحليل.' }));
                  return;
                }

                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'مفتاح GEMINI_API_KEY غير متوفر في بيئة العمل.' }));
                  return;
                }

                const cleanedBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
                const ai = new GoogleGenAI({
                  apiKey: apiKey.trim(),
                  httpOptions: {
                    headers: {
                      'User-Agent': 'aistudio-build',
                    },
                  },
                });

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
                        conceptTitle: { type: Type.STRING },
                        academicOverview: { type: Type.STRING },
                        industryRelevance: {
                          type: Type.OBJECT,
                          properties: {
                            isUsedInIndustry: { type: Type.BOOLEAN },
                            statusSummary: { type: Type.STRING },
                            whyItMatters: { type: Type.STRING },
                          },
                          required: ['isUsedInIndustry', 'statusSummary', 'whyItMatters'],
                        },
                        modernAlternativesAndTools: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              category: { type: Type.STRING },
                              description: { type: Type.STRING },
                            },
                            required: ['name', 'category', 'description'],
                          },
                        },
                        practicalProject: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            suggestedStack: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING },
                            },
                            learningOutcomes: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING },
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

                const parsedResult = JSON.parse(response.text || '{}');
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    analysis: parsedResult,
                    fileName: fileName || 'document.pdf',
                  })
                );
              } catch (parseErr: any) {
                console.error('Gemini error in Vite middleware:', parseErr);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: parseErr?.message || 'فشل في تحليل ملف PDF عبر Gemini.' }));
              }
            });
          } catch (err: any) {
            console.error('Middleware error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'خطأ في معالجة الطلب.' }));
          }
          return;
        }

        if (req.url === '/api/analyze-github-repo' && req.method === 'POST') {
          try {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const { owner, repo, description, language, files } = JSON.parse(body || '{}');
                if (!owner || !repo) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'لم يتم توفير معلومات المستودع.' }));
                  return;
                }

                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'مفتاح GEMINI_API_KEY غير متوفر في بيئة العمل.' }));
                  return;
                }

                const ai = new GoogleGenAI({
                  apiKey: apiKey.trim(),
                  httpOptions: {
                    headers: {
                      'User-Agent': 'aistudio-build',
                    },
                  },
                });

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
                        overallAssessment: { type: Type.STRING },
                        detectedTechnologies: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        detectedPractices: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        findings: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              currentUsage: { type: Type.STRING },
                              reasonOutdated: { type: Type.STRING },
                              modernAlternative: { type: Type.STRING },
                              improvementExample: { type: Type.STRING },
                            },
                            required: ['currentUsage', 'reasonOutdated', 'modernAlternative', 'improvementExample'],
                          },
                        },
                      },
                      required: ['overallAssessment', 'detectedTechnologies', 'detectedPractices', 'findings'],
                    },
                  },
                });

                const parsedResult = JSON.parse(response.text || '{}');
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    analysis: parsedResult,
                  })
                );
              } catch (parseErr: any) {
                console.error('Gemini error in Vite middleware for github:', parseErr);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: parseErr?.message || 'فشل في تحليل المستودع عبر Gemini.' }));
              }
            });
          } catch (err: any) {
            console.error('Middleware error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'خطأ في معالجة الطلب.' }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
