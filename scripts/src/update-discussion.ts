import { Octokit } from "octokit"

export const updateDiscussion = async (discussionId: string, body: string, personalAccessToken: string): Promise<void> => {
  const octokit = new Octokit({
    auth: personalAccessToken,
  })

  const query = createQuery(discussionId, body)
  await octokit.graphql(query)
}

const createQuery = (discussionId: string, body: string): string => {
  return `
    mutation {
      updateDiscussion(input: {
        discussionId: "${discussionId}"
        body: "${body}"
      }) {
        clientMutationId
      }
    }`
}
