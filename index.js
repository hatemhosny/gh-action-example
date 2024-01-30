const fs = require("fs");
const { encode } = require("js-base64");
const mime = require("mime");

const core = require("@actions/core");
const github = require("@actions/github");

const args = process.argv.slice(2);
const toDataUrl = (content, type = "text/javascript") =>
  `data:${type};charset=UTF-8;base64,` + encode(content, true);

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
      const mime_type = mime.getType(fileMap[key]);
      console.log(toDataUrl(text, mime_type));
    });
  }

  const time = new Date().toTimeString();
  core.setOutput("time", time);
} catch (error) {
  core.setFailed(error.message);
}
