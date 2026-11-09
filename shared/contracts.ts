import { z } from 'zod';

export const questionTypeSchema = z.enum(['single','multiple','true_false','scenario','image']);
export const difficultySchema = z.enum(['easy','medium','hard']);
export const languageModeSchema = z.enum(['en','tr','bilingual']);
export const contentBlockSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('heading'),level:z.number().int().min(1).max(4),text:z.string()}),
  z.object({type:z.literal('paragraph'),text:z.string()}),
  z.object({type:z.literal('list'),ordered:z.boolean().default(false),items:z.array(z.object({text:z.string(),level:z.number().int().min(0).max(4)}))}),
  z.object({type:z.literal('code'),language:z.string().default('text'),text:z.string()}),
  z.object({type:z.literal('table'),headers:z.array(z.string()),rows:z.array(z.array(z.string()))}),
  z.object({type:z.literal('image'),dataUrl:z.string().startsWith('data:image/'),altText:z.string(),caption:z.string().optional(),sourcePage:z.number().int().optional()}),
  z.object({type:z.literal('image_notice'),text:z.string(),page:z.number().int().optional()})
]);
export const questionContentDocumentSchema=z.object({version:z.literal(1),caseStudyTitle:z.string().optional(),caseStudyBlocks:z.array(contentBlockSchema).default([]),promptBlocks:z.array(contentBlockSchema)});

export const optionInputSchema = z.object({ id:z.string().optional(), label:z.string().min(1), text:z.string().min(1), isCorrect:z.boolean().default(false), sortOrder:z.number().int().nonnegative().default(0) });
export const questionInputSchema = z.object({
  id:z.string().optional(), sourceIdentifier:z.string().max(200).optional(), certificationId:z.string().min(1), categoryId:z.string().nullable().optional(), type:questionTypeSchema,
  originalLanguage:z.enum(['en','tr']).default('en'), originalText:z.string().min(1), explanation:z.string().default(''),
  difficulty:difficultySchema.default('medium'), sourceInfo:z.string().default(''), reviewStatus:z.enum(['ready','needs_review','approved']).default('ready'),
  rawText:z.string().optional(),structuredContent:questionContentDocumentSchema.nullable().optional(),tags:z.array(z.string()).default([]), options:z.array(optionInputSchema).min(2)
}).superRefine((value,ctx)=>{ const count=value.options.filter(o=>o.isCorrect).length; if(count===0)ctx.addIssue({code:'custom',message:'En az bir doğru seçenek gerekli',path:['options']}); if(value.type!=='multiple'&&count>1)ctx.addIssue({code:'custom',message:'Bu soru tipi tek doğru seçenek destekler',path:['options']}); });

export const examConfigSchema = z.object({
  certificationId:z.string().min(1), mode:z.enum(['exam','practice','custom','incorrect','bookmarked']), categoryIds:z.array(z.string()).default([]),
  difficulties:z.array(difficultySchema).default([]), questionCount:z.number().int().min(1).max(500), durationMinutes:z.number().int().min(0).max(600),
  passingScore:z.number().min(0).max(100).default(70), randomizeQuestions:z.boolean().default(false), randomizeOptions:z.boolean().default(true),
  languageMode:languageModeSchema.default('en'), onlyUnanswered:z.boolean().default(false),rangeStart:z.number().int().min(1).max(500).optional(),rangeEnd:z.number().int().min(1).max(500).optional()
}).superRefine((value,ctx)=>{if(value.rangeStart!==undefined&&value.rangeEnd!==undefined&&value.rangeEnd<value.rangeStart)ctx.addIssue({code:'custom',message:'Bitiş soru numarası başlangıçtan küçük olamaz',path:['rangeEnd']})});
export const answerSchema = z.object({sessionId:z.string(),questionId:z.string(),selectedOptionIds:z.array(z.string()),markedForReview:z.boolean().optional(),timeSpentSeconds:z.number().int().nonnegative().optional()});
export const translationInputSchema = z.object({questionId:z.string(),language:z.literal('tr'),translatedText:z.string().min(1),translatedExplanation:z.string().default(''),optionTranslations:z.record(z.string(),z.string()),status:z.enum(['cached','approved','needs_review']).default('cached'),provider:z.string().default('manual')});
export const glossaryInputSchema = z.object({id:z.string().optional(),sourceTerm:z.string().min(1),preferredTranslation:z.string(),isProtected:z.boolean().default(false),notes:z.string().default('')});
export const providerSettingsSchema = z.object({provider:z.enum(['ollama','gemini','openai']),enabled:z.boolean(),model:z.string(),baseUrl:z.string().url().optional(),allowQuestionContent:z.boolean().default(false)});

export type QuestionInput=z.infer<typeof questionInputSchema>;
export type ExamConfig=z.infer<typeof examConfigSchema>;
export type AnswerInput=z.infer<typeof answerSchema>;
export type TranslationInput=z.infer<typeof translationInputSchema>;
export type GlossaryInput=z.infer<typeof glossaryInputSchema>;
export type ContentBlock=z.infer<typeof contentBlockSchema>;
export type QuestionContentDocument=z.infer<typeof questionContentDocumentSchema>;

