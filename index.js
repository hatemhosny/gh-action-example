const fs = require("fs");
const path = require("path");
const { encode } = require("js-base64");
const mime = require("mime");

const core = require("@actions/core");
const { getPlaygroundUrl } = require("livecodes");

const sha = process.env.SHA || "";

const rootDir = ".livecodes";

const filesToDataUrls = (str) => {
  const pattern =
    /{{\s*LIVECODES::TO_URL\(['"]?(?:\.[\/\\])?([^\)'"]+)['"]?\)\s*}}/g;
  return str.replace(pattern, (match, file) => {
    console.log("file", file);
    const content = fs.readFileSync(path.resolve(file), "utf8");
    return content ? toDataUrl(content, "text/javascript") : match;
  });
};

const getProjects = () => {
  const files = fs.readdirSync(rootDir);
  return files
    .map((file) => {
      try {
        const path = `${rootDir}/${file}`;
        const content = fs.readFileSync(path, "utf8");
        const contentWithUrls = filesToDataUrls(content);
        const options = JSON.parse(contentWithUrls);
        const isConfig = !Object.keys(options).find((key) =>
          [
            "appUrl",
            "config",
            "params",
            "import",
            "template",
            "view",
            "lite",
            "loading",
          ].includes(key)
        );
        return isConfig ? { config: options } : options;
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
              [`${
                cur.config?.title ||
                getStarterTitle(cur.template) ||
                removeExtension(files[idx])
              }`]: cur,
            },
      {}
    );
};

const toDataUrl = (content, type) =>
  `data:${type};charset=UTF-8;base64,` + encode(content, true);

const removeExtension = (path) => path.split(".").slice(0, -1).join(".");

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const getStarterTitle = (name) =>
  !name ? "" : name.split("-").map(capitalize).join(" ") + " Template";

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

**Latest commit:** ${sha}

|  Project | Link |
|:-:|------------------------|
${projectsMarkDown.join("\n")}
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

  const projectOptions = getProjects();
  if (Object.keys(projectOptions).length === 0) {
    console.error(`No configuration files found in ${rootDir}.`);
  }

  const projects = Object.keys(projectOptions).map((key) => {
    const options = projectOptions[key];
    const playgroundUrl = getPlaygroundUrl(options);
    return { title: key, url: playgroundUrl };
  });

  const message = generateOutput(projects);
  core.setOutput("message", message);

  const fileList = ["dist/index.txt"];

  fileList.forEach((file) => {
    const text = fs.readFileSync(file, "utf8");
    const mime_type = mime.getType(file) || "text/javascript";
    console.log(toDataUrl(text, mime_type));
  });
} catch (error) {
  core.setFailed(error.message);
}
