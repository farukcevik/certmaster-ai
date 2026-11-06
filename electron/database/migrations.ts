export const migrations = [
  {version:1,name:'initial_schema',sql:`
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE certification_providers(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,slug TEXT NOT NULL UNIQUE,color TEXT NOT NULL DEFAULT '#1685d1',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE certifications(id TEXT PRIMARY KEY,provider_id TEXT NOT NULL REFERENCES certification_providers(id) ON DELETE CASCADE,name TEXT NOT NULL,code TEXT NOT NULL UNIQUE,description TEXT NOT NULL DEFAULT '',default_question_count INTEGER NOT NULL DEFAULT 50,default_duration_minutes INTEGER NOT NULL DEFAULT 120,passing_score REAL NOT NULL DEFAULT 70,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE categories(id TEXT PRIMARY KEY,certification_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',UNIQUE(certification_id,name));
CREATE TABLE questions(id TEXT PRIMARY KEY,certification_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,type TEXT NOT NULL CHECK(type IN('single','multiple','true_false','scenario','image')),original_language TEXT NOT NULL DEFAULT 'en',original_text TEXT NOT NULL,explanation TEXT NOT NULL DEFAULT '',difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN('easy','medium','hard')),source_info TEXT NOT NULL DEFAULT '',source_hash TEXT NOT NULL,review_status TEXT NOT NULL DEFAULT 'ready',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE question_options(id TEXT PRIMARY KEY,question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,label TEXT NOT NULL,text TEXT NOT NULL,is_correct INTEGER NOT NULL DEFAULT 0,sort_order INTEGER NOT NULL DEFAULT 0,UNIQUE(question_id,label));
CREATE TABLE question_images(id TEXT PRIMARY KEY,question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,path TEXT NOT NULL,mime_type TEXT NOT NULL,alt_text TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE tags(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE);
CREATE TABLE question_tags(question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,PRIMARY KEY(question_id,tag_id));
CREATE TABLE question_translations(id TEXT PRIMARY KEY,question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,language TEXT NOT NULL,translated_text TEXT NOT NULL,translated_explanation TEXT NOT NULL DEFAULT '',option_translations_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'cached',provider TEXT NOT NULL DEFAULT 'manual',validation_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(question_id,language));
CREATE TABLE terminology_dictionary(id TEXT PRIMARY KEY,source_term TEXT NOT NULL UNIQUE,preferred_translation TEXT NOT NULL DEFAULT '',is_protected INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE exam_sessions(id TEXT PRIMARY KEY,certification_id TEXT NOT NULL REFERENCES certifications(id),mode TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT,duration_minutes INTEGER NOT NULL DEFAULT 0,remaining_seconds INTEGER NOT NULL DEFAULT 0,passing_score REAL NOT NULL DEFAULT 70,language_mode TEXT NOT NULL DEFAULT 'en',current_position INTEGER NOT NULL DEFAULT 0,score REAL,config_json TEXT NOT NULL DEFAULT '{}');
CREATE TABLE exam_session_questions(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,question_id TEXT NOT NULL REFERENCES questions(id),position INTEGER NOT NULL,option_order_json TEXT NOT NULL DEFAULT '[]',selected_options_json TEXT NOT NULL DEFAULT '[]',marked_for_review INTEGER NOT NULL DEFAULT 0,time_spent_seconds INTEGER NOT NULL DEFAULT 0,is_correct INTEGER,UNIQUE(session_id,question_id),UNIQUE(session_id,position));
CREATE TABLE question_attempts(id TEXT PRIMARY KEY,question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,selected_options_json TEXT NOT NULL,is_correct INTEGER NOT NULL,time_spent_seconds INTEGER NOT NULL DEFAULT 0,attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE bookmarks(id TEXT PRIMARY KEY,question_id TEXT NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE translation_jobs(id TEXT PRIMARY KEY,certification_id TEXT REFERENCES certifications(id),provider TEXT NOT NULL,status TEXT NOT NULL,progress INTEGER NOT NULL DEFAULT 0,total INTEGER NOT NULL DEFAULT 0,error TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE import_jobs(id TEXT PRIMARY KEY,certification_id TEXT REFERENCES certifications(id),source_path TEXT NOT NULL,source_type TEXT NOT NULL,status TEXT NOT NULL,imported_count INTEGER NOT NULL DEFAULT 0,failed_count INTEGER NOT NULL DEFAULT 0,error_json TEXT NOT NULL DEFAULT '[]',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE application_settings(key TEXT PRIMARY KEY,value_json TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX idx_questions_certification ON questions(certification_id); CREATE INDEX idx_questions_category ON questions(category_id); CREATE INDEX idx_questions_hash ON questions(source_hash); CREATE INDEX idx_attempts_question ON question_attempts(question_id); CREATE INDEX idx_sessions_status ON exam_sessions(status); CREATE INDEX idx_sessions_completed ON exam_sessions(completed_at);
`},
  {version:2,name:'stable_source_identifiers',sql:`
ALTER TABLE questions ADD COLUMN source_identifier TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_source_identifier ON questions(certification_id,source_identifier) WHERE source_identifier IS NOT NULL;
`},
  {version:3,name:'structured_question_content',sql:`
ALTER TABLE questions ADD COLUMN raw_text TEXT NOT NULL DEFAULT '';
ALTER TABLE questions ADD COLUMN structured_content_json TEXT;
ALTER TABLE questions ADD COLUMN formatting_version INTEGER NOT NULL DEFAULT 0;
`}
];
