const fs = require("fs");

const core = require("@actions/core");
const github = require("@actions/github");

try {
  const github_token = core.getInput("GITHUB_TOKEN");
  const octokit = github.getOctokit(github_token);

  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput("who-to-greet");
  console.log(`Hello ${nameToGreet}!`);
  const time = new Date().toTimeString();
  core.setOutput("time", time);

  console.log(`another, Hello ${nameToGreet}!`);
  const text = fs.readFileSync("index.txt", "utf8");
  console.log(text);
  console.log(`third, Hello ${nameToGreet}!`);
} catch (error) {
  core.setFailed(error.message);
}
