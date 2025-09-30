#!/usr/bin/env node
/**
 * Test script to check if Python HF integration is working
 */

const { spawn } = require('child_process');
const path = require('path');

function testPythonHF() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'python-hf-rag.py');
    const pythonProcess = spawn('python3', [scriptPath, 'Tell me about emergency funds']);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python process exit code: ${code}`);
      console.log(`STDOUT: ${output}`);
      console.log(`STDERR: ${errorOutput}`);
      
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError}`));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Python script timeout'));
    }, 10000);
  });
}

async function main() {
  console.log('🧪 Testing Python HF integration...');
  
  try {
    const result = await testPythonHF();
    console.log('✅ Python HF integration working:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Python HF integration failed:');
    console.log(error.message);
  }
}

main();
