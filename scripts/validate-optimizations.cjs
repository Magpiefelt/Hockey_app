/**
 * Optimization Validation Script
 * Validates that all optimizations have been properly implemented
 */

const fs = require('fs');
const path = require('path');

const results = {
  timestamp: new Date().toISOString(),
  checks: [],
  passed: 0,
  failed: 0,
  warnings: 0
};

function addCheck(name, status, message, details = null) {
  const check = { name, status, message };
  if (details) check.details = details;
  results.checks.push(check);
  
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else if (status === 'warning') results.warnings++;
}

console.log('🔍 Validating Performance Optimizations...\n');

// Check 1: Verify lazy loading component exists
try {
  const lazyComponentPath = path.join(process.cwd(), 'components/HeroVideoCarouselItem.vue');
  const content = fs.readFileSync(lazyComponentPath, 'utf8');
  
  if (content.includes('IntersectionObserver') && content.includes('shouldLoadVideo')) {
    addCheck(
      'Video Lazy Loading',
      'pass',
      'HeroVideoCarouselItem implements lazy loading with IntersectionObserver'
    );
  } else {
    addCheck(
      'Video Lazy Loading',
      'fail',
      'HeroVideoCarouselItem does not implement lazy loading properly'
    );
  }
} catch (error) {
  addCheck(
    'Video Lazy Loading',
    'fail',
    'Could not verify lazy loading implementation: ' + error.message
  );
}

// Check 2: Verify poster images are being used
try {
  const lazyComponentPath = path.join(process.cwd(), 'components/HeroVideoCarouselItem.vue');
  const content = fs.readFileSync(lazyComponentPath, 'utf8');
  
  if (content.includes('posterSrc') && content.includes('<img')) {
    addCheck(
      'Video Poster Images',
      'pass',
      'Component uses poster images as placeholders'
    );
  } else {
    addCheck(
      'Video Poster Images',
      'warning',
      'Poster image implementation could be improved'
    );
  }
} catch (error) {
  addCheck(
    'Video Poster Images',
    'fail',
    'Could not verify poster image usage: ' + error.message
  );
}

// Check 3: Verify component refactoring
try {
  const heroSectionPath = path.join(process.cwd(), 'components/home/HeroSection.vue');
  const statsSectionPath = path.join(process.cwd(), 'components/home/StatsSection.vue');
  
  if (fs.existsSync(heroSectionPath) && fs.existsSync(statsSectionPath)) {
    addCheck(
      'Component Refactoring',
      'pass',
      'Hero and Stats sections extracted into separate components'
    );
  } else {
    addCheck(
      'Component Refactoring',
      'warning',
      'Some components may not be extracted yet'
    );
  }
} catch (error) {
  addCheck(
    'Component Refactoring',
    'fail',
    'Could not verify component refactoring: ' + error.message
  );
}

// Check 4: Verify lazy component composable
try {
  const composablePath = path.join(process.cwd(), 'composables/useLazyComponent.ts');
  
  if (fs.existsSync(composablePath)) {
    const content = fs.readFileSync(composablePath, 'utf8');
    if (content.includes('IntersectionObserver')) {
      addCheck(
        'Lazy Component Composable',
        'pass',
        'useLazyComponent composable created with IntersectionObserver'
      );
    } else {
      addCheck(
        'Lazy Component Composable',
        'warning',
        'Composable exists but may need improvements'
      );
    }
  } else {
    addCheck(
      'Lazy Component Composable',
      'warning',
      'useLazyComponent composable not found'
    );
  }
} catch (error) {
  addCheck(
    'Lazy Component Composable',
    'fail',
    'Could not verify composable: ' + error.message
  );
}

// Check 5: Verify video assets exist
try {
  const videosPath = path.join(process.cwd(), 'public/videos');
  const files = fs.readdirSync(videosPath);
  
  const mp4Files = files.filter(f => f.endsWith('.mp4'));
  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  
  if (mp4Files.length > 0 && jpgFiles.length > 0) {
    addCheck(
      'Video Assets',
      'pass',
      `Found ${mp4Files.length} videos and ${jpgFiles.length} poster images`,
      { videos: mp4Files.length, posters: jpgFiles.length }
    );
  } else {
    addCheck(
      'Video Assets',
      'warning',
      'Video or poster images may be missing'
    );
  }
} catch (error) {
  addCheck(
    'Video Assets',
    'fail',
    'Could not verify video assets: ' + error.message
  );
}

// Check 6: Check for console.log statements (code quality)
try {
  const filesToCheck = [
    'components/HeroVideoCarouselItem.vue',
    'components/HeroVideoCarousel.vue',
    'components/home/HeroSection.vue'
  ];
  
  let consoleLogsFound = 0;
  
  filesToCheck.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(/console\.log/g);
      if (matches) {
        consoleLogsFound += matches.length;
      }
    }
  });
  
  if (consoleLogsFound === 0) {
    addCheck(
      'Code Quality - Console Logs',
      'pass',
      'No console.log statements found in optimized components'
    );
  } else {
    addCheck(
      'Code Quality - Console Logs',
      'warning',
      `Found ${consoleLogsFound} console.log statements in optimized components`
    );
  }
} catch (error) {
  addCheck(
    'Code Quality - Console Logs',
    'warning',
    'Could not check for console.log statements: ' + error.message
  );
}

// Check 7: Verify optimization script exists
try {
  const scriptPath = path.join(process.cwd(), 'scripts/optimize-videos.sh');
  
  if (fs.existsSync(scriptPath)) {
    addCheck(
      'Video Optimization Script',
      'pass',
      'Video optimization script created for future use'
    );
  } else {
    addCheck(
      'Video Optimization Script',
      'warning',
      'Video optimization script not found'
    );
  }
} catch (error) {
  addCheck(
    'Video Optimization Script',
    'fail',
    'Could not verify optimization script: ' + error.message
  );
}

// Output results
console.log('✅ Validation Complete!\n');
console.log('📊 Summary:');
console.log(`   Passed: ${results.passed}`);
console.log(`   Failed: ${results.failed}`);
console.log(`   Warnings: ${results.warnings}`);
console.log('');

console.log('📋 Detailed Results:');
results.checks.forEach((check, index) => {
  const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
  console.log(`${index + 1}. ${icon} ${check.name}`);
  console.log(`   ${check.message}`);
  if (check.details) {
    console.log(`   Details: ${JSON.stringify(check.details)}`);
  }
  console.log('');
});

// Write results to file
fs.writeFileSync('optimization-validation.json', JSON.stringify(results, null, 2));
console.log('📝 Full results saved to: optimization-validation.json');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
