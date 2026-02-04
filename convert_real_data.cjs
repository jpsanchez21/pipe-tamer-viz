const fs = require('fs');
const path = require('path');

// Helper to parse CSV with semicolon delimiter
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(';').map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(';');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index]?.trim() || '';
        });
        return obj;
    });
}

// Parse date in format "YYYY-MM-DD HH:MM:SS" as UTC-5 (Colombia timezone)
function parseDate(dateStr) {
    if (!dateStr) return null;
    // Add UTC-5 offset to force correct timezone interpretation
    const date = new Date(dateStr.replace(' ', 'T') + '-05:00');
    return date;
}

// Generate unique ID
let idCounter = 1;
function generateId(prefix = 'T') {
    return `${prefix}${String(idCounter++).padStart(3, '0')}`;
}

console.log('🔄 Processing real data files...\n');

// 1. Process VIAJES (Trips)
console.log('📊 Processing viajes.csv...');
const viajesData = parseCSV('viajes.csv');
const trips = viajesData.map((row, index) => {
    const startTime = parseDate(row.inicio);
    const endTime = parseDate(row.fin);

    // Map tipo to TripType
    let tripType = 'Other';
    const tipo = row.tipo?.toUpperCase();
    if (tipo && tipo.includes('RIH')) tripType = 'RIH';
    else if (tipo && tipo.includes('POOH')) tripType = 'POOH';

    // Map key type correctly from CSV
    let keyType = undefined;
    const tipoLlave = row['tipo llave'] || '';
    if (tipoLlave.includes('Hidráu') || tipoLlave.includes('Hidr')) {
        keyType = 'Llave Hidráulica';
    } else if (tipoLlave.includes('Potencia')) {
        keyType = 'Llave de Potencia';
    }

    return {
        id: generateId('TRIP'),
        name: row.actividad || `${tripType} ${index + 1}`,
        wellName: row.pozo || 'Unknown',
        deviceId: row.deviceId || '',
        type: tripType,
        actionName: row.actividad || undefined,
        pipeType: row.tipo_tuberia || 'Drill Pipe',
        keyType: keyType,
        dhToolFamily: row.dh_tool_family || undefined,
        tubingReference: row.tipo_tuberia || '',
        blockWeight: 5000, // Fixed value as requested
        startTime,
        endTime,
        status: 'auto',
        comments: '',
        originalStartTime: startTime,
        originalEndTime: endTime,
    };
}).filter(trip => trip.startTime && trip.endTime);

console.log(`✅ Processed ${trips.length} trips\n`);

// 2. Process CONEXIONES (Connections)
console.log('📊 Processing conexiones.csv...');
const conexionesData = parseCSV('conexiones.csv');

// Group connections by trip (based on activity and time proximity)
const connections = conexionesData.map((row, index) => {
    const startTime = parseDate(row.fecha_hora_inicio);
    if (!startTime) return null;

    // Calculate end time from duration (tiempo_cuna_cuna in decimal minutes)
    // CSV uses comma as decimal separator (e.g., "3,87" = 3.87 minutes, not 3 min 87 sec)
    // Note: Values like "3,87" confirm this is decimal (87 > 59 seconds)
    const durationMinutes = parseFloat((row.tiempo_cuna_cuna || '2').replace(',', '.')) || 2;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // Find matching trip
    let tripId = null;
    for (const trip of trips) {
        if (startTime >= trip.startTime && startTime <= trip.endTime) {
            tripId = trip.id;
            break;
        }
    }

    return {
        id: generateId('CON'),
        tripId: tripId || trips[0]?.id || 'TRIP001',
        activityName: row.actividad || '---',
        connectionNumber: parseInt(row.conexion) || index + 1,
        connectionType: row.tipo_conexion || 'sencillo',
        startTime,
        endTime,
        durationSeconds: durationMinutes * 60,
        timeBetweenSlips: durationMinutes, // tiempo_cuna_cuna in minutes
        depth: 0, // Not in CSV
        maxTorque: parseFloat(row.torque_aplicado) || 0,
        type: row.tipo_conexion && row.tipo_conexion.includes('BO') ? 'Break Out' : 'Make Up',
        status: 'Ok',
    };
}).filter(conn => conn !== null);

