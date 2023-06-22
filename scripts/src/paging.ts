import { Octokit } from "octokit"

export interface PageInfo {
  hasNextPage: boolean
  endCursor: string
}

export interface Page<TNode> {
  nodes: TNode[]
  pageInfo: PageInfo
}

export const processPagedQuery = async <TResponse, TNode>(
  octokit: Octokit,
  query: string,
  page: (res: TResponse) => Page<TNode>,
  cursor: string | undefined = undefined
): Promise<TNode[]> => {
  const res = await octokit.graphql<TResponse>(query, { cursor })

  const { nodes, pageInfo } = page(res)

  if (pageInfo.hasNextPage) {
    const nodesInNextPage = await processPagedQuery(octokit, query, page, pageInfo.endCursor)
    return [...nodes, ...nodesInNextPage]
  }

  return nodes
}
