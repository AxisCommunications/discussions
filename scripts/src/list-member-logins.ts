import { Octokit } from "octokit"
import { PageInfo, processPagedQuery } from "./paging"

export const listMemberLogins = async (organizationName: string, personalAccessToken: string): Promise<Set<string>> => {
  const octokit = new Octokit({
    auth: personalAccessToken,
  })

  const query = createQuery(organizationName)
  const members = await processPagedQuery<Response, Member>(octokit, query, (res) => res.organization.membersWithRole)
  const logins = members.map((m) => m.login)

  return new Set(logins)
}

interface Member {
  login: string
}

const createQuery = (organizationName: string): string => {
  return `
    query($cursor: String) {
      organization(login: "${organizationName}") {
        membersWithRole(first: 100, after: $cursor) {
          nodes {
            login
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
  organization: {
    membersWithRole: {
      nodes: Member[]
      pageInfo: PageInfo
    }
  }
}
