const replace = require("replace-in-file");
let oldVersion = require("../package.json").oldVersion;
const version = require("../package.json").version;

if (!oldVersion) {
  oldVersion = "##VersionReplace";
}

const options = {
  files: "src/version.ts",
  from: oldVersion,
  to: version
};

try {
  const results = replace.sync(options);
  console.log("Replacement results:", results);
} catch (error) {
  console.error("Error occurred:", error);
}
