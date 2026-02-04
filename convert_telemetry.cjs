const fs = require('fs');

console.log('🔄 Converting data_prueba.csv to TypeScript...\n');

// Read CSV file
const content = fs.readFileSync('data_prueba.csv', 'utf-8');
const lines = content.trim().split('\n');

// Parse header
const headers = lines[0].split(';').map(h => h.trim());
console.log('📋 CSV Columns:', headers);

// Parse data rows
let processedCount = 0;
const dataPoints = [];

for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');

    try {
        // Parse timestamp: "5/12/2025 0:00" to Date
        const dateStr = values[0]?.trim();
        if (!dateStr) continue;

        // Convert from "DD/MM/YYYY HH:MM" to ISO format with UTC-5 offset
        const parts = dateStr.split(' ');
        const dateParts = parts[0].split('/');
        const timeParts = parts[1]?.split(':') || ['0', '0'];

        // Build ISO string with UTC-5 offset: YYYY-MM-DDTHH:MM:SS-05:00
        const year = dateParts[2];
        const month = String(dateParts[1]).padStart(2, '0');
        const day = String(dateParts[0]).padStart(2, '0');
        const hour = String(timeParts[0]).padStart(2, '0');
        const minute = String(timeParts[1]).padStart(2, '0');

        const isoString = `${year}-${month}-${day}T${hour}:${minute}:00-05:00`;
        const timestamp = new Date(isoString);

        if (isNaN(timestamp.getTime())) {
            console.warn(`⚠️ Invalid date at line ${i}: ${dateStr}`);
            continue;
        }

        // Map columns to sensor data
        const dataPoint = {
            timestamp,
            blockPosition: parseFloat(values[1]) || 0,
            hookload: parseFloat(values[2]) || 0,
            depth: parseFloat(values[3]) || 0,
            torque: parseFloat(values[4]) || 0,
            pumpPressure: parseFloat(values[5]) || 0,
        };

        dataPoints.push(dataPoint);
        processedCount++;

        // Progress indicator
        if (processedCount % 10000 === 0) {
            console.log(`   Processed ${processedCount} rows...`);
        }
    } catch (error) {
        console.warn(`⚠️ Error parsing line ${i}:`, error.message);
    }
}

console.log(`\n✅ Total rows processed: ${processedCount}\n`);

// Sort by timestamp
dataPoints.sort((a, b) => a.timestamp - b.timestamp);

console.log(`📅 Date range:`);
console.log(`   Start: ${dataPoints[0].timestamp.toISOString()}`);
console.log(`   End: ${dataPoints[dataPoints.length - 1].timestamp.toISOString()}`);

// Generate TypeScript file
const tsOutput = `// Real telemetry data from data_prueba.csv
// Generated on: ${new Date().toISOString()}
// Total data points: ${processedCount}

import { SensorDataPoint } from '@/types/trip';

export const realTelemetry: SensorDataPoint[] = ${JSON.stringify(dataPoints, null, 2)
        .replace(/"(\d{4}-\d{2}-\d{2}T[^"]+)"/g, 'new Date("$1")')};
`;

fs.writeFileSync('src/data/realTelemetry.ts', tsOutput);

console.log(`\n✅ Generated src/data/realTelemetry.ts`);
console.log(`   File size: ${(tsOutput.length / 1024 / 1024).toFixed(2)} MB`);
console.log('\n✨ Conversion complete!');
