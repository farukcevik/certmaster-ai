export const MOBILE_SCHEMA_VERSION=2;
export const mobileMigrations=[{version:1,name:'initial-mobile-schema'},{version:2,name:'question-answer-overrides'}] as const;
export function pendingMobileMigrations(currentVersion:number){return mobileMigrations.filter(migration=>migration.version>currentVersion)}
