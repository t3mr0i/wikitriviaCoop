const fs = require('fs');

// Read the file content
const fileContent = fs.readFileSync('public/items.json', 'utf8');

// Split the content by closing braces and filter out empty strings
const items = fileContent
  .split('}')
  .map(item => item.trim())
  .filter(item => item.length > 0)
  .map(item => item + '}');

// Parse each item and collect valid JSON objects
const validItems = items
  .map(item => {
    try {
      return JSON.parse(item);
    } catch (e) {
      return null;
    }
  })
  .filter(item => item !== null);

// Write the properly formatted JSON array
fs.writeFileSync('public/items.json', JSON.stringify(validItems, null, 2)); 