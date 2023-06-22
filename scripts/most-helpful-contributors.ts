import { Author, Comment, listComments } from "./src/list-comments"
import { updateDiscussion } from "./src/update-discussion"

export const ORGANIZATION_NAME = "AxisCommunications"
export const REPOSITORY_NAME = "discussions"

const usage = () => {
  console.log("Error: Unsupported number of arguments")
  console.log()
  console.log("USAGE:")
  console.log("    node most-helpful-contributors.js <discussion id> <personal access token>")
  console.log()
  console.log("WHERE:")
  console.log("    discussion id            The ID of the discussion to update.")
  console.log("    personal access token    The GitHub personal access token (PAT) with access to")
  console.log("                             the organization.")
  console.log()
}

interface Count {
  author: Author
  count: number
}

const filterAnswers = (comments: Comment[]): Count[] => {
  return comments
    .filter((c) => c.isAnswer)
    .reduce<Count[]>((result, comment) => {
      let item = result.find((i) => i.author.login === comment.author.login)
      if (!item) {
        item = {
          author: comment.author,
          count: 0,
        }
        result.push(item)
      }

      item.count++

      return result
    }, [])
}

const filterInteractions = (comments: Comment[]): Count[] => {
  return [...comments.map((c) => c.author), ...comments.flatMap((c) => c.replies.map((r) => r.author))].reduce<Count[]>(
    (result, author) => {
      let item = result.find((i) => i.author.login === author.login)
      if (!item) {
        item = {
          author,
          count: 0,
        }
        result.push(item)
      }

      item.count++

      return result
    },
    []
  )
}

const byCount = (a: Count, b: Count) => {
  return b.count - a.count || a.author.login.localeCompare(b.author.login)
}

const createBody = (answers: Count[], interactions: Count[]) => {
  return [
    "# Let's celebrate our contributors!",
    "",
    "The users listed in this post are recognized and celebrated for their contributions to the discussions in this GitHub organization.",
    "",
    "## Most active in discussions",
    "",
    "The following users have been active in discussions. They are valued for their effort in asking for clarification, providing context and in general driving the conversation forward.",
    "",
    "| Position | GitHub user | Number of interactions |",
    "| :------: | ----------- | :--------------------: |",
    ...interactions.map((interaction, i) => {
      const { author, count } = interaction
      return `| ${i + 1} | [${author.login}](https://github.com${author.resourcePath}) | ${count} |`
    }),
    "",
    "## Most helpful with providing answers",
    "",
    "The following users have provided the most answers to questions. They are valued for their domain knowledge and their eagerness to help the community.",
    "",
    "| Position | GitHub user | Number of answers |",
    "| :------: | ----------- | :---------------: |",
    ...answers.map((answer, i) => {
      const { author, count } = answer
      return `| ${i + 1} | [${author.login}](https://github.com${author.resourcePath}) | ${count} |`
    }),
    "",
    "---",
    `*This post is automatically updated once per day. Last update was ${new Date().toISOString()}.*`,
  ].join("\n")
}

const main = async () => {
  const args = process.argv.splice(2)
  if (args.length !== 2) {
    usage()
    process.exit(1)
  }

  const [discussionId, personalAccessToken] = args

  const comments = await listComments(ORGANIZATION_NAME, REPOSITORY_NAME, personalAccessToken)

  const answers = filterAnswers(comments).sort(byCount).splice(0, 20)
  const interactions = filterInteractions(comments).sort(byCount).splice(0, 20)

  const body = createBody(answers, interactions)
  await updateDiscussion(discussionId, body, personalAccessToken)
}

;(async () => {
  await main()
})()
