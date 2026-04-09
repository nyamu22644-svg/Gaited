import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  UploadCloud,
  Sparkles,
  Timer,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  PlayCircle,
  Target,
  BarChart3,
  BookOpenCheck,
  RefreshCw,
  FileText,
  Video
} from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker?url';
import mammoth from 'mammoth/mammoth.browser';
import Tesseract from 'tesseract.js';
import { Profile } from '../types';

interface StudyPageProps {
  user: Profile;
}

type StudyQuestionType = 'short' | 'mcq' | 'fill' | 'compare' | 'definition';

interface StudyQuestion {
  id: string;
  type: StudyQuestionType;
  prompt: string;
  answer: string;
  options?: string[];
}

interface StudyTopic {
  id: string;
  title: string;
  summarySimple: string;
  summaryMedium: string;
  examWording: string;
  memoryHook: string;
  examFocus: string[];
  questions: StudyQuestion[];
  videos: { title: string; query: string }[];
}

interface StudyPack {
  id: string;
  title: string;
  createdAt: string;
  sourceText: string;
  topics: StudyTopic[];
  glossary: { term: string; definition: string }[];
}

interface ReviewState {
  intervalHours: number;
  nextDue: number;
  lastReviewed?: number;
  strength: number;
  wrongCount: number;
  correctCount: number;
}

interface StudyCard {
  id: string;
  topicId: string;
  topicTitle: string;
  type: StudyQuestionType;
  prompt: string;
  answer: string;
  options?: string[];
}

type Grade = 'know' | 'unsure' | 'fail';

