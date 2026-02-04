import xlsx from 'xlsx';
import fs from 'fs';

try {
    const workbook = xlsx.readFile('data_prueba.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    fs.writeFileSync('data_prueba.json', JSON.stringify(data, null, 2));
    console.log('Conversion successful. Created data_prueba.json');
} catch (error) {
    console.error('Error during conversion:', error);
}
