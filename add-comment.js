async function run(issue_number, message) {
  const REACTIONS = [
    "+1",
    "-1",
    "laugh",
    "confused",
    "heart",
    "hooray",
    "rocket",
    "eyes",
  ];
  try {
    const comment_tag = `<!-- livecodes/thollander/actions-comment-pull-request -->`;
    const reactions = "";
    const mode = "upsert";
    const create_if_not_exists = true;

    if (!message) {
      core.setFailed('"message" should be provided as input');
      return;
    }

    let content = message;

    if (!issue_number) {
      core.setFailed(
        "No issue/pull request in input neither in current context."
      );
      return;
    }

    async function addReactions(comment_id, reactions) {
      const validReactions = reactions
        .replace(/\s/g, "")
        .split(",")
        .filter((reaction) => REACTIONS.includes(reaction));

      await Promise.allSettled(
        validReactions.map(async (content) => {
          await github.reactions.createForIssueComment({
            ...context.repo,
            comment_id,
            content,
          });
        })
      );
    }

    async function createComment({ owner, repo, issue_number, body }) {
      const { data: comment } = await github.issues.createComment({
        owner,
        repo,
        issue_number,
        body,
      });

      core.setOutput("id", comment.id);
      core.setOutput("body", comment.body);
      core.setOutput("html_url", comment.html_url);

      await addReactions(comment.id, reactions);

      return comment;
    }

    async function updateComment({ owner, repo, comment_id, body }) {
      const { data: comment } = await github.issues.updateComment({
        owner,
        repo,
        comment_id,
        body,
      });

      core.setOutput("id", comment.id);
      core.setOutput("body", comment.body);
      core.setOutput("html_url", comment.html_url);

      await addReactions(comment.id, reactions);

      return comment;
    }

    async function deleteComment({ owner, repo, comment_id }) {
      const { data: comment } = await github.issues.deleteComment({
        owner,
        repo,
        comment_id,
      });

      return comment;
    }

    const comment_tag_pattern = comment_tag;
    const body = comment_tag_pattern
      ? `${content}\n${comment_tag_pattern}`
      : content;

    if (comment_tag_pattern) {
      let comment;
      for await (const { data: comments } of github.paginate.iterator(
        github.issues.listComments,
        {
          ...context.repo,
          issue_number,
        }
      )) {
        comment = comments.find((comment) =>
          comment?.body?.includes(comment_tag_pattern)
        );
        if (comment) break;
      }

      if (comment) {
        if (mode === "upsert") {
          await updateComment({
            ...context.repo,
            comment_id: comment.id,
            body,
          });
          return;
        } else if (mode === "recreate") {
          await deleteComment({
            ...context.repo,
            comment_id: comment.id,
          });

          await createComment({
            ...context.repo,
            issue_number,
            body,
          });
          return;
        } else if (mode === "delete") {
          core.debug("Registering this comment to be deleted.");
        } else {
          core.setFailed(
            `Mode ${mode} is unknown. Please use 'upsert', 'recreate' or 'delete'.`
          );
          return;
        }
      } else if (create_if_not_exists) {
        core.info(
          "No comment has been found with asked pattern. Creating a new comment."
        );
      } else {
        core.info(
          "Not creating comment as the pattern has not been found. Use `create_if_not_exists: true` to create a new comment anyway."
        );
        return;
      }
    }

    await createComment({
      ...context.repo,
      issue_number,
      body,
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run(issue_number, "received: " + output);