const STORAGE_KEY = 'gaited.study.engine.v1';
const MAX_SOURCE_CHARS = 12000;
const EXAM_SECONDS = 75;
const OCR_CHAR_THRESHOLD = 200;
const OCR_PAGE_LIMIT = 5;

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 10)}`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getDefaultReviewState = (): ReviewState => ({
  intervalHours: 6,
  nextDue: Date.now(),
  strength: 25,
  wrongCount: 0,
  correctCount: 0
});

const extractJson = (raw: string) => {
  const stripComments = (value: string) => value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  const normalizeCandidate = (candidate: string) => {
    const cleaned = candidate
      .replace(/^\ufeff/, '')
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\bNaN\b/g, 'null')
      .replace(/\bInfinity\b/g, 'null')
      .replace(/,\s*([}\]])/g, '$1')
      .trim();
    const withoutComments = stripComments(cleaned);
    const quotedKeys = withoutComments.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    return quotedKeys.trim();
  };

  const tryParse = (candidate: string) => {
    const normalized = normalizeCandidate(candidate);
    return JSON.parse(normalized);
  };

  const trimmed = raw.trim();
  try {
    return tryParse(trimmed);
  } catch {
    // Keep trying fallbacks
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return tryParse(fenced[1]);
    } catch {
      // Keep trying fallbacks
    }
  }

  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    try {
      return tryParse(trimmed.slice(objStart, objEnd + 1));
    } catch {
      // Keep trying fallbacks
    }
  }

  const arrStart = trimmed.indexOf('[');
  const arrEnd = trimmed.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    try {
      return tryParse(trimmed.slice(arrStart, arrEnd + 1));
    } catch {
      // Fall through to error
    }
  }

  throw new Error('Model response is not valid JSON.');
};

const readErrorDetail = async (response: Response) => {
  try {
    const data = await response.json();
    return data?.error?.message || JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 2
) => {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      const retryable = [429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === retries) {
        return response;
      }
    } catch (err) {
      lastError = err as Error;
      if (attempt === retries) break;
    }

    const backoffMs = 800 * Math.pow(2, attempt);
    await wait(backoffMs);
    attempt += 1;
  }

  throw lastError || new Error('Network request failed.');
};

const normalizePack = (raw: any, sourceText: string, fallbackTitle: string): StudyPack => {
  const topicsRaw = Array.isArray(raw?.topics)
    ? raw.topics
    : Array.isArray(raw)
      ? raw
      : [];
  const glossaryRaw = Array.isArray(raw?.glossary) ? raw.glossary : [];

  const topics: StudyTopic[] = topicsRaw.map((topic: any, idx: number) => {
    const questionsRaw = Array.isArray(topic?.questions) ? topic.questions : [];
    const videosRaw = Array.isArray(topic?.videos) ? topic.videos : [];

    const questions: StudyQuestion[] = questionsRaw.map((q: any) => ({
      id: createId(),
      type: (q?.type || 'short') as StudyQuestionType,
      prompt: String(q?.prompt || '').trim() || `Explain topic ${idx + 1}`,
      answer: String(q?.answer || '').trim(),
      options: Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : undefined
    }));

    return {
      id: createId(),
      title: String(topic?.title || `Topic ${idx + 1}`).trim(),
      summarySimple: String(topic?.summary_simple || topic?.summarySimple || topic?.summary || '').trim(),
      summaryMedium: String(topic?.summary_medium || topic?.summaryMedium || '').trim(),
      examWording: String(topic?.exam_wording || topic?.examWording || '').trim(),
      memoryHook: String(topic?.memory_hook || topic?.memoryHook || '').trim(),
      examFocus: Array.isArray(topic?.exam_focus || topic?.examFocus) ? (topic?.exam_focus || topic?.examFocus).map((f: any) => String(f)) : [],
      questions,
      videos: videosRaw.map((v: any) => ({
        title: String(v?.title || 'Targeted refresher'),
        query: String(v?.search_query || v?.query || '')
      }))
    };
  });

  return {
    id: createId(),
    title: String(raw?.title || fallbackTitle || 'Revision Pack'),
    createdAt: new Date().toISOString(),
    sourceText,
    topics,
    glossary: glossaryRaw.map((g: any) => ({
      term: String(g?.term || ''),
      definition: String(g?.definition || '')
    }))
  };
};

const buildFallbackPack = (sourceText: string, fallbackTitle: string): StudyPack => {
  const lines = sourceText.split('\n').map(line => line.trim()).filter(Boolean);
  const glossary = lines
    .map(line => {
      const split = line.includes(':') ? line.split(':') : line.split(' - ');
      if (split.length < 2) return null;
      const term = split[0].trim();
      const definition = split.slice(1).join(' - ').trim();
      if (!term || !definition) return null;
      return { term, definition };
    })
    .filter(Boolean) as { term: string; definition: string }[];

  const paragraphs = sourceText.split(/\n\s*\n/).filter(Boolean);
  const topics = paragraphs.slice(0, 4).map((para, idx) => {
    const firstSentence = para.split(/[.!?]/)[0]?.trim();
    const title = firstSentence && firstSentence.length < 60 ? firstSentence : `Topic ${idx + 1}`;
    const summary = para.slice(0, 420).trim();
    const questions: StudyQuestion[] = [
      {
        id: createId(),
        type: 'short',
        prompt: `Explain ${title}`,
        answer: summary
      }
    ];

    glossary.slice(idx * 2, idx * 2 + 2).forEach((entry) => {
      questions.push({
        id: createId(),
        type: 'definition',
        prompt: `Define ${entry.term}`,
        answer: entry.definition
      });
    });

    return {
      id: createId(),
      title,
      summarySimple: summary,
      summaryMedium: summary,
      examWording: summary,
      memoryHook: '',
      examFocus: [],
      questions,
      videos: []
    };
  });

  return {
    id: createId(),
    title: fallbackTitle || 'Revision Pack',
    createdAt: new Date().toISOString(),
    sourceText,
    topics,
    glossary
  };
};

const normalizeSourceText = (text: string) => {
  const cleaned = text.replace(/\r/g, '').trim();
  return cleaned.length > MAX_SOURCE_CHARS ? cleaned.slice(0, MAX_SOURCE_CHARS) : cleaned;
};

const extractPdfTextFromDocument = async (pdf: any) => {
  let output = '';

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string }>;
    const pageText = items.map(item => item.str || '').join(' ');
    output += `${pageText}\n\n`;
  }

  return output.trim();
};

const renderPdfPageToDataUrl = async (pdf: any, pageIndex: number) => {
  const page = await pdf.getPage(pageIndex);
  const viewport = page.getViewport({ scale: 1.6 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
};

const runOcrOnImage = async (imageUrl: string, onProgress?: (progress: number) => void) => {
  const result = await Tesseract.recognize(imageUrl, 'eng', {
    logger: (message) => {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') {
        onProgress?.(Math.round(message.progress * 100));
      }
    }
  });
  return (result?.data?.text || '').trim();
};

const extractPdfText = async (
  file: File,
  onStatus?: (message: string) => void,
  onProgress?: (progress: number) => void
) => {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  let text = await extractPdfTextFromDocument(pdf);

  if (text.trim().length < OCR_CHAR_THRESHOLD) {
    const pageCount = Math.min(pdf.numPages, OCR_PAGE_LIMIT);
    onStatus?.('PDF looks scanned. Running OCR...');
    let ocrText = '';

    for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
      onStatus?.(`OCR page ${pageIndex}/${pageCount}...`);
      const dataUrl = await renderPdfPageToDataUrl(pdf, pageIndex);
      if (!dataUrl) continue;
      const pageText = await runOcrOnImage(dataUrl, onProgress);
      if (pageText) {
        ocrText += `${pageText}\n\n`;
      }
    }

    text = `${text}\n${ocrText}`.trim();
  }

  return text;
};

const extractDocxText = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return (result.value || '').trim();
};

const StudyPage: React.FC<StudyPageProps> = ({ user }) => {
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [reviewState, setReviewState] = useState<Record<string, ReviewState>>({});
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [attempt, setAttempt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [examMode, setExamMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [lastFailedCardId, setLastFailedCardId] = useState<string | null>(null);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiRules, setAiRules] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [modelName, setModelName] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const hasGeminiKey = Boolean((process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.pack) {
        setStudyPack(parsed.pack);
        setSelectedTopicId(parsed.pack.topics?.[0]?.id || null);
      }
      if (parsed?.reviewState) setReviewState(parsed.reviewState);
      if (parsed?.meta?.title) setTitle(parsed.meta.title);
      if (parsed?.meta?.examDate) setExamDate(parsed.meta.examDate);
      if (parsed?.meta?.sourceText) setSourceText(parsed.meta.sourceText);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    if (!examDate) {
      setExamDate('2026-04-13');
    }
  }, [hasLoadedStorage, examDate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedModel = localStorage.getItem('gaited.study.model');
    if (savedModel) {
      setModelName(savedModel);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (modelName) {
      localStorage.setItem('gaited.study.model', modelName);
    }
  }, [modelName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      pack: studyPack,
      reviewState,
      meta: { title, examDate, sourceText }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [studyPack, reviewState, title, examDate, sourceText]);

  const allCards = useMemo<StudyCard[]>(() => {
    if (!studyPack) return [];
    return studyPack.topics.flatMap(topic =>
      topic.questions.map(q => ({
        id: q.id,
        topicId: topic.id,
        topicTitle: topic.title,
        type: q.type,
        prompt: q.prompt,
        answer: q.answer,
        options: q.options
      }))
    );
  }, [studyPack]);

  const dueCards = useMemo(() => {
    const now = Date.now();
    return allCards
      .filter(card => {
        const state = reviewState[card.id] || getDefaultReviewState();
        return state.nextDue <= now;
      })
      .sort((a, b) => {
        const stateA = reviewState[a.id] || getDefaultReviewState();
        const stateB = reviewState[b.id] || getDefaultReviewState();
        if (stateA.nextDue !== stateB.nextDue) return stateA.nextDue - stateB.nextDue;
        return stateA.strength - stateB.strength;
      });
  }, [allCards, reviewState]);

  const weakCards = useMemo(() => {
    return allCards.filter(card => {
      const state = reviewState[card.id] || getDefaultReviewState();
      return state.strength < 50 || state.wrongCount > 0;
    });
  }, [allCards, reviewState]);

  const activeCard = useMemo(() => {
    if (!allCards.length) return null;
    const candidate = currentCardId ? allCards.find(card => card.id === currentCardId) : null;
    return candidate || dueCards[0] || allCards[0];
  }, [allCards, currentCardId, dueCards]);

  const selectedTopic = useMemo(() => {
    if (!studyPack) return null;
    return studyPack.topics.find(topic => topic.id === selectedTopicId) || studyPack.topics[0] || null;
  }, [studyPack, selectedTopicId]);

  const guidedSteps = useMemo(() => {
    if (!selectedTopic) return [] as Array<{ title: string; body: string }>;
    const steps: Array<{ title: string; body: string }> = [];

    if (selectedTopic.summarySimple) {
      steps.push({ title: 'Step 1: Explain it simply', body: selectedTopic.summarySimple });
    }
    if (selectedTopic.summaryMedium) {
      steps.push({ title: 'Step 2: Medium depth', body: selectedTopic.summaryMedium });
    }
    if (selectedTopic.examWording) {
      steps.push({ title: 'Step 3: Exam wording', body: selectedTopic.examWording });
    }
    if (selectedTopic.memoryHook) {
      steps.push({ title: 'Step 4: Memory hook', body: selectedTopic.memoryHook });
    }
    if (selectedTopic.examFocus.length > 0) {
      steps.push({
        title: 'Step 5: Likely exam focus',
        body: selectedTopic.examFocus.map(item => `- ${item}`).join('\n')
      });
    }

    if (steps.length === 0) {
      steps.push({
        title: 'Step 1: Add notes',
        body: 'Generate a study pack to see guided steps.'
      });
    }

    return steps;
  }, [selectedTopic]);

  useEffect(() => {
    setGuidedStepIndex(0);
  }, [selectedTopicId]);

  const masteryByTopic = useMemo(() => {
    if (!studyPack) return [];
    return studyPack.topics.map(topic => {
      const cards = topic.questions.map(q => q.id);
      const scores = cards.map(cardId => (reviewState[cardId] || getDefaultReviewState()).strength);
      const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { id: topic.id, title: topic.title, mastery: Math.round(average) };
    });
  }, [studyPack, reviewState]);

  useEffect(() => {
    if (!examMode || !activeCard || showAnswer) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(EXAM_SECONDS);
  }, [examMode, activeCard?.id, showAnswer]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      setShowAnswer(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev === null ? prev : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;
    setError('');
    setInfo('');
    setIsParsing(true);
    setIngestStatus(`Parsing ${file.name}...`);

    try {
      const name = file.name.toLowerCase();
      let text = '';

      if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
        text = await extractPdfText(
          file,
          (message) => setIngestStatus(message),
          (progress) => setIngestStatus(`OCR ${progress}%`)
        );
        if (text.length < OCR_CHAR_THRESHOLD) {
          setInfo('OCR found very little text. Try a clearer scan if possible.');
        }
      } else if (
        name.endsWith('.docx') ||
        file.type.includes('officedocument.wordprocessingml')
      ) {
        text = await extractDocxText(file);
      } else if (
        file.type.startsWith('text/') ||
        name.endsWith('.txt') ||
        name.endsWith('.md')
      ) {
        text = await file.text();
      } else if (
        file.type.startsWith('image/') ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp')
      ) {
        setIngestStatus('Running OCR on image...');
        const url = URL.createObjectURL(file);
        text = await runOcrOnImage(url, (progress) => setIngestStatus(`OCR ${progress}%`));
        URL.revokeObjectURL(url);
        if (!text) {
          setInfo('No text detected in that image.');
        }
      } else {
        throw new Error('Unsupported file type. Use PDF, DOCX, TXT, or MD.');
      }

      const normalized = normalizeSourceText(text);
      setSourceText(normalized);

      if (!text.trim()) {
        setInfo('No text detected in that file. Try exporting to text first.');
      } else if (text.length > MAX_SOURCE_CHARS) {
        setInfo('Large file detected. Trimmed to 12k characters.');
      }

      if (file.name.toLowerCase().endsWith('.pdf') && text.length < OCR_CHAR_THRESHOLD) {
        setIngestStatus('OCR finished.');
      } else {
        setIngestStatus(`Loaded ${file.name}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
      setIngestStatus('');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboard = e.clipboardData;
    const directFiles = Array.from(clipboard.files || []);
    const itemFiles = Array.from(clipboard.items || [])
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    const files = directFiles.length ? directFiles : itemFiles;
    if (files.length > 0) {
      e.preventDefault();
      if (files.length > 1) {
        setInfo('Multiple files detected. Using the first one.');
      }
      handleFileUpload(files[0]);
    }
  };

  const generateStudyPack = async () => {
    if (!sourceText.trim()) {
      setError('Paste your notes or upload a text file to begin.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setInfo('');

    const trimmedText = sourceText.slice(0, MAX_SOURCE_CHARS);

    try {
      let pack: StudyPack;
      const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();

      if (apiKey) {
        const modelPath = resolveModelPath(modelName);
        if (!modelPath) {
          throw new Error('Select a Gemini model to continue.');
        }
        const prompt = `You are a top-tier study coach. Convert the student's notes into a strict JSON study pack, but improve clarity with correct academic knowledge even if not explicitly in the notes. Use the notes as the primary anchor.\n\nReturn ONLY JSON with this schema:\n{\n  "title": string,\n  "topics": [\n    {\n      "title": string,\n      "summary_simple": string,\n      "summary_medium": string,\n      "exam_wording": string,\n      "memory_hook": string,\n      "exam_focus": string[],\n      "questions": [\n        {"type":"short|mcq|fill|compare|definition","prompt":string,"answer":string,"options"?:string[]}\n      ],\n      "videos": [{"title": string, "search_query": string}]\n    }\n  ],\n  "glossary": [{"term": string, "definition": string}]\n}\n\nRules:\n- Use the notes as primary source; you may add missing clarifications if they are standard textbook facts.\n- Do NOT invent niche facts; if unsure, keep it concise or note the gap.\n- 2 to 6 topics. 3 to 6 questions per topic.\n- Keep answers short but exam-ready.\n- No markdown or code fences.\n\nTitle: ${title || 'Revision Pack'}\nExam date: ${examDate || 'Not provided'}\n\nNOTES:\n${trimmedText}`;

        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1400 }
          })
        });

        if (!response.ok) {
          const detail = await readErrorDetail(response);
          const extra = detail ? ` ${detail}` : '';
          const hint = response.status === 503
            ? ' Gemini is temporarily unavailable. Please retry in a minute.'
            : '';
          throw new Error(`Gemini request failed (${response.status}).${extra}${hint}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
        const parsed = extractJson(rawText);
        pack = normalizePack(parsed, trimmedText, title);
      } else {
        pack = buildFallbackPack(trimmedText, title);
        setInfo('Gemini key not detected. Using local extraction.');
      }

      setStudyPack(pack);
      setSelectedTopicId(pack.topics[0]?.id || null);

      const initialState: Record<string, ReviewState> = {};
      pack.topics.forEach(topic => {
        topic.questions.forEach(q => {
          initialState[q.id] = getDefaultReviewState();
        });
      });
      setReviewState(initialState);
      setCurrentCardId(null);
      setShowAnswer(false);
      setAttempt('');
      setFlashMessage('Study pack ready. Start with the first weak card.');
      setTimeout(() => setFlashMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate study pack.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) {
      setError('Type a question for the AI coach.');
      return;
    }
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey) {
      setError('Add GEMINI_API_KEY to use the AI coach.');
      return;
    }

    const modelPath = resolveModelPath(modelName);
    if (!modelPath) {
      setError('Select a Gemini model to continue.');
      return;
    }

    setIsAskingAi(true);
    setError('');
    setAiAnswer('');

    const rulesText = aiRules.trim() ? `\nExtra rules from user: ${aiRules.trim()}` : '';
    const contextText = sourceText.trim() ? `\n\nNOTES:\n${sourceText.slice(0, MAX_SOURCE_CHARS)}` : '';

    try {
      const prompt = `You are the smartest exam coach. Answer in the most exam-ready way, using short steps, clear terms, and a final model answer. You may use standard knowledge beyond the notes, but keep it accurate and aligned with the notes when present.${rulesText}\n\nQuestion: ${aiQuestion}${contextText}`;

      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1000 }
        })
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        const extra = detail ? ` ${detail}` : '';
        const hint = response.status === 503
          ? ' Gemini is temporarily unavailable. Please retry in a minute.'
          : '';
        throw new Error(`AI request failed (${response.status}).${extra}${hint}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      setAiAnswer(rawText.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI answer.');
    } finally {
      setIsAskingAi(false);
    }
  };

  const clearStudyPack = () => {
    setStudyPack(null);
    setReviewState({});
    setCurrentCardId(null);
    setShowAnswer(false);
    setAttempt('');
    setSelectedTopicId(null);
    setLastFailedCardId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const gradeCard = (grade: Grade) => {
    if (!activeCard) return;
    const prev = reviewState[activeCard.id] || getDefaultReviewState();
    const now = Date.now();

    let interval = prev.intervalHours;
    let strength = prev.strength;
    let wrongCount = prev.wrongCount;
    let correctCount = prev.correctCount;

    if (grade === 'know') {
      interval = Math.min(interval * 2.2, 336);
      strength = clamp(strength + 18, 0, 100);
      correctCount += 1;
    } else if (grade === 'unsure') {
      interval = Math.max(interval * 1.1, 8);
      strength = clamp(strength + 6, 0, 100);
    } else {
      interval = 4;
      strength = clamp(strength - 20, 0, 100);
      wrongCount += 1;
      setLastFailedCardId(activeCard.id);
    }

    const nextDue = now + interval * 60 * 60 * 1000;

    const wasWeak = prev.strength < 60;
    const isStrong = strength >= 60;

    setReviewState(prevState => ({
      ...prevState,
      [activeCard.id]: {
        intervalHours: interval,
        nextDue,
        lastReviewed: now,
        strength,
        wrongCount,
        correctCount
      }
    }));

    if (grade === 'know' && wasWeak && isStrong) {
      setFlashMessage('Weak question cleared.');
      setTimeout(() => setFlashMessage(null), 2400);
    }

    setShowAnswer(false);
    setAttempt('');
    setCurrentCardId(null);
  };

  const skipCard = () => {
    if (!activeCard) return;
    const prev = reviewState[activeCard.id] || getDefaultReviewState();
    const nextDue = Date.now() + 45 * 60 * 1000;
    setReviewState(state => ({
      ...state,
      [activeCard.id]: { ...prev, nextDue }
    }));
    setShowAnswer(false);
    setAttempt('');
    setCurrentCardId(null);
  };

  const retryFailedCard = (mode: 'simple' | 'exam') => {
    if (!lastFailedCardId) return;
    setCurrentCardId(lastFailedCardId);
    setShowAnswer(false);
    setAttempt('');
    if (mode === 'exam') {
      setExamMode(true);
    }
  };

  const formatCountdown = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const masteryOverall = masteryByTopic.length
    ? Math.round(masteryByTopic.reduce((a, b) => a + b.mastery, 0) / masteryByTopic.length)
    : 0;

  const resolveModelPath = (value: string) => {
    if (!value) return '';
    return value.startsWith('models/') ? value : `models/${value}`;
  };

  const fetchModels = async () => {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey) {
      setError('Add GEMINI_API_KEY to load available models.');
      return;
    }
    setIsLoadingModels(true);
    setError('');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!response.ok) {
        const detail = await readErrorDetail(response);
        const extra = detail ? ` ${detail}` : '';
        throw new Error(`List models failed (${response.status}).${extra}`);
      }
      const data = await response.json();
      const models = (data?.models || []) as Array<{ name?: string; supportedGenerationMethods?: string[] }>;
      const filtered = models
        .filter(model => (model.supportedGenerationMethods || []).includes('generateContent'))
        .map(model => model.name || '')
        .filter(Boolean);
      setAvailableModels(filtered);
      if (!modelName && filtered.length > 0) {
        setModelName(filtered[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleQuickContinue = () => {
    if (!activeCard) return;
    setCurrentCardId(activeCard.id);
    setShowAnswer(false);
    setAttempt('');
    document.getElementById('active-recall')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickPaste = () => {
    notesRef.current?.focus();
    document.getElementById('ingestion-engine')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickAskAi = () => {
    document.getElementById('ai-coach')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #15803d 55%, #22c55e 100%)'
        }}></div>
        <div className="max-w-6xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="study-rise">
              <p className="text-xs uppercase tracking-[0.2em] text-green-200">Study Engine</p>
              <h1 className="text-3xl md:text-4xl font-bold mt-2 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {title || 'Lock in your weak topics'}
              </h1>
              <p className="text-green-50/90 mt-2 max-w-xl">
                Hi {user.username}, your notes become guided lessons, active recall, and timed exam drills. No passive rereading.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 study-rise study-delay-1">
              <div className="bg-white/95 border border-white/40 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 text-green-600 text-xs uppercase tracking-wide">
                  <Target size={14} /> Due now
                </div>
                <p className="text-2xl font-semibold mt-2 text-slate-900">{dueCards.length}</p>
              </div>
              <div className="bg-white/95 border border-white/40 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 text-amber-600 text-xs uppercase tracking-wide">
                  <Flame size={14} /> Weak items
                </div>
                <p className="text-2xl font-semibold mt-2 text-slate-900">{weakCards.length}</p>
              </div>
              <div className="bg-white/95 border border-white/40 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-600 text-xs uppercase tracking-wide">
                  <BarChart3 size={14} /> Mastery
                </div>
                <p className="text-2xl font-semibold mt-2 text-slate-900">{masteryOverall}%</p>
              </div>
              <div className="bg-white/95 border border-white/40 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-600 text-xs uppercase tracking-wide">
                  <Timer size={14} /> Exam mode
                </div>
                <p className="text-2xl font-semibold mt-2 text-slate-900">{examMode ? 'On' : 'Off'}</p>
              </div>
            </div>
          </div>

          {flashMessage && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm study-rise study-delay-2">
              {flashMessage}
            </div>
          )}

          <div className="mt-6 lg:hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm study-rise study-delay-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Quick start</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={handleQuickContinue}
                disabled={!activeCard}
                className="px-3 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                Continue weak
              </button>
              <button
                onClick={handleQuickPaste}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
              >
                Paste notes
              </button>
            </div>
            <button
              onClick={handleQuickAskAi}
              className="mt-3 w-full px-3 py-2 rounded-lg border border-green-200 text-green-700 text-sm"
            >
              Ask AI coach
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div id="ingestion-engine" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Brain size={20} className="text-green-600" /> Ingestion engine
                </h2>
                <p className="text-sm text-slate-600 mt-1">Upload notes, paste CAT questions, or drop revision scripts.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={examMode} onChange={(e) => setExamMode(e.target.checked)} />
                  Timed exam mode
                </label>
                <button
                  onClick={clearStudyPack}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  <RefreshCw size={14} /> Reset
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Course or unit</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="HCI 201 - Usability"
                  className="mt-2 w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Exam date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="mt-2 w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs uppercase tracking-wide text-slate-500">Paste notes</label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                onPaste={handlePaste}
                rows={6}
                className="mt-2 w-full rounded-xl bg-white border border-slate-300 px-3 py-3 text-base sm:text-sm text-slate-900 focus:border-green-500"
                placeholder="Paste definitions, lecturer cues, revision questions, or CATs."
                ref={notesRef}
              />
              <div className="flex flex-wrap justify-between items-center gap-3 mt-3">
                <label className="flex items-center gap-2 text-sm sm:text-xs text-green-700 cursor-pointer bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                  <UploadCloud size={14} />
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                  Upload or paste PDF, DOCX, TXT, MD, or images
                </label>
                <span className="text-xs text-slate-500">{sourceText.length}/{MAX_SOURCE_CHARS} chars</span>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            {isParsing && <p className="mt-2 text-xs text-slate-500">{ingestStatus}</p>}
            {!isParsing && ingestStatus && <p className="mt-2 text-xs text-slate-500">{ingestStatus}</p>}
            {info && <p className="mt-3 text-sm text-amber-600">{info}</p>}
            <div className="mt-3 flex flex-wrap gap-2 items-center text-xs text-slate-500">
              <span>Gemini model:</span>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700"
              >
                <option value="">Select model</option>
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchModels}
                disabled={isLoadingModels}
                className="px-2 py-1 rounded-lg border border-slate-300 text-slate-700"
              >
                {isLoadingModels ? 'Loading...' : 'Load models'}
              </button>
            </div>
            {!isParsing && !info && (
              <p className="mt-2 text-xs text-slate-500">
                OCR runs on scanned PDFs and images. Large PDFs are limited to the first {OCR_PAGE_LIMIT} pages.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={generateStudyPack}
                disabled={isGenerating || isParsing}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                <Sparkles size={16} /> {isGenerating ? 'Building study pack...' : 'Generate study pack'}
              </button>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <FileText size={14} /> {hasGeminiKey ? 'Gemini enabled' : 'Local extraction'}
              </div>
            </div>
          </div>

          <div id="active-recall" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise study-delay-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpenCheck size={20} className="text-green-600" /> Active recall
              </h2>
              {timeLeft !== null && (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <Timer size={14} /> {formatCountdown(timeLeft)}
                </div>
              )}
            </div>

            {!activeCard ? (
              <p className="text-sm text-slate-500 mt-4">Generate a study pack to start drilling.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="uppercase tracking-wide">{activeCard.topicTitle}</span>
                  <span>{activeCard.type.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-semibold">{activeCard.prompt}</h3>
                {activeCard.options && activeCard.options.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    {activeCard.options.map((option, idx) => (
                      <div key={idx} className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2">
                        {option}
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  value={attempt}
                  onChange={(e) => setAttempt(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-green-500"
                  placeholder="Type your attempt before revealing."
                />

                {!showAnswer ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <PlayCircle size={16} /> Reveal answer
                    </button>
                    <button
                      onClick={skipCard}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm w-full sm:w-auto"
                    >
                      Skip for now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Model answer</p>
                      <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{activeCard.answer || 'No answer provided in the notes.'}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => gradeCard('know')}
                        className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <CheckCircle2 size={16} /> I know this
                      </button>
                      <button
                        onClick={() => gradeCard('unsure')}
                        className="px-4 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <HelpCircle size={16} /> Not sure
                      </button>
                      <button
                        onClick={() => gradeCard('fail')}
                        className="px-4 py-2 rounded-lg bg-rose-500 text-white font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <XCircle size={16} /> Failed
                      </button>
                    </div>
                  </div>
                )}

                {lastFailedCardId === activeCard.id && showAnswer && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
                    <p className="font-semibold">Quick rescue</p>
                    <p className="mt-2">Retry with a shorter answer first, then exam wording.</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <button
                        onClick={() => retryFailedCard('simple')}
                        className="px-3 py-2 rounded-lg bg-white border border-rose-300 text-rose-700"
                      >
                        Simpler retry
                      </button>
                      <button
                        onClick={() => retryFailedCard('exam')}
                        className="px-3 py-2 rounded-lg bg-rose-500 text-white"
                      >
                        Exam retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedTopic && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise study-delay-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-green-600" />
                  <h2 className="text-lg font-semibold">Guided learning: {selectedTopic.title}</h2>
                </div>
                <span className="text-xs text-slate-500">
                  Step {guidedStepIndex + 1} of {guidedSteps.length}
                </span>
              </div>

              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">{guidedSteps[guidedStepIndex]?.title}</p>
                <p className="mt-3 text-slate-700 whitespace-pre-wrap text-sm">
                  {guidedSteps[guidedStepIndex]?.body}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setGuidedStepIndex((index) => Math.max(0, index - 1))}
                  disabled={guidedStepIndex === 0}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  onClick={() => setGuidedStepIndex((index) => Math.min(guidedSteps.length - 1, index + 1))}
                  disabled={guidedStepIndex >= guidedSteps.length - 1}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-40"
                >
                  Next step
                </button>
                <button
                  onClick={() => setGuidedStepIndex(guidedSteps.length - 1)}
                  className="px-3 py-2 rounded-lg border border-green-200 text-green-700 text-sm"
                >
                  Jump to exam focus
                </button>
              </div>
            </div>
          )}

          <div id="ai-coach" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise study-delay-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Brain size={18} className="text-green-600" /> AI coach (smart guidance)
              </h2>
              <span className="text-xs text-slate-500">Uses notes + standard knowledge</span>
            </div>
            <div className="mt-4 space-y-3">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-green-500"
                placeholder="Ask a question (e.g. Explain usability testing steps for exams)"
              />
              <textarea
                value={aiRules}
                onChange={(e) => setAiRules(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm sm:text-xs text-slate-900 focus:border-green-500"
                placeholder="Optional rules: keep it short, 5 bullet points, include formulas..."
              />
              <button
                onClick={handleAskAi}
                disabled={isAskingAi}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-60 w-full sm:w-auto"
              >
                {isAskingAi ? 'Thinking...' : 'Ask AI coach'}
              </button>
              {aiAnswer && (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Flame size={18} className="text-amber-600" /> Study queue
            </h3>
            <p className="text-xs text-slate-500 mt-1">Start in 3 seconds. Hit the weakest item first.</p>
            <div className="mt-4 space-y-2">
              {dueCards.length === 0 && <p className="text-sm text-slate-500">No items due yet.</p>}
              {dueCards.slice(0, 6).map(card => {
                const state = reviewState[card.id] || getDefaultReviewState();
                return (
                  <button
                    key={card.id}
                    onClick={() => { setCurrentCardId(card.id); setShowAnswer(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900">{card.prompt}</span>
                      <span className={`text-xs ${state.strength < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {state.strength}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">{card.topicTitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise study-delay-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={18} className="text-green-600" /> Topic mastery
            </h3>
            <div className="mt-4 space-y-3">
              {masteryByTopic.length === 0 && <p className="text-sm text-slate-500">No topics yet.</p>}
              {masteryByTopic.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-900">{topic.title}</span>
                    <span className="text-slate-500">{topic.mastery}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full mt-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{ width: `${topic.mastery}%` }}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedTopic && selectedTopic.videos.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise study-delay-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Video size={18} className="text-amber-600" /> Focus videos
              </h3>
              <p className="text-xs text-slate-500 mt-1">Short refreshers, not endless feeds.</p>
              <div className="mt-4 space-y-3">
                {selectedTopic.videos.slice(0, 3).map((video, idx) => (
                  <a
                    key={idx}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.query || video.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm"
                  >
                    <p className="text-slate-900">{video.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Search: {video.query || video.title}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm study-rise study-delay-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpenCheck size={18} className="text-green-600" /> Daily loop
            </h3>
            <ul className="mt-3 text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-600" /> Start with weak items.</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-600" /> Attempt before reveal.</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-600" /> Retake failed cards in hours, not days.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pb-10">
        Made with love by Edgait.
      </div>
    </div>
  );
};

export default StudyPage;
