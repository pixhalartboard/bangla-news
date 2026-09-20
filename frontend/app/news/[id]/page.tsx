import { news } from "../../data/news";
import Link from "next/link";

export default async function NewsDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const article = news.find((item) => item.id === Number(id));

  if (!article) {
    return (
      <main className="min-h-screen bg-white px-4 py-20 text-center text-black">
        <h1 className="text-3xl font-bold">খবরটি পাওয়া যায়নি</h1>

        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
        >
          ← হোম পেজে ফিরে যান
        </Link>
      </main>
    );
  }

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

      {/* NEWS CONTENT */}
      <article className="mx-auto max-w-4xl px-4 py-10">

        {/* Category */}
        <p className="mb-3 text-sm font-bold text-red-600">
          {article.category}
        </p>

        {/* Title */}
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
          {article.title}
        </h1>

        {/* Date */}
        <p className="mt-4 text-sm text-gray-500">
          প্রকাশিত: {article.publishedAt}
        </p>

        {/* Image */}
        <div className="mt-8 overflow-hidden rounded-xl">
          <img
            src="/news-placeholder.jpg"
            alt={article.title}
            className="h-auto w-full object-cover"
          />
        </div>

        {/* Description */}
        <div className="mt-8 text-lg leading-8 text-gray-700">
          <p>{article.description}</p>

          <p className="mt-5">
            এই খবরের বিস্তারিত তথ্য, গুরুত্বপূর্ণ আপডেট এবং সংশ্লিষ্ট
            বিষয়গুলি এখানে প্রকাশ করা হবে। ভবিষ্যতে Admin Panel থেকে
            সম্পূর্ণ খবরের লেখা, ছবি এবং অন্যান্য তথ্য পরিবর্তন করা যাবে।
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