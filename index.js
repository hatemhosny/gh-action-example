const fs = require("fs");
const { encode } = require("js-base64");
const mime = require("mime");

const core = require("@actions/core");
const { getPlaygroundUrl } = require("livecodes");

const sha = process.env.SHA || "";
console.log("sha", sha);

const rootDir = ".livecodes";

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

const trimLongUrl = (url, max) => {
  if (url.length > max) {
    return url.slice(0, max) + "...";
  }
  return url;
};

const generateOutput = (projects) => {
  const projectsMarkDown = projects.map(
    (project) =>
      `| **${project.title}** | [${trimLongUrl(project.url, 50)}](${
        project.url
      }) |`
  );

  return `
## <a href="https://livecodes.io"><img alt="LiveCodes logo" src="https://livecodes.io/livecodes/assets/images/livecodes-logo.svg" width="32"></a> Preview in <a href="https://livecodes.io">LiveCodes</a>!

**Latest commit:** \`${sha}\`

|  Project | Link |
|:-:|------------------------|
${projectsMarkDown.join("\\n")}
<!-- 
---

_See the [documentations](https://livecodes.io/?x=code/ksjdhfkhdghdg...) for more details._

-->
  `;
};

try {
  if (!fs.existsSync(rootDir)) {
    console.error(`Directory ${rootDir} does not exist.`);
  }

  const configs = getConfigs();
  if (Object.keys(configs).length === 0) {
    console.error(`No configuration files found in ${rootDir}.`);
  }

  const projects = Object.keys(configs).map((key) => {
    const config = configs[key];
    const playgroundUrl = getPlaygroundUrl({
      config,
    });
    return { title: key, url: playgroundUrl };
  });
  console.log(projects);
  core.setOutput("message", generateOutput(projects));

  const fileList = ["dist/index.txt"];

  fileList.forEach((file) => {
    const text = fs.readFileSync(file, "utf8");
    const mime_type = mime.getType(file) || "text/javascript";
    console.log(toDataUrl(text, mime_type));
  });
} catch (error) {
  core.setFailed(error.message);
}
