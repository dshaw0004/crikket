import { z } from "zod"
import { protectedProcedure } from "./context"
import { requireActiveOrgAdmin } from "./helpers"
import { db } from "@crikket/db"
import { organization } from "@crikket/db/schema/auth"
import { eq } from "drizzle-orm"
import { ORPCError } from "@orpc/server"

const githubIntegrationSchema = z.object({
  token: z.string().trim().max(255),
  repo: z.string().trim().min(1).max(255).regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Must be in the format owner/repo"),
})

const updateGithubIntegrationInputSchema = z.object({
  githubIntegration: githubIntegrationSchema.nullable(),
})

export const getGithubIntegration = protectedProcedure.handler(
  async ({ context }) => {
    const organizationId = await requireActiveOrgAdmin(context.session)

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: {
        githubIntegration: true,
      },
    })

    if (!org) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" })
    }

    if (org.githubIntegration) {
      const parsed = githubIntegrationSchema.safeParse(org.githubIntegration)
      if (parsed.success) {
        return {
          repo: parsed.data.repo,
          token: "", // Do not return the plaintext token
        }
      }
    }

    return null
  }
)

export const updateGithubIntegration = protectedProcedure
  .input(updateGithubIntegrationInputSchema)
  .handler(async ({ context, input }) => {
    const organizationId = await requireActiveOrgAdmin(context.session)

    let dataToSave = input.githubIntegration

    if (dataToSave && dataToSave.token === "") {
      const org = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
        columns: {
          githubIntegration: true,
        },
      })
      if (org && org.githubIntegration) {
        const parsed = githubIntegrationSchema.safeParse(org.githubIntegration)
        if (parsed.success) {
          dataToSave.token = parsed.data.token
        }
      }
    }

    await db
      .update(organization)
      .set({
        githubIntegration: dataToSave,
      })
      .where(eq(organization.id, organizationId))

    return dataToSave
  })
