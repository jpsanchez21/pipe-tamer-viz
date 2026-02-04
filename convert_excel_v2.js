const xlsx = require('xlsx');
const fs = require('fs');

try {
    console.log('Reading file: data_prueba.xlsx');
    const workbook = xlsx.readFile('data_prueba.xlsx');
    const sheetName = workbook.SheetNames[0];
    console.log('First sheet found:', sheetName);
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('Total rows parsed:', data.length);
    if (data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
        fs.writeFileSync('data_prueba.json', JSON.stringify(data, null, 2));
        console.log('File written to data_prueba.json');
    } else {
        console.log('No data found in the first sheet.');
    }
} catch (error) {
    console.error('ERROR during conversion:', error.message);
    process.exit(1);
}
