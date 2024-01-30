const fs = require("fs");
const args = process.argv.slice(2);

const core = require("@actions/core");
const github = require("@actions/github");

try {
  const fileMapInput = args[0].trim();
  if (fileMapInput) {
    const fileMap = fileMapInput
      .split(",")
      .filter(Boolean)
      .map((x) => x.trim())
      .reduce(
        (acc, cur) => ({ ...acc, [cur.split(":")[0]]: cur.split(":")[1] }),
        {}
      );

    Object.keys(fileMap).forEach((key) => {
      const text = fs.readFileSync(fileMap[key], "utf8");
      console.log(text);
    });
  }

  const time = new Date().toTimeString();
  core.setOutput("time", time);
} catch (error) {
  core.setFailed(error.message);
}
