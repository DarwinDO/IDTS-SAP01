const fs = require('fs');
const path = require('path');

const dir = 'app/bug-management-ui/annotations';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.cds')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        // Replace instances where there's a comma followed by whitespace and another comma
        content = content.replace(/,\s*,/g, ',');
        // Also remove trailing comma before the closing parenthesis of annotate @(...)
        content = content.replace(/,\s*\);/g, '\n);');
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
    }
});
console.log('Fixed syntax!');
