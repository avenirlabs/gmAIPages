#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

const widgetPath = join(process.cwd(), 'dist/spa/giftsmate-chat.js');
const widget = readFileSync(widgetPath, 'utf-8');

console.log('Widget Analysis:');
console.log('================');
console.log(`Size: ${(widget.length / 1024).toFixed(2)} KB`);
console.log(`Has customElements.define: ${widget.includes('customElements.define')}`);
console.log(`Has GiftsmateChat: ${widget.includes('GiftsmateChat')}`);
console.log(`Has attachShadow: ${widget.includes('attachShadow')}`);
console.log(`Has React: ${widget.includes('react')}`);
console.log(`Has createRoot: ${widget.includes('createRoot')}`);

// Check for potential issues
const issues = [];

if (!widget.includes('customElements.define')) {
  issues.push('Missing custom element definition');
}

if (!widget.includes('attachShadow')) {
  issues.push('Missing Shadow DOM attachment');
}

if (widget.includes('import ') || widget.includes('export ')) {
  issues.push('Contains ES module syntax (should be IIFE)');
}

console.log(`\nPotential issues: ${issues.length === 0 ? 'None detected' : issues.join(', ')}`);

// Check the beginning of the file
console.log('\nFirst 500 chars:');
console.log(widget.substring(0, 500));