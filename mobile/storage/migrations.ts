export const MOBILE_SCHEMA_VERSION=1;
export const mobileMigrations=[{version:1,name:'initial-mobile-schema'}] as const;
export function pendingMobileMigrations(currentVersion:number){return mobileMigrations.filter(migration=>migration.version>currentVersion)}
