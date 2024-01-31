const fs = require("fs");
const { encode } = require("js-base64");
const mime = require("mime");

const core = require("@actions/core");
const github = require("@actions/github");
const { getPlaygroundUrl } = require("livecodes");

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
    .reduce(
      (acc, cur, idx) =>
        !cur
          ? acc
          : {
              ...acc,
              [`${cur.title || removeExtension(files[idx])}`]: cur,
            },
      {}
    );
  return configs;
};

const removeExtension = (path) => path.split(".").slice(0, -1).join(".");

try {
  if (!fs.existsSync(rootDir)) {
    console.error(`Directory ${rootDir} does not exist.`);
  }

  const configs = getConfigs();
  if (Object.keys(configs).length === 0) {
    console.error(`No configuration files found in ${rootDir}.`);
  }

  Object.keys(configs).forEach((key) => {
    const config = configs[key];
    const playgroundUrl = getPlaygroundUrl({
      config,
    });
    console.log(key, playgroundUrl);
  });

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
