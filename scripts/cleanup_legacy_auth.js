#!/usr/bin/env node

/**
 * Legacy Authentication Cleanup Script
 * 
 * This script helps remove legacy authentication code after migrating to Supabase Auth.
 * Run this script after confirming the Supabase migration is working correctly.
 * 
 * Usage: node scripts/cleanup_legacy_auth.js [--dry-run]
 * 
 * Options:
 *   --dry-run: Show what would be deleted without actually deleting files
 */

const fs = require('fs');
const path = require('path');

// Files and directories to remove
const LEGACY_AUTH_FILES = [
  'backend/src/middleware/auth.js',
  'backend/src/routes/auth.js',
  'backend/src/services/authService.js',
];

// Directories to clean up
const LEGACY_AUTH_DIRS = [
  // Add any directories that should be cleaned up
];

// Code patterns to remove from files
const LEGACY_PATTERNS = [
  {
    file: 'backend/src/config/env.js',
    pattern: /jwt:\s*{[\s\S]*?},\s*/g,
    replacement: '// JWT configuration removed - now using Supabase Auth\n',
  },
  {
    file: 'backend/package.json',
    pattern: /"bcryptjs":\s*"[^"]+",?\s*/g,
    replacement: '',
  },
  {
    file: 'backend/package.json',
    pattern: /"jsonwebtoken":\s*"[^"]+",?\s*/g,
    replacement: '',
  },
];

function log(message) {
  console.log(`[CLEANUP] ${message}`);
}

function logError(message) {
  console.error(`[ERROR] ${message}`);
}

function logSuccess(message) {
  console.log(`[SUCCESS] ${message}`);
}

function removeFile(filePath, dryRun = false) {
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`);
    return false;
  }

  if (dryRun) {
    log(`[DRY RUN] Would remove file: ${filePath}`);
    return true;
  }

  try {
    fs.unlinkSync(filePath);
    logSuccess(`Removed file: ${filePath}`);
    return true;
  } catch (error) {
    logError(`Failed to remove file ${filePath}: ${error.message}`);
    return false;
  }
}

function removePatternFromFile(filePath, pattern, replacement, dryRun = false) {
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(pattern, replacement);

    if (content === newContent) {
      log(`No legacy patterns found in: ${filePath}`);
      return false;
    }

    if (dryRun) {
      log(`[DRY RUN] Would update patterns in: ${filePath}`);
      return true;
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    logSuccess(`Updated patterns in: ${filePath}`);
    return true;
  } catch (error) {
    logError(`Failed to update file ${filePath}: ${error.message}`);
    return false;
  }
}

function createBackup(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const backupPath = `${filePath}.backup.${Date.now()}`;
  try {
    fs.copyFileSync(filePath, backupPath);
    logSuccess(`Created backup: ${backupPath}`);
    return true;
  } catch (error) {
    logError(`Failed to create backup for ${filePath}: ${error.message}`);
    return false;
  }
}

function cleanupLegacyAuth(dryRun = false) {
  log('Starting legacy authentication cleanup...');
  
  if (dryRun) {
    log('DRY RUN MODE - No files will be modified');
  }

  let filesRemoved = 0;
  let patternsUpdated = 0;

  // Remove legacy auth files
  for (const filePath of LEGACY_AUTH_FILES) {
    if (dryRun || createBackup(filePath)) {
      if (removeFile(filePath, dryRun)) {
        filesRemoved++;
      }
    }
  }

  // Remove legacy patterns from files
  for (const { file, pattern, replacement } of LEGACY_PATTERNS) {
    if (removePatternFromFile(file, pattern, replacement, dryRun)) {
      patternsUpdated++;
    }
  }

  // Summary
  log('\n=== CLEANUP SUMMARY ===');
  log(`Files that would be removed: ${filesRemoved}`);
  log(`Files that would be updated: ${patternsUpdated}`);
  
  if (!dryRun) {
    logSuccess('Legacy authentication cleanup completed!');
    log('\nNext steps:');
    log('1. Run `npm install` to update dependencies');
    log('2. Test the application thoroughly');
    log('3. Remove backup files if everything is working correctly');
  } else {
    log('\nTo perform the actual cleanup, run without --dry-run flag');
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  // Check if we're in the right directory
  if (!fs.existsSync('package.json') || !fs.existsSync('backend')) {
    logError('Please run this script from the project root directory');
    process.exit(1);
  }

  // Confirm cleanup (unless dry run)
  if (!dryRun) {
    log('WARNING: This will permanently remove legacy authentication code!');
    log('Make sure Supabase Auth is working correctly before proceeding.');
    log('Run with --dry-run first to see what would be changed.');
    
    // In a real scenario, you might want to add user confirmation here
    // process.stdout.write('Continue? (y/N): ');
    // const answer = process.stdin.read();
    // if (!answer || !answer.toString().trim().toLowerCase().startsWith('y')) {
    //   log('Cleanup cancelled.');
    //   process.exit(0);
    // }
  }

  cleanupLegacyAuth(dryRun);
}

if (require.main === module) {
  main();
}

module.exports = {
  cleanupLegacyAuth,
  LEGACY_AUTH_FILES,
  LEGACY_PATTERNS,
};
