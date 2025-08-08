self.onmessage = function(e) {
  const { type, text } = e.data || {};
  if (type !== 'parse') return;
  try {
    const data = parseCSV(text || '');
    self.postMessage({ type: 'parsed', data });
  } catch (err) {
    self.postMessage({ type: 'error', error: (err && err.message) || String(err) });
  }
};

function parseCSV(csvText) {
  if (!csvText || csvText.trim().length === 0) return [];
  csvText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }

    i++;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map(header => header.replace(/^"|"$/g, '').trim());

  const data = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const rowObj = {};
    const values = rows[rowIndex];
    headers.forEach((header, colIndex) => {
      let value = values[colIndex] || '';
      if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (typeof value === 'string') {
        value = value.replace(/""/g, '"');
      }
      rowObj[header] = value;
    });
    data.push(rowObj);
  }

  return data;
}