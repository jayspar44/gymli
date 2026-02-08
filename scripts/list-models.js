#!/usr/bin/env node

/**
 * Lists available Google Gemini AI models
 * Reads API key from backend/.env
 *
 * Usage: npm run list-models
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in backend/.env');
    process.exit(1);
  }

  console.log('Fetching available models...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('API Error:', data.error);
      return;
    }

    if (data.models) {
      console.log('\nAvailable Gemini Models:');
      data.models.forEach(m => {
        if (m.name.includes('gemini') || m.name.includes('flash')) {
          console.log(`- ${m.name} (${m.displayName})`);
        }
      });
      console.log('\nTo use a model, remove "models/" prefix in the SDK.');
    } else {
      console.log('No models found. Response:', data);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
    process.exit(1);
  }
}

listModels();
