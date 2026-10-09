
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Supabase URL বা SERVICE ROLE KEY পাওয়া যায়নি।");
  process.exit(1);
}

const supabase = createClient(url, key);

function createSlug(title, id) {
  const words = title
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return `${words || "news"}-${id}`;
}

const { data: news, error } = await supabase
  .from("news")
  .select("id, title");

if (error) throw error;

for (const item of news) {
  const slug = createSlug(item.title, item.id);

  const { error: updateError } = await supabase
    .from("news")
    .update({ slug })
    .eq("id", item.id);

  if (updateError) {
    console.error(`ID ${item.id}:`, updateError.message);
  } else {
    console.log(`Updated: ${slug}`);
  }
}

console.log("Finished.");