console.log(`✅ Processed ${connections.length} connections\n`);

// 3. Process PRUEBAS DE PRESIÓN (Pressure Tests)
console.log('📊 Processing pp.csv...');
const ppData = parseCSV('pp.csv');

// Group by numero_prueba to get start/end times
const ppGroups = {};
ppData.forEach(row => {
    const numero = row.numero_prueba || '1';
    const timestamp = parseDate(row.fecha_hora);
    if (!timestamp) return;

    if (!ppGroups[numero]) {
        ppGroups[numero] = {
            numero,
            pozo: row.pozo,
            actividad: row.actividad,
            deviceId: row.deviceId,
            timestamps: [],
            presiones: [],
            caudales: []
        };
    }

    ppGroups[numero].timestamps.push(timestamp);
    // Parse values ensuring comma decimal handling for Spanish CSV
    ppGroups[numero].presiones.push(parseFloat((row.presion || '0').replace(',', '.')) || 0);
    ppGroups[numero].caudales.push(parseFloat((row.caudal || '0').replace(',', '.')) || 0);
});

const pressureTests = Object.values(ppGroups).map((group, index) => {
    group.timestamps.sort((a, b) => a - b);
    const startTime = group.timestamps[0];
    const endTime = group.timestamps[group.timestamps.length - 1];
    const maxPresion = Math.max(...group.presiones);
    const maxCaudal = Math.max(...group.caudales);
    const durationMinutes = (endTime - startTime) / 1000 / 60;

    return {
        id: generateId('PP'),
        name: `Prueba de Presión ${group.numero}`,
        wellName: group.pozo || 'Unknown',
        deviceId: group.deviceId || '',
        type: 'PP',
        actionName: group.actividad || `Prueba ${group.numero}`, // Use actual activity from CSV
        pipeType: 'Tubing',
        keyType: undefined,
        dhToolFamily: undefined,
        tubingReference: '',
        startTime: startTime,
        endTime: endTime,
        durationSeconds: (endTime - startTime) / 1000,
        connections: [],

        // Custom fields for Pressure Test Table
        testNumber: group.numero,
        maxPressure: maxPresion,
        maxFlow: maxCaudal,
        durationText: `${Math.floor(durationMinutes)}:${Math.round((durationMinutes % 1) * 60).toString().padStart(2, '0')} min`
    };
});

console.log(`✅ Processed ${pressureTests.length} pressure tests\n`);

// 4. Combine all trips
const allTrips = [...trips, ...pressureTests].sort((a, b) => a.startTime - b.startTime);

// Assign connections to trips
allTrips.forEach(trip => {
    trip.connections = connections.filter(conn => conn.tripId === trip.id);
});

// 5. Generate TypeScript output
const tsOutput = `// Real trips data generated from CSV files
// Generated on: ${new Date().toISOString()}

import { PipeTrip } from '@/types/trip';

export const realTrips: PipeTrip[] = ${JSON.stringify(allTrips, null, 2)
        .replace(/"(\d{4}-\d{2}-\d{2}T[^"]+)"/g, 'new Date("$1")')};
`;

fs.writeFileSync('src/data/realTrips.ts', tsOutput);

console.log('✅ Generated src/data/realTrips.ts');
console.log(`\n📊 Summary:`);
console.log(`   - Total Trips: ${allTrips.length}`);
console.log(`   - RIH: ${allTrips.filter(t => t.type === 'RIH').length}`);
console.log(`   - POOH: ${allTrips.filter(t => t.type === 'POOH').length}`);
console.log(`   - Other: ${allTrips.filter(t => t.type === 'Other').length}`);
console.log(`   - Pressure Tests: ${pressureTests.length}`);
console.log(`   - Total Connections: ${connections.length}`);
console.log('\n✨ Conversion complete!');
