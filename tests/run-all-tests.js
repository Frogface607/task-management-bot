// Test runner for all Edison Quest Bot tests
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Running All Edison Quest Bot Tests...\n');

const tests = [
  { name: 'Unit Tests', file: 'simple.test.js' },
  { name: 'Integration Tests', file: 'integration.test.js' }
];

let totalPassed = 0;
let totalTests = 0;

async function runTest(testName, testFile) {
  return new Promise((resolve) => {
    console.log(`\n📋 Running ${testName}...`);
    console.log('─'.repeat(50));
    
    const child = spawn('node', [join(__dirname, testFile)], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      console.log(output);
      if (errorOutput) {
        console.log('Errors:', errorOutput);
      }
      
      const passed = code === 0;
      if (passed) {
        console.log(`✅ ${testName} completed successfully`);
        totalPassed++;
      } else {
        console.log(`❌ ${testName} failed`);
      }
      
      totalTests++;
      resolve(passed);
    });
  });
}

async function runAllTests() {
  for (const test of tests) {
    await runTest(test.name, test.file);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Test Suites: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalTests - totalPassed}`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your bot is working perfectly! 🎉');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

runAllTests().catch(console.error);





