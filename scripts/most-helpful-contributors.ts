import { Author, Comment, Reply, listComments } from "./src/list-comments"
import { listMemberLogins } from "./src/list-member-logins"
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

interface AuthorCount {
  author: Author
  count: number
}

const removeAuthor = (comments: Comment[], authorLogin: string): Comment[] => {
  return comments.filter((c) => c.author.login !== authorLogin)
}

const handleComment = (comment: Comment, authorCounts: AuthorCount[]) => {
  let authorCount = authorCounts.find((ac) => ac.author.login === comment.author.login)
  if (!authorCount) {
    authorCount = {
      author: comment.author,
      count: 0,
    }
    authorCounts.push(authorCount)
  }

  authorCount.count++
}

const handleReply = (reply: Reply, authorCounts: AuthorCount[]) => {
  let authorCount = authorCounts.find((ac) => ac.author.login === reply.author.login)
  if (!authorCount) {
    authorCount = {
      author: reply.author,
      count: 0,
    }
    authorCounts.push(authorCount)
  }

  authorCount.count++
}

const filterAnswers = (comments: Comment[]): AuthorCount[] => {
  const authorCounts: AuthorCount[] = []

  for (const comment of comments) {
    if (comment.isAnswer) {
      console.log(`${comment.author.login} answered using a comment in ${comment.discussion.number}`)
      handleComment(comment, authorCounts)
    }

    for (const reply of comment.replies) {
      if (reply.isAnswer) {
        console.log(`${reply.author.login} answered using a reply in ${reply.discussion.number}`)
        handleReply(reply, authorCounts)
      }
    }
  }

  console.log()
  return authorCounts
}

const filterInteractions = (comments: Comment[]): AuthorCount[] => {
  const authorCounts: AuthorCount[] = []

  for (const comment of comments) {
    handleComment(comment, authorCounts)

    for (const reply of comment.replies) {
      handleReply(reply, authorCounts)
    }
  }

  return authorCounts
}

const byCount = (a: AuthorCount, b: AuthorCount) => {
  return b.count - a.count || a.author.login.localeCompare(b.author.login)
}

const createBody = (answers: AuthorCount[], interactions: AuthorCount[], memberLogins: Set<string>) => {
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

      return memberLogins.has(author.login)
        ? `| ${i + 1} | [${author.login}](https://github.com${author.resourcePath}) (member) | ${count} |`
        : `| ${i + 1} | [${author.login}](https://github.com${author.resourcePath}) | ${count} |`
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
      return memberLogins.has(author.login)
        ? `| ${i + 1} | [${author.login}](https://github.com${author.resourcePath}) (member) | ${count} |`
        : `| ${i + 1} | [${author.login}](https://github.com${author.resourcePath}) | ${count} |`
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

  let comments = await listComments(ORGANIZATION_NAME, REPOSITORY_NAME, personalAccessToken)
  comments = removeAuthor(comments, "github-actions")

  const answers = filterAnswers(comments).sort(byCount).splice(0, 20)
  const interactions = filterInteractions(comments).sort(byCount).splice(0, 20)

  const memberLogins = await listMemberLogins(ORGANIZATION_NAME, personalAccessToken)

  const body = createBody(answers, interactions, memberLogins)
  console.log(body)

  await updateDiscussion(discussionId, body, personalAccessToken)
}

;(async () => {
  await main()
})()
