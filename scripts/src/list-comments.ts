import { Octokit } from "octokit"
import { PageInfo, processPagedQuery } from "./paging"

export interface Comment {
  discussion: {
    number: number
  }
  author: Author
  isAnswer: boolean
  replies: Reply[]
}

export interface Reply {
  discussion: {
    number: number
  }
  isAnswer: boolean
  author: Author
}

export interface Author {
  login: string
  resourcePath: string
}

export const listComments = async (organizationName: string, repositoryName: string, personalAccessToken: string): Promise<Comment[]> => {
  const octokit = new Octokit({
    auth: personalAccessToken,
  })

  const query = createQuery(organizationName, repositoryName)
  const discussions = await processPagedQuery<Response, Discussion>(octokit, query, (res) => res.repository.discussions)

  if (discussions.some((d) => d.comments.pageInfo.hasNextPage)) {
    throw new Error("Not implemented: Pagination of discussion comments")
  }

  if (discussions.some((d) => d.comments.nodes.some((c) => c.replies.pageInfo.hasNextPage))) {
    throw new Error("Not implemented: Pagination of comment replies")
  }

  const comments: Comment[] = []

  for (const d of discussions) {
    for (const { discussion, isAnswer, author, replies } of d.comments.nodes) {
      comments.push({
        discussion,
        isAnswer,
        author,
        replies: replies.nodes,
      })
    }
  }

  return comments
}

interface Discussion {
  comments: {
    nodes: {
      discussion: {
        number: number
      }
      isAnswer: boolean
      author: Author
      replies: {
        nodes: {
          discussion: {
            number: number
          }
          isAnswer: boolean
          author: Author
        }[]
        pageInfo: PageInfo
      }
    }[]
    pageInfo: PageInfo
  }
}

const createQuery = (organizationName: string, repositoryName: string): string => {
  return `
    query($cursor: String) {
      repository(owner: "${organizationName}", name: "${repositoryName}") {
        discussions(first: 100, after: $cursor) {
          nodes {
            comments(first: 20) {
              nodes {
                discussion {
                  number
                }
                isAnswer
                author {
                  login
                  resourcePath
                }
                replies(first: 20) {
                  nodes {
                    discussion {
                      number
                    }
                    isAnswer
                    author {
                      login
                      resourcePath
                    }
                  }
                  pageInfo {
                    hasNextPage
                  }
                }
              }
              pageInfo {
                hasNextPage
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }`
}

interface Response {
  repository: {
    discussions: {
      nodes: Discussion[]
      pageInfo: PageInfo
    }
  }
}
