const fs = require('fs');
const path = require('path');

const sourceFile = 'app/bug-management-ui/annotations.cds';
const outDir = 'app/bug-management-ui/annotations';

const lines = fs.readFileSync(sourceFile, 'utf8').split(/\r?\n/);

function getLines(start, end) {
    // 1-based inclusive start, inclusive end
    return lines.slice(start - 1, end).join('\n') + '\n';
}

function writeFile(name, content) {
    const filePath = path.join(outDir, name);
    const header = "using BugService as service from '../../../srv/service';\n\n";
    fs.writeFileSync(filePath, header + content, 'utf8');
}

// 1. capabilities.cds
let capContent = "annotate service.Bugs with @(\n" + getLines(4, 31) + ");\n";
writeFile('capabilities.cds', capContent);

// 2. list-report.cds
let lrContent = "annotate service.Bugs with @(\n" + getLines(106, 130) + ",\n" + getLines(249, 265) + ");\n";
writeFile('list-report.cds', lrContent);

// 3. object-page.cds
let opContent = "annotate service.Bugs with @(\n" + getLines(32, 43) + ",\n" + getLines(131, 248) + ",\n" + getLines(266, 300) + ",\n" + getLines(347, 353) + ");\n";
writeFile('object-page.cds', opContent);

// 4. actions.cds
let actContent = "annotate service.Bugs with @(\n" + getLines(44, 105) + ",\n" + getLines(354, 369) + ");\n\n";
actContent += getLines(949, 1251) + "\n";
actContent += getLines(1356, 1366) + "\n";
writeFile('actions.cds', actContent);

// 5. labels.cds
let lblContent = getLines(373, 402) + "\n" + getLines(404, 404) + "\n";
writeFile('labels.cds', lblContent);

// 6. value-helps.cds
let vhContent = getLines(406, 660) + "\n" + getLines(662, 755) + "\n" + getLines(1253, 1308) + "\n" + getLines(1333, 1354) + "\n";
writeFile('value-helps.cds', vhContent);

// 7. ownership-assignment.cds
let oaContent = "annotate service.Bugs with @(\n" + getLines(301, 346) + ");\n\n";
oaContent += getLines(757, 789) + "\n" + getLines(1309, 1331) + "\n";
writeFile('ownership-assignment.cds', oaContent);

// 8. history-notifications.cds
let hnContent = getLines(791, 813) + "\n" + getLines(814, 842) + "\n" + getLines(843, 868) + "\n" + getLines(869, 905) + "\n";
hnContent += getLines(906, 935) + "\n" + getLines(936, 947) + "\n";
writeFile('history-notifications.cds', hnContent);

// Now overwrite annotations.cds
const mainContent = `using BugService as service from '../../srv/service';

using from './annotations/capabilities';
using from './annotations/labels';
using from './annotations/value-helps';
using from './annotations/list-report';
using from './annotations/object-page';
using from './annotations/actions';
using from './annotations/ownership-assignment';
using from './annotations/history-notifications';
`;

fs.writeFileSync(sourceFile, mainContent, 'utf8');

console.log('Split complete!');
