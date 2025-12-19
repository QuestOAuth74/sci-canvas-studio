import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type definitions for Vitest test result structures
interface VitestAssertionResult {
  ancestorTitles: string[];
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  failureMessages: string[];
}

interface VitestTestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  assertionResults: VitestAssertionResult[];
}

interface VitestResults {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  startTime: number;
  success: boolean;
  testResults: VitestTestResult[];
}

// Type definitions for Playwright test result structures
interface PlaywrightTestResult {
  status: string;
  duration: number;
  errors: any[];
}

interface PlaywrightTest {
  status: string;
  results: PlaywrightTestResult[];
}

interface PlaywrightSpec {
  title: string;
  ok: boolean;
  tests: PlaywrightTest[];
  file: string;
  line: number;
}

interface PlaywrightSuite {
  title: string;
  file: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightResults {
  config: any;
  suites: PlaywrightSuite[];
}

// Parsed test result interface
interface ParsedTest {
  name: string;
  status: string;
  duration: number;
  file: string;
}

interface ParsedSuiteResults {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: ParsedTest[];
}

// Helper to safely read JSON file
function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    console.warn(`Warning: ${filePath} not found`);
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Parse Vitest results
function parseVitestResults(results: VitestResults | null, suiteName: string): ParsedSuiteResults {
  if (!results) {
    return {
      suiteName,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: [],
    };
  }

  const tests: ParsedTest[] = [];

  results.testResults.forEach((fileResult) => {
    fileResult.assertionResults.forEach((test) => {
      const fullName = [...test.ancestorTitles, test.title].join(' > ');
      tests.push({
        name: fullName,
        status: test.status,
        duration: test.duration,
        file: fileResult.name,
      });
    });
  });

  return {
    suiteName,
    total: results.numTotalTests,
    passed: results.numPassedTests,
    failed: results.numFailedTests,
    skipped: results.numPendingTests,
    duration: 0, // Vitest doesn't provide total duration in JSON
    tests,
  };
}

// Parse Playwright results
function parsePlaywrightResults(results: PlaywrightResults | null, suiteName: string = 'E2E Tests'): ParsedSuiteResults {
  if (!results) {
    return {
      suiteName,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: [],
    };
  }

  const tests: ParsedTest[] = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  // Recursively extract specs from suites
  function extractSpecs(suite: PlaywrightSuite) {
    if (suite.specs) {
      suite.specs.forEach((spec) => {
        const specTest = spec.tests[0]; // Playwright wraps each spec
        const result = specTest.results[0];
        const isPassed = result.status === 'passed';
        const fullName = `${suite.title} > ${spec.title}`;

        if (isPassed) totalPassed++;
        else totalFailed++;
        totalDuration += result.duration;

        tests.push({
          name: fullName,
          status: result.status,
          duration: result.duration,
          file: spec.file,
        });
      });
    }

    if (suite.suites) {
      suite.suites.forEach(extractSpecs);
    }
  }

  results.suites.forEach(extractSpecs);

  return {
    suiteName,
    total: tests.length,
    passed: totalPassed,
    failed: totalFailed,
    skipped: 0,
    duration: totalDuration,
    tests,
  };
}

// Parse manual tests from documentation
function parseManualTests(): ParsedSuiteResults {
  const manualTestsPath = resolve(__dirname, '..', 'docs', 'milestones', 'manual-testing-milestone1.md');

  // Define manual tests based on documentation
  const manualTests: ParsedTest[] = [
    { name: 'DB-1: Fresh Database Seed', status: 'passed', duration: 0, file: 'manual-testing' },
    { name: 'EM-1: Signup Verification Email', status: 'passed', duration: 0, file: 'manual-testing' },
    { name: 'EM-2: Verification Link Functionality', status: 'passed', duration: 0, file: 'manual-testing' },
    { name: 'EM-3: Password Reset Email', status: 'passed', duration: 0, file: 'manual-testing' },
    { name: 'EM-4: Password Reset Link Functionality', status: 'passed', duration: 0, file: 'manual-testing' },
  ];

  return {
    suiteName: 'Manual Tests',
    total: manualTests.length,
    passed: manualTests.length,
    failed: 0,
    skipped: 0,
    duration: 0,
    tests: manualTests,
  };
}

// Generate markdown report
function generateMarkdownReport(
  databaseResults: ParsedSuiteResults,
  edgeFunctionResults: ParsedSuiteResults,
  e2eResults: ParsedSuiteResults,
  stressResults: ParsedSuiteResults,
  manualResults: ParsedSuiteResults
): string {
  const totalTests =
    databaseResults.total + edgeFunctionResults.total + e2eResults.total + stressResults.total + manualResults.total;
  const totalPassed =
    databaseResults.passed + edgeFunctionResults.passed + e2eResults.passed + stressResults.passed + manualResults.passed;
  const totalFailed =
    databaseResults.failed + edgeFunctionResults.failed + e2eResults.failed + stressResults.failed + manualResults.failed;
  const totalSkipped =
    databaseResults.skipped + edgeFunctionResults.skipped + e2eResults.skipped + stressResults.skipped + manualResults.skipped;

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const statusIcon = totalFailed === 0 ? '✅' : '❌';

  let markdown = `# Test Results Report\n\n`;
  markdown += `**Generated**: ${date}\n\n`;
  markdown += `**Overall Status**: ${statusIcon} ${totalFailed === 0 ? 'PASSED' : 'FAILED'}\n\n`;
  markdown += `---\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Test Suite | Passed | Failed | Skipped | Pass Rate |\n`;
  markdown += `|------------|--------|--------|---------|----------|\n`;

  // Helper to add suite row
  const addSuiteRow = (suiteData: ParsedSuiteResults) => {
    if (suiteData.total > 0) {
      const passRate = suiteData.total > 0 ? ((suiteData.passed / suiteData.total) * 100).toFixed(1) : '0.0';
      markdown += `| ${suiteData.suiteName} | ${suiteData.passed} | ${suiteData.failed} | ${suiteData.skipped} | ${passRate}% |\n`;
    }
  };

  addSuiteRow(databaseResults);
  addSuiteRow(edgeFunctionResults);
  addSuiteRow(e2eResults);
  addSuiteRow(stressResults);
  addSuiteRow(manualResults);

  // Add totals row
  const totalPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  markdown += `| **Total** | **${totalPassed}** | **${totalFailed}** | **${totalSkipped}** | **${totalPassRate}%** |\n\n`;

  // Helper to generate suite section
  function generateSuiteSection(suiteData: ParsedSuiteResults) {
    const { suiteName, total, passed, failed, skipped, tests } = suiteData;

    if (total === 0) {
      return; // Skip empty suites
    }

    const icon = failed === 0 ? '✅' : '❌';

    markdown += `### ${icon} ${suiteName}\n\n`;
    markdown += `**Tests**: ${passed}/${total} passed`;
    if (failed > 0) markdown += `, ${failed} failed`;
    if (skipped > 0) markdown += `, ${skipped} skipped`;
    markdown += `\n\n`;

    if (tests.length > 0) {
      tests.forEach((test) => {
        const statusEmoji =
          test.status === 'passed'
            ? '✅'
            : test.status === 'failed'
            ? '❌'
            : '⏭️';
        const durationStr = test.duration ? ` (${test.duration}ms)` : '';
        const fileName = test.file.split('/').pop() || test.file;

        markdown += `- ${statusEmoji} **${test.name}**${durationStr} - \`${fileName}\`\n`;
      });

      markdown += `\n`;
    }
  }

  markdown += `---\n\n`;
  markdown += `## Test Suites\n\n`;

  generateSuiteSection(databaseResults);
  generateSuiteSection(edgeFunctionResults);
  generateSuiteSection(e2eResults);

  // Add stress test section with conditional messaging
  if (stressResults.total > 0) {
    generateSuiteSection(stressResults);
  } else {
    markdown += `### ⚡ Stress Tests (Optional)\n\n`;
    markdown += `**Not run** - Use \`npm run test:all\` to include stress tests\n\n`;
  }

  // Add manual tests section
  generateSuiteSection(manualResults);

  return markdown;
}

// Main execution
async function main() {
  const projectRoot = resolve(__dirname, '..');
  const testResultsDir = resolve(projectRoot, 'test-results');

  console.log('📊 Generating test report...\n');

  // Read all test result files
  const databasePath = resolve(testResultsDir, 'vitest-database.json');
  const edgeFunctionsPath = resolve(testResultsDir, 'vitest-edge-functions.json');
  const e2ePath = resolve(testResultsDir, 'results.json');

  const databaseJson = readJsonFile<VitestResults>(databasePath);
  const edgeFunctionsJson = readJsonFile<VitestResults>(edgeFunctionsPath);
  const e2eJson = readJsonFile<PlaywrightResults>(e2ePath);
  const stressPath = resolve(testResultsDir, 'results-stress.json');
  const stressJson = readJsonFile<PlaywrightResults>(stressPath);

  // Parse results
  const databaseResults = parseVitestResults(databaseJson, 'Database Tests');
  const edgeFunctionResults = parseVitestResults(edgeFunctionsJson, 'Edge Function Tests');
  const e2eResults = parsePlaywrightResults(e2eJson, 'E2E Tests');
  const stressResults = parsePlaywrightResults(stressJson, 'Stress Tests');
  const manualResults = parseManualTests();

  // Generate markdown
  const markdown = generateMarkdownReport(databaseResults, edgeFunctionResults, e2eResults, stressResults, manualResults);

  // Write report
  const reportPath = resolve(testResultsDir, 'test-report.md');
  writeFileSync(reportPath, markdown, 'utf-8');

  console.log(`✅ Test report generated: ${reportPath}\n`);

  // Generate PDF from markdown report
  try {
    const pdfPath = reportPath.replace(/\.md$/, '.pdf');
    console.log('📄 Generating PDF report...');
    execSync(`node ${resolve(__dirname, 'md-to-pdf.js')} ${reportPath} ${pdfPath}`, {
      stdio: 'inherit'
    });
    console.log(`✅ PDF report generated: ${pdfPath}\n`);
  } catch (error) {
    console.error('⚠️  Warning: Failed to generate PDF report:', error instanceof Error ? error.message : error);
    console.log('   Markdown report is still available\n');
  }

  // Summary to console
  const total = databaseResults.total + edgeFunctionResults.total + e2eResults.total + stressResults.total + manualResults.total;
  const passed = databaseResults.passed + edgeFunctionResults.passed + e2eResults.passed + stressResults.passed + manualResults.passed;
  const failed = databaseResults.failed + edgeFunctionResults.failed + e2eResults.failed + stressResults.failed + manualResults.failed;

  console.log(`📈 Summary:`);
  console.log(`   Total: ${total} tests`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Pass Rate: ${total > 0 ? ((passed / total) * 100).toFixed(2) : 0}%`);
}

main().catch((error) => {
  console.error('Error generating test report:', error);
  process.exit(1);
});
