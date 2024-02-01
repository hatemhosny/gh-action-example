# Preview in LiveCodes

This is a GitHub action that allows to generate links to [LiveCodes playground](https://livecodes.io) to preview code changes and save them in an artifact. This can be used to post them to the pull request as comments.

This can be useful for library authors to preview changes in the playground before merging the pull request.

![screenshot for this action](https://pbs.twimg.com/media/GFNTN7PWcAAoaTf?format=jpg&name=medium)

## Inputs

- `install-command` (Optional): Install command (e.g. npm install)
- `build-command` (Optional): Build command (e.g. npm run build)
- `base-url` (Optional): Base URL used for to link to built files using the pattern: `{{LC::TO_URL(./file.js)}}`
- `artifact` (Optional): Artifact name used to save the message (default: `pr`)
- `GITHUB_TOKEN`: Github token of the repository (default: `${{ github.token }}` - automatically created by Github)

## Outputs

- `message`: The MarkDown message with preview links (e.g. to post as comment in the PR)

## Usage

This action generates the message for the PR comment and uploads it as an artifact. It can be used in conjunction with the action `live-codes/pr-comment-from-artifact`. Two different actions are used because each runs in a different context and require different permissions. See [this article](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/) for more details.

This is an example for usage:

- This is a demo function to run in the playground:

**index.js**

```js
export const demo = () => {
  console.log("Hello, World!");
};
```

- This is a JSON file for LiveCodes project in the `.livecodes` folder. It can be either a project [configuration object](https://livecodes.io/docs/configuration/configuration-object) or a playground [embed object](https://livecodes.io/docs/sdk/js-ts#createplayground):

**.livecodes/hello-world.json**

```json
{
  "title": "JavaScript Starter",
  "markup": {
    "language": "html",
    "content": "<h1>Hello, World!</h1>"
  },
  "script": {
    "language": "javascript",
    "content": "import { demo } from './index.js';\n\ndemo();"
  },
  "imports": {
    "./index.js": "{{LC::TO_DATA_URL(./index.js)}}"
  }
}
```

Note the use of `{{LC::TO_DATA_URL(./index.js)}}` in the [imports](https://livecodes.io/docs/features/module-resolution#custom-module-resolution) property. The file `index.js` is converted to a [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs) and imported in the playground. See later for more details and other options.

- Trigger the action when a pull request is created or updated:

**.github/workflows/livecodes.yml**

```yaml
name: livecodes

on: [pull_request]

jobs:
  build_and_prepare:
    runs-on: ubuntu-latest
    name: Generate Playgrounds
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Build and generate
        uses: live-codes/preview-in-livecodes@1
        with:
          # install-command: "npm install"
          # build-command: "npm run build"
          # base-url: "https://{{LC::REF}}.my-project.pages.dev"
```

When new pull requests are created or updated, the action will run. It will optionally install dependencies and build the project. Then it looks for LiveCodes projects in the directory `.livecodes` and generates playgrounds for them. The generated message is saved as an artifact.

- Then this action, which is triggered by the successful previous workflow, downloads the artifact and posts it as a comment in the pull request, using the available permissions.

**.github/workflows/livecodes-post-comment.yml**

```yaml
name: LiveCodes Preview

on:
  workflow_run:
    workflows: ["livecodes"] # the workflow that created the artifact
    types:
      - completed

jobs:
  upload:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    if: >
      github.event.workflow_run.event == 'pull_request' &&
      github.event.workflow_run.conclusion == 'success'

    steps:
      - uses: live-codes/pr-comment-from-artifact@1
        with:
          GITHUB_TOKEN: ${{ github.token }}
```

## Using the New Code in Playgrounds
