import { supabase } from "@/lib/supabase";

export default async function SupabaseTest() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .limit(5);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">Supabase Test</h1>

      {error ? (
        <div className="mt-6 rounded-lg bg-red-100 p-4 text-red-700">
          <p className="font-bold">Connection Error</p>
          <p className="mt-2">{error.message}</p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg bg-green-100 p-4 text-green-700">
          <p className="font-bold">Supabase Connected Successfully ✅</p>
          <p className="mt-2">
            News rows found: {data?.length ?? 0}
          </p>
        </div>
      )}
    </main>
  );
}