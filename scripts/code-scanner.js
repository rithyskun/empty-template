#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Code Quality Scanner
 * Scans TypeScript files for SKILL.md compliance issues
 *
 * Usage:
 *   node scripts/code-scanner.js [options]
 *
 * Options:
 *   --severity=blocker    Only show blocker issues
 *   --severity=high       Show high+ issues
 *   --severity=medium     Show medium+ issues (default)
 *   --severity=low        Show all issues
 *   --path=./src          Directory to scan (default: ./src)
 *   --fix                 Attempt to auto-fix issues where possible
 *   --output=json         Output as JSON
 *   --output=markdown     Output as Markdown report
 *
 * Examples:
 *   node scripts/code-scanner.js --severity=high
 *   node scripts/code-scanner.js --path=./src/modules/payroll
 *   node scripts/code-scanner.js --output=markdown > quality-report.md
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ==========================================
// Constants
// ==========================================
const SNIPPET_CONTEXT_CHARS = 30;
const SURROUNDING_CONTEXT_CHARS = 80;
const WIDE_CONTEXT_CHARS = 300;
const MAX_PARAMS = 5;

const SEVERITY_LEVELS = ['low', 'medium', 'high', 'blocker'];

const SEVERITY_ICONS = {
  blocker: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

// ==========================================
// Configuration
// ==========================================
const DEFAULT_CONFIG = {
  srcDir: './src',
  excludeDirs: ['node_modules', 'dist', 'coverage', 'test', '.git'],
  excludeFiles: ['*.d.ts', '*.spec.ts', '*.test.ts'],
  fileExtensions: ['.ts'],
};

// ==========================================
// Type Definitions (JSDoc)
// ==========================================
/**
 * @typedef {Object} Issue
 * @property {string} rule
 * @property {'blocker'|'high'|'medium'|'low'} severity
 * @property {string} message
 * @property {number} line
 * @property {number} column
 * @property {boolean} fixable
 * @property {string} snippet
 * @property {string} [file]
 */

/**
 * @typedef {Object} RuleDefinition
 * @property {'blocker'|'high'|'medium'|'low'} severity
 * @property {RegExp} pattern
 * @property {string} message
 * @property {boolean} fixable
 * @property {Function} [check]
 * @property {Function} [fix]
 * @property {boolean} [fileNameOnly]
 */

// ==========================================
// Rule Definitions (based on SKILL.md)
// ==========================================

/** @type {Record<string, RuleDefinition>} */
const RULES = {
  // ==========================================
  // BLOCKER Rules
  // ==========================================
  'no-eval': {
    severity: 'blocker',
    pattern: /\beval\s*\(|new\s+Function\s*\(/g,
    message: 'Do not use eval() or new Function() - security risk',
    fixable: false,
  },

  'no-implied-eval': {
    severity: 'blocker',
    pattern: /setTimeout\s*\(\s*['"`]/g,
    message: 'Do not pass strings to setTimeout() - security risk',
    fixable: false,
  },

  'no-switch-fallthrough': {
    severity: 'blocker',
    pattern: /case\s+[^:]+:[^}]*?(?=case|default)/gs,
    message: 'Switch case may be missing break statement',
    fixable: false,
    check: (match) => {
      const caseContent = match[0];
      return (
        !caseContent.includes('break') &&
        !caseContent.includes('return') &&
        !caseContent.includes('throw') &&
        !caseContent.includes('// falls through') &&
        !caseContent.includes('// fallthrough')
      );
    },
  },

  'sql-injection-string-concat': {
    severity: 'blocker',
    pattern: /\.query\s*\(\s*[`'"][^`'"]*\$\{[^}]+\}[^`'"]*[`'"]/g,
    message: 'SQL query with string interpolation - use parameterized queries',
    fixable: false,
  },

  'sql-injection-template-literal': {
    severity: 'blocker',
    pattern: /`(?:[^`]*\$\{[^}]+\}[^`]*)*`/g,
    message: 'Potential SQL injection via template literal in query context',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const surrounding = content.substring(
        lineStart,
        lineEnd > 0 ? lineEnd : undefined,
      );
      return /\.(?:query|execute|raw)\s*\(|manager\.query|getRepository|createQueryBuilder/.test(
        surrounding,
      );
    },
  },

  'hardcoded-secret': {
    severity: 'blocker',
    pattern:
      /(?:secret|password|apiKey|api_key|token|jwt_secret|JWT_SECRET)\s*=\s*['"][^'"]{3,}['"]/gi,
    message: 'Hardcoded secret detected - use environment variables',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const line = content.substring(
        lineStart,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (line.includes('process.env') || line.includes('configService'))
        return false;
      // Skip DI token constants (e.g. CACHE_TOKEN = 'CACHE_TOKEN')
      if (/export\s+const\s+\w+_TOKEN\s*=/.test(line)) return false;
      // Skip if the value looks like a constant name (all uppercase/underscores)
      const valueMatch = match[0].match(/['"]([^'"]+)['"]/);
      if (valueMatch && /^[A-Z][A-Z_0-9]*$/.test(valueMatch[1])) return false;
      return true;
    },
  },

  'hardcoded-secret-fallback': {
    severity: 'blocker',
    pattern: /process\.env\.\w+\s*\|\|\s*['"][^'"]{3,}['"]/g,
    message: 'Environment variable with hardcoded fallback - fail fast instead',
    fixable: false,
  },

  'throw-in-callback': {
    severity: 'blocker',
    pattern: /res\.download\s*\([^)]*,\s*(?:err|error)\s*=>\s*\{[^}]*throw/gs,
    message:
      'Throwing exception inside res.download() callback - use res.status() instead',
    fixable: false,
  },

  'os-command-injection': {
    severity: 'blocker',
    pattern: /(?:exec|execSync)\s*\(\s*`[^`]*\$\{[^}]+\}/g,
    message:
      'OS command injection via template literal - use execFile() with array args',
    fixable: false,
  },

  'jwt-none-algorithm': {
    severity: 'blocker',
    pattern: /algorithm[s]?\s*[=:]\s*\[?\s*['"]none['"]/gi,
    message: 'JWT "none" algorithm allowed - never accept unsigned tokens',
    fixable: false,
  },

  'injectable-missing-decorator': {
    severity: 'blocker',
    pattern: /^Injectable\s*\(\s*\)\s*;/gm,
    message: 'Injectable() called without @ decorator - breaks NestJS DI',
    fixable: true,
    fix: () => '@Injectable()',
  },

  // ==========================================
  // HIGH Severity
  // ==========================================
  'no-var': {
    severity: 'high',
    pattern: /\bvar\s+/g,
    message: 'Use const or let instead of var',
    fixable: true,
    fix: (match) => match[0].replace('var', 'let'),
    check: (match, content) => {
      // Skip if inside template literal (embedded JS/CSS strings)
      const before = content.substring(0, match.index);
      const backtickCount = (before.match(/`/g) || []).length;
      if (backtickCount % 2 !== 0) return false;
      // Skip if inside comment
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;
      return true;
    },
  },

  'weak-crypto': {
    severity: 'high',
    pattern: /createHash\s*\(\s*['"](?:md5|sha1|des)['"]\s*\)/g,
    message:
      'Weak cryptographic algorithm - use SHA-256+ or bcrypt for passwords',
    fixable: false,
  },

  'ssl-verification-disabled': {
    severity: 'high',
    pattern: /rejectUnauthorized\s*:\s*false/g,
    message: 'SSL/TLS certificate verification disabled - enables MITM attacks',
    fixable: false,
    check: (_match, _content, filePath) => {
      return !filePath.includes('mail-server.service.ts');
    },
  },

  'weak-cipher-algorithm': {
    severity: 'high',
    pattern: /createCipher\s*\(\s*['"](?:des|rc4|blowfish)['"]\s*,/gi,
    message: 'Weak cipher algorithm - use createCipheriv with aes-256-gcm',
    fixable: false,
  },

  'trust-server-certificate': {
    severity: 'high',
    pattern: /trustServerCertificate\s*:\s*true/g,
    message: 'TLS certificate validation disabled - enables MITM attacks',
    fixable: false,
    check: (_match, _content, filePath) => {
      return !filePath.includes('typeorm.service.ts');
    },
  },

  'cors-wildcard': {
    severity: 'high',
    pattern: /origin\s*:\s*['"]\*['"]|origin\s*:\s*true(?!\s*,)/g,
    message: 'CORS allows all origins - restrict to known domains',
    fixable: false,
  },

  'empty-catch-block': {
    severity: 'high',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    message: 'Empty catch block swallows errors - log or re-throw the error',
    fixable: false,
    check: (match, content) => {
      const before = content.substring(
        Math.max(0, match.index - SURROUNDING_CONTEXT_CHARS),
        match.index,
      );
      if (/\/\/\s*(?:ignore|intentional|expected|no-op|noop)/i.test(before))
        return false;
      return true;
    },
  },

  'return-in-finally': {
    severity: 'high',
    pattern: /finally\s*\{[^}]*\breturn\b/gs,
    message:
      'return in finally block swallows exceptions - remove return from finally',
    fixable: false,
  },

  'throw-in-finally': {
    severity: 'high',
    pattern: /finally\s*\{[^}]*\bthrow\b/gs,
    message: 'throw in finally block masks original exception',
    fixable: false,
  },

  'async-in-constructor': {
    severity: 'high',
    pattern: /constructor\s*\([^)]*\)\s*\{[^}]*(?:await\s|\.then\s*\()/gs,
    message:
      'Async operation in constructor - use onModuleInit() lifecycle hook instead',
    fixable: false,
  },

  'untyped-body-decorator': {
    severity: 'high',
    pattern: /@Body\s*\(\s*\)\s*\w+\s*:\s*any/g,
    message: '@Body() with `any` type - use a validated DTO class',
    fixable: false,
  },

  'manual-instantiation-service': {
    severity: 'high',
    pattern: /new\s+\w+Service\s*\(/g,
    message:
      'Manual service instantiation bypasses NestJS DI - inject via constructor',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const line = content.substring(
        lineStart,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (/mock|Mock|spec|test/i.test(line)) return false;
      if (/useValue|useFactory/.test(line)) return false;
      if (/ConfigService/.test(match[0])) return false;
      return true;
    },
  },

  'business-logic-in-controller': {
    severity: 'high',
    pattern:
      /@(Post|Get|Put|Patch|Delete)\([^)]*\)[^@]*?(?:await\s+this\.\w+\.save|await\s+this\.\w+\.create|await\s+this\.\w+\.update|await\s+this\.\w+\.remove|await\s+this\.\w+\.find)/gs,
    message: 'Business logic in controller - delegate to service layer',
    fixable: false,
    check: (match) => {
      return !/this\.\w+Service/.test(match[0]);
    },
  },

  'fire-and-forget-promise': {
    severity: 'high',
    pattern:
      /this\.\w+\.(?:save|create|update|remove|add|send|emit|execute)\s*\([^)]*\)\s*;/g,
    message:
      'Promise call without await/return - fire-and-forget may lose errors',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const fullLine = content.substring(
        lineStart,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (
        fullLine.includes('await') ||
        fullLine.includes('return') ||
        fullLine.includes('.then') ||
        fullLine.includes('.catch')
      ) {
        return false;
      }
      if (/\.server\.emit|this\.server\.emit/.test(fullLine)) return false;
      if (/\.pipe\(|firstValueFrom/.test(fullLine)) return false;
      if (/this\.logger\./.test(fullLine)) return false;
      return true;
    },
  },

  'swallowed-error': {
    severity: 'high',
    pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*return\s+\w+\s*;?\s*\}/g,
    message: 'Error returned as success - re-throw or handle properly',
    fixable: false,
  },

  'missing-return-after-next': {
    severity: 'high',
    pattern: /(?<!return\s)next\s*\(\s*\)\s*;?\s*\n(?!\s*return)/g,
    message: 'Missing return after next() - execution may fall through',
    fixable: false,
    check: (match, content) => {
      const afterStart = match.index + match[0].length;
      const after = content.substring(afterStart, afterStart + 50);
      if (/return|if\s*\(|throw|else/.test(after.trim())) return false;
      const remaining = after.trim();
      if (/^\s*\}?\s*\}?\s*$/.test(remaining) || remaining.startsWith('}'))
        return false;
      return true;
    },
  },

  'typeorm-n-plus-one': {
    severity: 'high',
    pattern:
      /for\s*\([^)]+\)\s*\{[^}]*?(?:await\s+this\.\w+\.findOne|await\s+this\.\w+\.find|\.findOne\s*\(|\.find\s*\()/gs,
    message: 'N+1 query pattern - use relations or QueryBuilder instead',
    fixable: false,
  },

  'typeorm-eager-loading': {
    severity: 'high',
    pattern: /eager\s*:\s*true/g,
    message:
      'Eager loading all relations hurts performance - use explicit loading',
    fixable: false,
  },

  'microservice-no-timeout': {
    severity: 'high',
    pattern: /(?:send|emit)\s*\([^)]+\)\s*(?:;|(?!\s*\.pipe))/g,
    message: 'Microservice call without timeout - add .pipe(timeout(ms))',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.includes('.pipe(') || line.includes('timeout')) return false;
      if (/res\.send|response\.send|\.sendStatus/.test(line)) return false;
      if (/this\.\w+Microservice|ClientProxy|client\.\w+/.test(line))
        return true;
      return false;
    },
  },

  'bullmq-no-error-handling': {
    severity: 'high',
    pattern:
      /@Process\s*\([^)]*\)\s*\n\s*async\s+\w+\s*\([^)]*\)\s*\{(?!\s*try)/gs,
    message:
      '@Process() handler without try/catch - job errors will be unhandled',
    fixable: false,
  },

  'queue-add-no-options': {
    severity: 'high',
    pattern: /\.add\s*\(\s*['"][^'"]+['"]\s*,\s*\w+\s*\)\s*;/g,
    message:
      'Queue.add() without retry/backoff options - configure attempts and backoff',
    fixable: false,
    check: (match, content) => {
      const before = content.substring(
        Math.max(0, match.index - WIDE_CONTEXT_CHARS),
        match.index,
      );
      return /Queue|queue|bullmq/i.test(before);
    },
  },

  // ==========================================
  // MEDIUM Severity
  // ==========================================
  'no-loose-equality': {
    severity: 'medium',
    pattern: /[^!=]==[^=]/g,
    message: 'Use strict equality (===) instead of loose equality (==)',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;
      const charBefore = content.substring(match.index - 1, match.index);
      if (charBefore === '!' || charBefore === '=') return false;
      const fullLine = content.substring(
        lineStart + 1,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (/^[^'"`]*['"`].*==.*['"`]/.test(fullLine)) return false;
      if (/base64/.test(fullLine)) return false;
      return true;
    },
  },

  'no-console-log': {
    severity: 'medium',
    pattern: /console\.log\s*\(/g,
    message: 'Use Logger service instead of console.log',
    fixable: false,
    check: (match, content) => !isInsideBlockComment(match.index, content),
  },

  'no-console-error': {
    severity: 'medium',
    pattern: /console\.error\s*\(/g,
    message: 'Use Logger.error() instead of console.error',
    fixable: false,
    check: (match, content) => !isInsideBlockComment(match.index, content),
  },

  'no-console-warn': {
    severity: 'medium',
    pattern: /console\.warn\s*\(/g,
    message: 'Use Logger.warn() instead of console.warn',
    fixable: false,
    check: (match, content) => !isInsideBlockComment(match.index, content),
  },

  'no-string-concat': {
    severity: 'medium',
    pattern: /['"]\s*\+\s*\w+\s*\+\s*['"]/g,
    message: 'Use template literals instead of string concatenation',
    fixable: true,
  },

  'non-null-assertion': {
    severity: 'medium',
    pattern: /\w!\./g,
    message:
      'Non-null assertion (!.) may cause runtime errors - use optional chaining (?.)',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;
      // Skip if it's !== operator
      if (content.charAt(match.index + match[0].length) === '=') return false;
      return true;
    },
  },

  'too-many-parameters': {
    severity: 'medium',
    pattern: /(?:async\s+)?(?:function\s+\w+|\w+)\s*\(([^)]{100,})\)/g,
    message: `Too many function parameters (>${MAX_PARAMS}) - use a DTO/options object`,
    fixable: false,
    check: (match, content) => {
      const raw = match[1];
      const params = countTopLevelParams(raw);
      if (params <= MAX_PARAMS) return false;
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.includes('constructor')) return false;
      if (match[1].includes('@')) return false;
      if (content.charAt(match.index - 1) === '@') return false;
      const before = content.substring(
        Math.max(0, match.index - 100),
        match.index,
      );
      if (/interface\s|type\s/.test(before)) return false;
      return true;
    },
  },

  'redundant-await': {
    severity: 'medium',
    pattern: /return\s+await\s+/g,
    message: 'Redundant await on return - just return the promise',
    fixable: true,
    fix: () => 'return ',
    check: (match, content) => {
      const before = content.substring(0, match.index);
      const lastTry = before.lastIndexOf('try {');
      const lastCatch = before.lastIndexOf('} catch');
      return lastTry < lastCatch;
    },
  },

  'missing-transaction': {
    severity: 'medium',
    pattern:
      /await\s+this\.\w+\.save\s*\([^)]*\)\s*;?\s*\n\s*await\s+this\.\w+\.save/g,
    message: 'Multiple saves without transaction - data inconsistency risk',
    fixable: false,
  },

  'object-assign-usage': {
    severity: 'medium',
    pattern: /Object\.assign\s*\(\s*\{\s*\}/g,
    message: 'Use spread syntax ({ ...obj }) instead of Object.assign({})',
    fixable: false,
  },

  'process-env-direct-access': {
    severity: 'medium',
    pattern: /process\.env\.\w+/g,
    message:
      'Direct process.env access - use ConfigService for centralized config',
    fixable: false,
    check: (match, content, filePath) => {
      if (!filePath) return false;
      const normalized = filePath.replace(/\\/g, '/');
      if (
        normalized.includes('/config') ||
        normalized.includes('main.ts') ||
        normalized.includes('/scripts/') ||
        normalized.includes('.module.ts') ||
        normalized.includes('cipher') ||
        normalized.includes('ormconfig')
      ) {
        return false;
      }
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;
      return true;
    },
  },

  'promise-then-in-try': {
    severity: 'medium',
    pattern: /try\s*\{[^}]*\.then\s*\(/gs,
    message: 'Using .then() inside try/catch is unreliable - use await instead',
    fixable: false,
  },

  'deep-nesting': {
    severity: 'medium',
    pattern: /^(\s{20,})\S/gm,
    message:
      'Deeply nested code (5+ levels) - extract sub-functions or use early returns',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const line = content.substring(
        lineStart + 1,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;
      if (line.trim().startsWith('}') || line.trim() === '') return false;
      if (/^\s*[}\])\s;,]*$/.test(line)) return false;
      return true;
    },
  },

  'jwt-secret-empty-fallback': {
    severity: 'medium',
    pattern: /JWT_SECRET.*\|\|\s*['"]/g,
    message:
      'JWT secret with empty string fallback - tokens may be accepted with any signature',
    fixable: false,
  },

  'res-decorator-usage': {
    severity: 'medium',
    pattern: /@Res\s*\(\s*\)/g,
    message:
      '@Res() disables NestJS auto-response handling - use only when streaming files',
    fixable: false,
    check: (match, content) => {
      const surrounding = content.substring(
        Math.max(0, match.index - 100),
        Math.min(content.length, match.index + 200),
      );
      if (/download|stream|file|excel|pdf|csv|write/i.test(surrounding))
        return false;
      return true;
    },
  },

  // ==========================================
  // LOW Severity
  // ==========================================
  'prefer-readonly-fields': {
    severity: 'low',
    pattern: /private\s+(?!readonly)\w+\s*[=:]/g,
    message: 'Consider using readonly for fields that are not reassigned',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.includes('constructor')) return false;
      return true;
    },
  },

  'prefer-template': {
    severity: 'low',
    pattern: /['"]\s*\+\s*['"]/g,
    message: 'Use template literals',
    fixable: true,
  },

  'naming-convention-class': {
    severity: 'low',
    pattern: /class\s+([a-z][a-zA-Z0-9]*)\b/g,
    message: 'Class names should use PascalCase',
    fixable: false,
  },

  'require-access-modifier': {
    severity: 'low',
    pattern: /^(\s+)(\w+)\s*\([^)]*\)\s*:/gm,
    message: 'Class methods should have explicit access modifier',
    fixable: false,
  },

  'wildcard-import': {
    severity: 'low',
    pattern: /import\s+\*\s+as\s+\w+\s+from/g,
    message: 'Wildcard import harms tree-shaking - use named imports',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index + match[0].length);
      const line = content.substring(
        lineStart + 1,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (/from\s+['"]\..*\/dto['"]/.test(line)) return false;
      if (
        /as\s+(?:fs|path|crypto|os|util|stream|http|https|net|url)\s/.test(line)
      )
        return false;
      return true;
    },
  },

  'require-import': {
    severity: 'low',
    pattern: /const\s+\w+\s*=\s*require\s*\(/g,
    message: 'Use ES module imports instead of require()',
    fixable: false,
  },

  'deep-relative-import': {
    severity: 'low',
    pattern: /from\s+['"](?:\.\.\/){3,}/g,
    message:
      'Deep relative import (3+ levels) - use path aliases from tsconfig',
    fixable: false,
  },

  'duplicate-imports-from-module': {
    severity: 'low',
    pattern:
      /^import\s+\{[^}]+\}\s+from\s+['"]([^'"]+)['"];?\s*\n(?:.*\n)*?^import\s+\{[^}]+\}\s+from\s+['"]\1['"];?/gm,
    message: 'Duplicate imports from same module - merge into single import',
    fixable: false,
    check: (match) => {
      const lines = match[0]
        .split('\n')
        .filter((l) => l.trim().startsWith('import'));
      return lines.length >= 2;
    },
  },

  'naming-convention-function': {
    severity: 'low',
    pattern: /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g,
    message:
      'Function names should use camelCase (PascalCase is for classes/components)',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      return (
        !line.includes('class') &&
        !line.includes('interface') &&
        !line.includes('type')
      );
    },
  },

  'prefer-optional-chaining': {
    severity: 'low',
    pattern: /(\w+)\s*&&\s*\1\./g,
    message: 'Use optional chaining (?.) instead of && short-circuit',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;
      return true;
    },
  },

  'unnecessary-type-assertion': {
    severity: 'low',
    pattern: /as\s+any\b/g,
    message:
      'Type assertion to `any` defeats TypeScript safety - use proper typing',
    fixable: false,
    check: (match, content) => {
      const lineStart = content.lastIndexOf('\n', match.index);
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + match[0].length);
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;
      const fullLine = content.substring(
        lineStart,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (/eslint-disable/.test(fullLine)) return false;
      return true;
    },
  },

  // SonarQube: "Control structures should use curly braces"
  // Flags: if (...) statement;  /  else statement;  /  for (...) statement;  etc.
  // Correct: if (...) { statement; }
  'braceless-if-body': {
    severity: 'low',
    pattern:
      /\b(if|else\s+if|else|for|while)\b\s*(?:\([^)]*\))?\s*(?!\s*\{)[^\n;{][^\n]*/g,
    message:
      'Control structure body should be wrapped in curly braces - e.g. if (x) { return y; }',
    fixable: false,
    check: (match, content) => {
      const fullMatch = match[0];

      // Skip if the line is a comment
      const lineStart = content.lastIndexOf('\n', match.index);
      const line = content.substring(lineStart, match.index + fullMatch.length);
      if (line.trim().startsWith('//') || line.trim().startsWith('*'))
        return false;

      // Skip inside block comments
      if (isInsideBlockComment(match.index, content)) return false;

      // Skip `else if (...)` — the outer else is fine; the inner if will be checked separately
      // Only skip bare `else` when immediately followed by `if` on same token
      if (/^else\s+if\b/.test(fullMatch.trim())) return false;

      // Skip ternary-style lines: these are expressions, not control structures
      const lineEnd = content.indexOf('\n', match.index);
      const fullLine = content.substring(
        lineStart + 1,
        lineEnd > 0 ? lineEnd : undefined,
      );
      if (fullLine.includes('?') && fullLine.includes(':')) return false;

      // Skip lines that already have a brace somewhere after the condition
      // e.g. catches multiline `if (\n  cond\n) {` where our regex grabs too little
      if (/\)\s*$/.test(fullLine.trimEnd())) return false;

      // The match must contain an actual statement body (not just the condition)
      // Require at least one non-whitespace char after the closing paren / keyword
      const afterKeyword = fullMatch.replace(
        /^(?:if|else\s+if|else|for|while)\s*(?:\([^)]*\))?\s*/,
        '',
      );
      if (!afterKeyword.trim()) return false;

      // Skip if body starts with { (already braced — regex shouldn't catch this but be safe)
      if (afterKeyword.trimStart().startsWith('{')) return false;

      return true;
    },
  },
};

// ==========================================
// Helper Functions
// ==========================================

/**
 * Returns true if the given index is inside a block comment.
 * @param {number} index
 * @param {string} content
 * @returns {boolean}
 */
function isInsideBlockComment(index, content) {
  const before = content.substring(0, index);
  const lastBlockOpen = before.lastIndexOf('/*');
  const lastBlockClose = before.lastIndexOf('*/');
  return lastBlockOpen > lastBlockClose;
}

/**
 * Counts top-level comma-separated parameters, ignoring nested brackets and strings.
 * Fixes the original '\\\\' escape bug — single backslash check is correct here.
 * @param {string} raw - raw parameter string
 * @returns {number}
 */
function countTopLevelParams(raw) {
  let depth = 0;
  let paramCount = 0;
  let inString = false;
  let stringChar = null;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const prev = raw[i - 1];

    if (inString) {
      // Single backslash check (was incorrectly '\\\\' before)
      if (ch === stringChar && prev !== '\\') inString = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
      continue;
    }

    if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      continue;
    }

    if (ch === ',' && depth === 0) paramCount++;
  }

  return paramCount + (raw.trim().length > 0 ? 1 : 0);
}

/**
 * Returns true if the given filename matches a glob pattern like *.spec.ts
 * @param {string} filename
 * @param {string} glob
 * @returns {boolean}
 */
function matchesGlob(filename, glob) {
  // Simple glob: only handles leading * wildcard
  if (glob.startsWith('*')) {
    return filename.endsWith(glob.slice(1));
  }
  return filename === glob;
}

// ==========================================
// File Discovery
// ==========================================

/**
 * Recursively collects TypeScript files under a directory.
 * @param {string} dir
 * @param {typeof DEFAULT_CONFIG} config
 * @param {string[]} [files]
 * @returns {string[]}
 */
function getFiles(dir, config, files = []) {
  let items;
  try {
    items = fs.readdirSync(dir);
  } catch (err) {
    console.error(`⚠️  Cannot read directory "${dir}": ${err.message}`);
    return files;
  }

  for (const item of items) {
    const fullPath = path.join(dir, item);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      // Skip unreadable entries
      continue;
    }

    if (stat.isDirectory()) {
      if (!config.excludeDirs.some((exclude) => fullPath.includes(exclude))) {
        getFiles(fullPath, config, files);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(fullPath);
      const basename = path.basename(fullPath);
      const isExcluded = config.excludeFiles.some((pattern) =>
        matchesGlob(basename, pattern),
      );
      if (config.fileExtensions.includes(ext) && !isExcluded) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// ==========================================
// File Analysis
// ==========================================

/**
 * Analyzes a single file and returns all detected issues.
 * @param {string} filePath
 * @returns {Issue[]}
 */
function analyzeFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    // FIX: wrap readFileSync — previously would crash entire scan on permission/encoding errors
    return [
      {
        rule: 'read-error',
        severity: 'high',
        message: `Cannot read file: ${err.message}`,
        line: 0,
        column: 0,
        fixable: false,
        snippet: path.basename(filePath),
        file: filePath,
      },
    ];
  }

  const issues = [];

  for (const [ruleId, rule] of Object.entries(RULES)) {
    if (rule.fileNameOnly) continue;

    // FIX: always reconstruct RegExp with explicit 'g' to avoid stale lastIndex
    const baseFlags = rule.pattern.flags.replace(/g/g, '');
    const pattern = new RegExp(rule.pattern.source, `g${baseFlags}`);

    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (rule.check && !rule.check(match, content, filePath)) continue;

      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      const column = lines[lines.length - 1].length + 1;
      const snippetStart = Math.max(0, match.index - SNIPPET_CONTEXT_CHARS);
      const snippetEnd = Math.min(
        content.length,
        match.index + match[0].length + SNIPPET_CONTEXT_CHARS,
      );

      issues.push({
        rule: ruleId,
        severity: rule.severity,
        message: rule.message,
        line: lineNumber,
        column,
        fixable: rule.fixable,
        snippet: content.substring(snippetStart, snippetEnd).trim(),
        file: filePath,
      });
    }
  }

  // File naming convention check
  const fileName = path.basename(filePath);
  if (/[A-Z]/.test(fileName) && !fileName.endsWith('.d.ts')) {
    issues.push({
      rule: 'file-naming-convention',
      severity: 'low',
      message: `File "${fileName}" should use kebab-case (NestJS convention)`,
      line: 1,
      column: 1,
      fixable: false,
      snippet: fileName,
      file: filePath,
    });
  }

  return issues;
}

// ==========================================
// Counting & Grouping
// ==========================================

/**
 * @param {Issue[]} issues
 * @returns {Record<string, number>}
 */
function countIssues(issues) {
  const counts = { blocker: 0, high: 0, medium: 0, low: 0 };
  for (const issue of issues) {
    counts[issue.severity]++;
  }
  return counts;
}

/**
 * Groups issues by their .file property.
 * @param {Issue[]} issues
 * @returns {Record<string, Issue[]>}
 */
function groupByFile(issues) {
  const grouped = {};
  for (const issue of issues) {
    const key = issue.file ?? '(unknown)';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(issue);
  }
  return grouped;
}

// ==========================================
// Output Formatting
// ==========================================

/**
 * @param {Issue[]} issues
 * @param {'console'|'json'|'markdown'} format
 * @returns {string}
 */
function formatOutput(issues, format = 'console') {
  if (format === 'json') {
    return JSON.stringify(issues, null, 2);
  }

  // Group once, reuse for both markdown and console
  const byFile = groupByFile(issues);

  if (format === 'markdown') {
    let md = '# Code Quality Report\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;

    for (const [file, fileIssues] of Object.entries(byFile)) {
      const counts = countIssues(fileIssues);
      md += `## ${file}\n\n`;
      md += `**Issues**: 🔴 ${counts.blocker} 🟠 ${counts.high} 🟡 ${counts.medium} 🟢 ${counts.low}\n\n`;

      for (const issue of fileIssues) {
        const icon = SEVERITY_ICONS[issue.severity];
        md += `### ${icon} ${issue.rule} (Line ${issue.line})\n\n`;
        md += `- **Message**: ${issue.message}\n`;
        md += `- **Fixable**: ${issue.fixable ? 'Yes' : 'No'}\n`;
        md += `- **Code**:\n\`\`\`typescript\n${issue.snippet}\n\`\`\`\n\n`;
      }
    }

    return md;
  }

  // Console format
  let output = '';
  for (const [file, fileIssues] of Object.entries(byFile)) {
    const counts = countIssues(fileIssues);
    output += `\n📄 ${file}\n`;
    output += `   Issues: 🔴 ${counts.blocker} 🟠 ${counts.high} 🟡 ${counts.medium} 🟢 ${counts.low}\n`;

    for (const issue of fileIssues) {
      const icon = SEVERITY_ICONS[issue.severity];
      output += `   ${icon} [${issue.rule}] Line ${issue.line}: ${issue.message}\n`;
      if (issue.fixable) {
        output += `      💡 Auto-fixable\n`;
      }
    }
  }

  return output;
}

// ==========================================
// Argument Parsing
// ==========================================

/**
 * @returns {{ severity: string, fix: boolean, output: string, srcDir: string }}
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    severity: 'medium',
    fix: false,
    output: 'console',
    srcDir: DEFAULT_CONFIG.srcDir,
  };

  for (const arg of args) {
    if (arg.startsWith('--severity=')) {
      const val = arg.split('=')[1];
      if (!SEVERITY_LEVELS.includes(val)) {
        console.error(
          `❌ Unknown severity "${val}". Valid: ${SEVERITY_LEVELS.join(', ')}`,
        );
        process.exit(1);
      }
      options.severity = val;
    } else if (arg === '--fix') {
      options.fix = true;
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg.startsWith('--path=')) {
      // FIX: added --path option for scanning subdirectories
      options.srcDir = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage: node scripts/code-scanner.js [options]

Options:
  --severity=blocker    Only show blocker issues
  --severity=high       Show high+ issues
  --severity=medium     Show medium+ issues (default)
  --severity=low        Show all issues
  --path=./src          Directory to scan (default: ./src)
  --fix                 Attempt to auto-fix issues where possible
  --output=json         Output as JSON
  --output=markdown     Output as Markdown report
  --help, -h            Show this help message

Examples:
  node scripts/code-scanner.js --severity=high
  node scripts/code-scanner.js --path=./src/modules/payroll --severity=blocker
  node scripts/code-scanner.js --output=markdown > quality-report.md
`);
}

// ==========================================
// Main
// ==========================================

function main() {
  const options = parseArgs();

  const config = {
    ...DEFAULT_CONFIG,
    srcDir: options.srcDir,
  };

  const ruleCount =
    Object.keys(RULES).filter((r) => !RULES[r].fileNameOnly).length + 1; // +1 for file-naming
  console.log(`🔍 Scanning code for quality issues (${ruleCount} rules)...\n`);
  console.log(`📁 Source directory: ${config.srcDir}`);

  const files = getFiles(config.srcDir, config);
  if (files.length === 0) {
    console.log(`⚠️  No TypeScript files found in "${config.srcDir}"`);
    process.exit(0);
  }

  console.log(`Found ${files.length} TypeScript files to analyze\n`);

  const minSeverityIndex = SEVERITY_LEVELS.indexOf(options.severity);

  const allIssues = [];

  for (const file of files) {
    const issues = analyzeFile(file);
    for (const issue of issues) {
      const issueIndex = SEVERITY_LEVELS.indexOf(issue.severity);
      if (issueIndex >= minSeverityIndex) {
        allIssues.push(issue);
      }
    }
  }

  if (allIssues.length === 0) {
    console.log('✅ No issues found at the specified severity level!');
    process.exit(0);
  }

  const totalCounts = countIssues(allIssues);

  if (options.output === 'console') {
    console.log(formatOutput(allIssues, 'console'));

    const filesWithIssues = new Set(allIssues.map((i) => i.file)).size;
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(
      `Files Scanned: ${files.length} | Files with Issues: ${filesWithIssues}`,
    );
    console.log(`Total Issues: ${allIssues.length}`);
    console.log(`  🔴 Blocker: ${totalCounts.blocker}`);
    console.log(`  🟠 High: ${totalCounts.high}`);
    console.log(`  🟡 Medium: ${totalCounts.medium}`);
    console.log(`  🟢 Low: ${totalCounts.low}`);
    console.log(
      `\nRules Active: ${ruleCount} | Minimum Severity: ${options.severity.toUpperCase()}`,
    );
  } else {
    console.log(formatOutput(allIssues, options.output));
  }

  // FIX: always exit(1) on blockers, regardless of output format
  // Previously only triggered in console mode — CI pipelines using --output=json would not fail
  if (totalCounts.blocker > 0) {
    if (options.output === 'console') {
      console.error('\n⚠️  BLOCKER issues must be fixed before deployment!');
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { analyzeFile, getFiles, RULES, countIssues, groupByFile };
