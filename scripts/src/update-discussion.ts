import { Octokit } from "octokit"

export const updateDiscussion = async (discussionId: string, body: string, personalAccessToken: string): Promise<void> => {
  const octokit = new Octokit({
    auth: personalAccessToken,
  })

  const query = createQuery()
  await octokit.graphql(query, { discussionId, body })
}

const createQuery = (): string => {
  return `
    mutation($discussionId: ID!, $body: String!) {
      updateDiscussion(input: {
        discussionId: $discussionId
        body: $body
      }) {
        clientMutationId
      }
    }`
}
