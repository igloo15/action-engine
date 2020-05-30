const { gitDescribeSync } = require('git-describe');
const editJsonFile = require('edit-json-file');
const Glob = require('glob');

const gitInfo = gitDescribeSync(__dirname+"/..");
let version = gitInfo.semver.version;
let dateString = `${new Date().toDateString()}`;

if(gitInfo.distance > 0) {
    version = gitInfo.semver.major+"."+(gitInfo.semver.minor+1)+".0"+"-dev."+gitInfo.distance;
}

console.log(`New Version: ${version}`);
console.log(`Current Date: ${dateString}`);

var mg = Glob.sync(__dirname+"/../**/package.json", {ignore:"**/node_modules/**"});

for(var i = 0; i < mg.length; i++) {
    const pkg = editJsonFile(mg[i]);
    const oldVersion = pkg.get("version");
    if(oldVersion !== version) {
        console.log(`Updating File: ${mg[i]}`);
        pkg.set("version", version);
        pkg.set("date", dateString);
        console.log(`Updating: ${oldVersion} -> ${version}`);
        pkg.save();
    } else {
        console.log(`File already up to date - ${mg[i]}`);
    }
}

console.log(`${mg.length} package.json files updated`);