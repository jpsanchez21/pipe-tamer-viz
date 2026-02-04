const fs = require('fs');

/**
 * Intelligent parser for the user's specific SCADA CSV format.
 * Format: Fecha Hora;Pos. Bloque;Carga Gancho;Profundidad;Presion de Bomba;Torque Llave
 * Date: 1/19/2026 12:00:04 AM
 */
try {
    console.log('Starting high-fidelity data transformation...');
    const csvContent = fs.readFileSync('data_prueba.csv', 'utf8');
    const lines = csvContent.split('\n');

    const telemetry = [];

    // Headers are in lines[0]
    // Data starts at lines[1]
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Semicolon delimited
        const cols = line.split(';');
        if (cols.length < 6) continue;

        // Parse Date: 1/19/2026 12:00:04 AM
        const tsStr = cols[0];
        const timestamp = new Date(tsStr);

        if (isNaN(timestamp.getTime())) continue;

        telemetry.push({
            timestamp: timestamp.toISOString(),
            blockPosition: parseFloat(cols[1]) || 0,
            hookload: parseFloat(cols[2]) || 0,
            depth: parseFloat(cols[3]) || 0,
            pumpPressure: parseFloat(cols[4]) || 0,
            torque: parseFloat(cols[5]) || 0,
        });

        if (i % 50000 === 0) console.log(`Processed ${i} rows...`);
    }

    console.log(`Total telemetry points parsed: ${telemetry.length}`);

    // Generate TypeScript file
    const tsContent = `// Real 10-day telemetry data from field sensors
export const realTelemetry = ${JSON.stringify(telemetry, null, 2).replace(/"timestamp": "([^"]+)"/g, '"timestamp": new Date("$1")')};
`;

    // Create data directory if not exists
    if (!fs.existsSync('src/data')) fs.mkdirSync('src/data');

    fs.writeFileSync('src/data/realTelemetry.ts', tsContent);
    console.log('SUCCESS: src/data/realTelemetry.ts created.');
} catch (error) {
    console.error('CRITICAL ERROR:', error.message);
    process.exit(1);
}
