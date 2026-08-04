const fs = require('fs');
const path = require('path');
const search = 'https://fly-15d-wings.15dwingsltd.workers.dev';
const replace = 'https://edgecluster.15dwings.com.ng';
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fileDir = path.join(dir, file);
    const stat = fs.statSync(fileDir);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fileDir));
    } else {
      results.push(fileDir);
    }
  });
  return results;
}
walk('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts')).forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(search)) {
    content = content.split(search).join(replace);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
