import { db } from "@crikket/db"
import { organization } from "@crikket/db/schema/auth"
import { eq } from "drizzle-orm"
import { z } from "zod"

const githubIntegrationSchema = z.object({
  token: z.string().trim().min(1),
  repo: z.string().trim().min(1),
})

export async function createGithubIssueForBugReport(input: {
  organizationId: string
  bugReportId: string
  title: string
  description?: string | null
  priority: string
  tags?: string[] | null
  shareUrl: string
}) {
  try {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, input.organizationId),
      columns: {
        githubIntegration: true,
      },
    })

    if (!org || !org.githubIntegration) {
      return
    }

    const parsed = githubIntegrationSchema.safeParse(org.githubIntegration)
    if (!parsed.success) {
      console.error("Invalid GitHub integration configuration for org", input.organizationId)
      return
    }

    const { token, repo } = parsed.data

    let body = `**Bug Report from Crikket**\n\n`
    body += `**View full report & replay:** ${input.shareUrl}\n\n`

    if (input.description) {
      body += `**Description:**\n${input.description}\n\n`
    }

    body += `**Priority:** ${input.priority}\n`

    if (input.tags && input.tags.length > 0) {
      body += `**Tags:** ${input.tags.join(", ")}\n`
    }

    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Crikket-App",
      },
      body: JSON.stringify({
        title: input.title,
        body,
        labels: ["bug"],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to create GitHub issue:", response.status, errorText)
    }
  } catch (error) {
    console.error("Error creating GitHub issue:", error)
  }
}
