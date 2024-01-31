const fs = require("fs");
const { encode } = require("js-base64");
const mime = require("mime");

const core = require("@actions/core");
const github = require("@actions/github");

const rootDir = ".livecodes";
const args = process.argv.slice(2);

const toDataUrl = (content, type) =>
  `data:${type};charset=UTF-8;base64,` + encode(content, true);

const getConfigs = () => {
  const files = fs.readdirSync(rootDir);
  const configs = files
    .map((file) => {
      try {
        const path = `${rootDir}/${file}`;
        const content = fs.readFileSync(path, "utf8");
        const config = JSON.parse(content);
        return config;
      } catch (error) {
        console.error(error);
        return;
      }
    })
    .filter(Boolean);
  return configs;
};

try {
  if (!fs.existsSync(rootDir)) {
    console.error(`Directory ${rootDir} does not exist.`);
    throw new Error(`Directory ${rootDir} does not exist.`);
  }

  const configs = getConfigs();
  console.log(configs);

  const fileList =
    args[0]
      ?.split(",")
      .map((x) => x.trim())
      .filter(Boolean) || [];

  fileList.forEach((file) => {
    const text = fs.readFileSync(file, "utf8");
    const mime_type = mime.getType(file) || "text/javascript";
    console.log(toDataUrl(text, mime_type));
  });

  const time = new Date().toTimeString();
  core.setOutput("time", time);
} catch (error) {
  core.setFailed(error.message);
}
