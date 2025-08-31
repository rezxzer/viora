export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SettingsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">Preferences (theme, language, privacy).</p>
    </div>
  )
}
