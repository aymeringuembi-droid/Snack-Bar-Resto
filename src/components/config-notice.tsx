export function ConfigNotice() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
      <p className="font-medium">Configuration Supabase requise</p>
      <p className="mt-1">
        Renseigne <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans <code>.env.local</code>{" "}
        (voir <code>.env.example</code>), puis applique les migrations SQL du
        dossier <code>supabase/migrations</code> sur ton projet Supabase.
      </p>
    </div>
  );
}
