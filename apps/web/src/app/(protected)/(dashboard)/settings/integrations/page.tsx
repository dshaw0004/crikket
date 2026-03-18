import { client } from "@/utils/orpc"
import { useQuery } from "@tanstack/react-query"
import { GithubIntegrationForm } from "./_components/github-integration-form"

export default function IntegrationsSettingsPage() {
  const { data: githubIntegration, isLoading } = useQuery({
    queryKey: ["github-integration"],
    queryFn: async () => {
      const response = await client.integration.getGithubIntegration()
      return response
    },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg tracking-tight">Integrations</h2>
        <p className="text-muted-foreground text-sm">
          Connect Crikket to your issue tracker and other tools.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">
              GitHub Integration
            </h3>
            <p className="text-muted-foreground text-sm">
              Automatically create GitHub issues when bug reports are submitted.
            </p>
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="h-[200px] animate-pulse rounded-md bg-muted" />
            ) : (
              <GithubIntegrationForm
                initialData={githubIntegration}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