export interface Provider { id:string; name:string; slug:string; color:string; certificationCount:number }
export interface Certification { id:string; providerId:string; providerName:string; name:string; code:string; description:string; questionCount:number; categoryCount:number }
export interface Category { id:string; certificationId:string; name:string; description:string }
export interface QuestionOption { id:string; label:string; text:string; isCorrect?:boolean; sortOrder:number }
export interface Question { id:string;sourceIdentifier:string|null;certificationId:string;categoryId:string|null;categoryName:string|null;type:z.infer<typeof questionTypeSchema>;originalLanguage:'en'|'tr';originalText:string;rawText:string;structuredContent:QuestionContentDocument|null;formattingVersion:number;explanation:string;difficulty:z.infer<typeof difficultySchema>;sourceInfo:string;reviewStatus:string;createdAt:string;updatedAt:string;tags:string[];options:QuestionOption[];translation?:{translatedText:string;translatedExplanation:string;optionTranslations:Record<string,string>;status:string}|null;bookmarked:boolean }
export interface SessionQuestion extends Question { position:number; optionOrder:string[]; selectedOptionIds:string[]; markedForReview:boolean; answered:boolean }
export interface ExamSession {id:string;certificationId:string;certificationName:string;mode:string;status:'active'|'paused'|'completed'|'abandoned';startedAt:string;completedAt:string|null;durationMinutes:number;remainingSeconds:number;passingScore:number;languageMode:z.infer<typeof languageModeSchema>;currentPosition:number;score:number|null;config:ExamConfig;questions:SessionQuestion[]}
export interface DashboardStats {totalCertifications:number;totalQuestions:number;completedExams:number;averageScore:number;correctAnswers:number;incorrectAnswers:number;unanswered:number;bookmarks:number;recentExams:Array<{id:string;certificationName:string;score:number;completedAt:string;passed:boolean}>;trend:Array<{date:string;score:number}>;activity:Array<{date:string;questions:number}>;weakTopics:Array<{category:string;accuracy:number;attempts:number}>}
export interface ImportPreview {questions:Array<Omit<QuestionInput,'certificationId'> & {externalId?:string;warnings:string[]}>;errors:Array<{row:number;message:string}>;requiresOcr?:boolean;sourceTextLength?:number}
export interface AppApi {
  system:{getInfo:()=>Promise<{version:string;platform:string;dataPath:string}>;openFile:(kind:'pdf'|'json'|'csv'|'backup')=>Promise<string|null>;saveFile:(kind:'json'|'csv'|'backup')=>Promise<string|null>};
  catalog:{listProviders:()=>Promise<Provider[]>;createProvider:(input:{name:string;color:string})=>Promise<Provider>;listCertifications:()=>Promise<Certification[]>;createCertification:(input:{providerId:string;name:string;code:string;description?:string})=>Promise<Certification>;listCategories:(certificationId:string)=>Promise<Category[]>;createCategory:(input:{certificationId:string;name:string;description?:string})=>Promise<Category>};
  questions:{list:(filters?:Record<string,unknown>)=>Promise<Question[]>;get:(id:string)=>Promise<Question>;save:(input:QuestionInput)=>Promise<Question>;remove:(id:string)=>Promise<void>;duplicate:(id:string)=>Promise<Question>;toggleBookmark:(id:string)=>Promise<boolean>;export:(filters?:Record<string,unknown>)=>Promise<string|null>};
  exams:{create:(config:ExamConfig)=>Promise<ExamSession>;retake:(sessionId:string)=>Promise<ExamSession>;active:()=>Promise<ExamSession|null>;get:(id:string)=>Promise<ExamSession>;answer:(input:AnswerInput)=>Promise<void>;navigate:(input:{sessionId:string;position:number;remainingSeconds:number})=>Promise<void>;setStatus:(input:{sessionId:string;status:'active'|'paused'})=>Promise<void>;submit:(sessionId:string)=>Promise<ExamSession>;history:()=>Promise<ExamSession[]>};
  stats:{dashboard:()=>Promise<DashboardStats>;reset:()=>Promise<{deletedSessions:number;deletedAttempts:number}>};
  imports:{preview:(input:{filePath:string;certificationId:string})=>Promise<ImportPreview>;commit:(input:{certificationId:string;questions:ImportPreview['questions'];sourcePath:string})=>Promise<{imported:number;duplicates:number;failed:number}>};
  translations:{list:(certificationId?:string)=>Promise<unknown[]>;save:(input:TranslationInput)=>Promise<void>;glossary:()=>Promise<Array<GlossaryInput & {id:string}>>;saveTerm:(input:GlossaryInput)=>Promise<void>;removeTerm:(id:string)=>Promise<void>;translate:(input:{questionId:string;provider:'ollama'|'gemini'|'openai'})=>Promise<TranslationInput>;explain:(input:{questionId:string;provider:'ollama'|'gemini'|'openai'})=>Promise<string>};
  backup:{create:(targetPath:string)=>Promise<{path:string;checksum:string}>;restore:(sourcePath:string)=>Promise<void>;integrity:()=>Promise<{ok:boolean;message:string}>};
  settings:{get:()=>Promise<Record<string,unknown>>;set:(key:string,value:unknown)=>Promise<void>;setCredential:(provider:'gemini'|'openai',secret:string)=>Promise<void>;testAi:(provider:'ollama'|'gemini'|'openai')=>Promise<{ok:boolean;message:string;models?:string[]}>};
}
