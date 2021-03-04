const fs = require('fs');

module.exports = {
  roots: ['<rootDir>/test'],
  setupFiles: [returnIfExists('./jest.env.dev.js')].filter(t => !!t),
  moduleFileExtensions: ['js', 'json', 'node'],
};

function returnIfExists(filePath) {
  if (fs.existsSync(filePath))
    return filePath;
  else
    return null;
}
