import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

type NewsItem = {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string | null;
  published_at: string;
  breaking: boolean;
};

export default async function NewsDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: article, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !article) {
    return (
      <main className="min-h-screen bg-white text-black">

        {/* HEADER */}
        <header className="border-b border-gray-300 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5">

            <Link href="/">
              <h1 className="text-2xl font-extrabold">
                বাংলার সংবাদ
              </h1>

              <p className="text-sm text-gray-600">
                সত্যের সঙ্গে, মানুষের পাশে
              </p>
            </Link>

          </div>
        </header>

        {/* NOT FOUND */}
        <div className="px-4 py-20 text-center">

          <h1 className="text-3xl font-bold">
            খবরটি পাওয়া যায়নি
          </h1>

          <p className="mt-3 text-gray-600">
            এই News Database-এ পাওয়া যাচ্ছে না।
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            ← হোম পেজে ফিরে যান
          </Link>

        </div>

        {/* FOOTER */}
        <footer className="mt-12 bg-black px-4 py-8 text-white">

          <div className="mx-auto max-w-7xl">

            <h2 className="text-xl font-bold">
              বাংলার সংবাদ
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              সত্যের সঙ্গে, মানুষের পাশে।
            </p>

            <p className="mt-5 border-t border-gray-700 pt-4 text-sm text-gray-500">
              © 2026 Banglar Sangbad. All rights reserved.
            </p>

          </div>

        </footer>

      </main>
    );
  }

  const newsArticle = article as NewsItem;

  return (
    <main className="min-h-screen bg-white text-black">

      {/* ================= HEADER ================= */}
      <header className="border-b border-gray-300 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-5">

          <Link href="/">

            <h1 className="text-2xl font-extrabold">
              বাংলার সংবাদ
            </h1>

            <p className="text-sm text-gray-600">
              সত্যের সঙ্গে, মানুষের পাশে
            </p>

          </Link>

        </div>

      </header>


      {/* ================= NEWS CONTENT ================= */}
      <article className="mx-auto max-w-4xl px-4 py-10">

        {/* Category */}
        <p className="mb-3 text-sm font-bold text-red-600">
          {newsArticle.category}
        </p>


        {/* Title */}
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
          {newsArticle.title}
        </h1>


        {/* Date */}
        <p className="mt-4 text-sm text-gray-500">
          প্রকাশিত:{" "}
          {new Date(newsArticle.published_at).toLocaleString("bn-BD")}
        </p>


        {/* Breaking News */}
        {newsArticle.breaking && (
          <div className="mt-5 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">
            🔥 BREAKING NEWS
          </div>
        )}


        {/* Image */}
        <div className="mt-8 overflow-hidden rounded-xl">

          <img
            src={newsArticle.image || "/news-placeholder.jpg"}
            alt={newsArticle.title}
            className="h-auto max-h-[600px] w-full object-cover"
          />

        </div>


        {/* Description */}
        <div className="mt-8 text-lg leading-8 text-gray-700">

          <p>
            {newsArticle.description}
          </p>

        </div>


        {/* Back */}
        <div className="mt-10">

          <Link
            href="/"
            className="inline-block rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            ← সব খবর দেখুন
          </Link>

        </div>

      </article>


      {/* ================= FOOTER ================= */}
      <footer className="mt-12 bg-black px-4 py-8 text-white">

        <div className="mx-auto max-w-7xl">

          <h2 className="text-xl font-bold">
            বাংলার সংবাদ
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            সত্যের সঙ্গে, মানুষের পাশে।
          </p>

          <p className="mt-5 border-t border-gray-700 pt-4 text-sm text-gray-500">
            © 2026 Banglar Sangbad. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}