"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"

import { Button } from "@crikket/ui/components/ui/button"
import { Input } from "@crikket/ui/components/ui/input"
import { toast } from "sonner"
import { client } from "@/utils/orpc"

const formSchema = z.object({
  token: z.string().trim(),
  repo: z
    .string()
    .trim()
    .min(1, "Repository is required.")
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Must be in the format owner/repo"),
})

type FormValues = z.infer<typeof formSchema>

export function GithubIntegrationForm({
  initialData,
}: {
  initialData: any
}) {
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: initialData?.token || "",
      repo: initialData?.repo || "",
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      await client.integration.updateGithubIntegration({
        githubIntegration: values,
      })
    },
    onSuccess: () => {
      toast.success("Your GitHub integration settings have been saved.")
      queryClient.invalidateQueries({ queryKey: ["github-integration"] })
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`)
    },
  })

  const { mutate: mutateDisconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: async () => {
      await client.integration.updateGithubIntegration({
        githubIntegration: null,
      })
    },
    onSuccess: () => {
      form.reset({ token: "", repo: "" })
      toast.success("Your GitHub integration has been removed.")
      queryClient.invalidateQueries({ queryKey: ["github-integration"] })
    },
    onError: (error) => {
      toast.error(`Failed to disconnect integration: ${error.message}`)
    },
  })

  function onSubmit(values: FormValues) {
    mutate(values)
  }

  const isConnected = !!initialData

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Personal Access Token
        </label>
        <Controller
          control={form.control}
          name="token"
          render={({ field }) => (
            <Input
              type="password"
              placeholder={isConnected ? "••••••••••••••••••••••••••••" : "ghp_..."}
              {...field}
            />
          )}
        />
        {form.formState.errors.token && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.token.message}
          </p>
        )}
        <p className="text-[0.8rem] text-muted-foreground">
          A GitHub Personal Access Token with repo access. {isConnected && "Leave blank to keep existing token."}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Repository
        </label>
        <Controller
          control={form.control}
          name="repo"
          render={({ field }) => (
            <Input placeholder="owner/repo" {...field} />
          )}
        />
        {form.formState.errors.repo && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.repo.message}
          </p>
        )}
        <p className="text-[0.8rem] text-muted-foreground">
          The target repository to create issues in (e.g., crikket/crikket).
        </p>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={isPending || isDisconnecting}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
        {isConnected && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || isDisconnecting}
            onClick={() => mutateDisconnect()}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        )}
      </div>
    </form>
  )
}
