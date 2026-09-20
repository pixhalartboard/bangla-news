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

export default async function Home() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false });

  const news = (data ?? []) as NewsItem[];

  const mainNews = news[0];
  const latestNews = news.slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-black">

      {/* ================= HEADER ================= */}
      <header className="border-b border-gray-300 bg-white">

        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">

          {/* Logo */}
          <div className="min-w-0 flex-1">
            <Link href="/">
              <h1 className="text-xl font-extrabold whitespace-nowrap text-black md:text-2xl">
                বাংলার সংবাদ
              </h1>

              <p className="text-xs font-medium text-gray-600 md:text-sm">
                সত্যের সঙ্গে, মানুষের পাশে
              </p>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden items-center gap-2 md:flex">
            <input
              type="text"
              placeholder="খবর খুঁজুন..."
              className="w-56 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm text-black outline-none placeholder:text-gray-500 focus:border-black"
            />

            <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              Search
            </button>
          </div>

          {/* Mobile Search */}
          <button
            className="rounded-lg border-2 border-black bg-white px-3 py-2 text-lg text-black md:hidden"
            aria-label="Search"
          >
            🔍
          </button>

          {/* Mobile Menu */}
          <button
            className="rounded-lg border-2 border-black bg-white px-3 py-2 text-xl font-bold text-black md:hidden"
            aria-label="Menu"
          >
            ☰
          </button>

        </div>

        {/* Navigation */}
        <nav className="border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-3 text-sm font-semibold text-black">

            <span className="whitespace-nowrap">দেশের কথা</span>
            <span className="whitespace-nowrap">বিশ্বের জানালা</span>
            <span className="whitespace-nowrap">বাংলার দিনলিপি</span>
            <span className="whitespace-nowrap">মাঠের লড়াই</span>
            <span className="whitespace-nowrap">রুপোলি পর্দা</span>
            <span className="whitespace-nowrap">শরীর-মন</span>
            <span className="whitespace-nowrap">ঘোরাঘুরি</span>

          </div>
        </nav>

      </header>


      {/* ================= DATABASE ERROR ================= */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="rounded-lg bg-red-100 p-4 text-red-700">
            <p className="font-bold">News load করা যায়নি</p>
            <p className="mt-1 text-sm">{error.message}</p>
          </div>
        </div>
      )}


      {/* ================= BREAKING NEWS ================= */}
      {mainNews && mainNews.breaking && (
        <section className="border-b border-red-700 bg-red-600 text-white">

          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">

            <span className="whitespace-nowrap font-bold">
              🔥 BREAKING NEWS
            </span>

            <Link
              href={`/news/${mainNews.id}`}
              className="overflow-hidden text-sm hover:underline"
            >
              {mainNews.title}
            </Link>

          </div>

        </section>
      )}


      {/* ================= MAIN CONTENT ================= */}
      <div className="mx-auto max-w-7xl px-4 py-8">

        {!mainNews ? (

          <div className="py-20 text-center">

            <h2 className="text-3xl font-extrabold text-black">
              এখনও কোনও News প্রকাশিত হয়নি
            </h2>

            <p className="mt-3 text-gray-600">
              Admin Panel থেকে প্রথম News Publish করুন।
            </p>

            <Link
              href="/admin"
              className="mt-6 inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Admin Panel
            </Link>

          </div>

        ) : (

          <>
            {/* Main News + Latest News */}
            <div className="grid gap-8 lg:grid-cols-3">

              {/* ================= MAIN NEWS ================= */}
              <section className="lg:col-span-2">

                <Link href={`/news/${mainNews.id}`}>

                  <div className="mb-5">

                    <span className="text-sm font-bold text-red-600">
                      প্রধান খবর
                    </span>

                    <h2 className="mt-2 text-3xl font-extrabold leading-tight text-black hover:text-red-600 md:text-4xl">
                      {mainNews.title}
                    </h2>

                    <p className="mt-3 text-gray-600">
                      {mainNews.description}
                    </p>

                  </div>

                  {/* Main News Image */}
                  <div className="overflow-hidden rounded-xl">

                    <img
                      src={mainNews.image || "/news-placeholder.jpg"}
                      alt={mainNews.title}
                      className="h-64 w-full object-cover transition duration-300 hover:scale-105"
                    />

                  </div>

                </Link>

              </section>


              {/* ================= LATEST NEWS ================= */}
              <aside>

                <h2 className="mb-4 border-b-2 border-black pb-3 text-xl font-extrabold">
                  সর্বশেষ খবর
                </h2>

                <div className="space-y-4">

                  {latestNews.map((item) => (

                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className="block"
                    >

                      <article className="border-b border-gray-300 pb-4">

                        <span className="text-xs font-semibold text-red-600">
                          {new Date(item.published_at).toLocaleString("bn-BD")}
                        </span>

                        <h3 className="mt-1 font-bold text-black hover:text-red-600">
                          {item.title}
                        </h3>

                      </article>

                    </Link>

                  ))}

                </div>

              </aside>

            </div>


            {/* ================= CATEGORY ================= */}
            <section className="mt-12">

              <div className="mb-5 flex items-center justify-between">

                <h2 className="text-2xl font-extrabold text-black">
                  দেশের কথা
                </h2>

                <button className="text-sm font-bold text-red-600 hover:text-red-700">
                  সব খবর →
                </button>

              </div>


              {/* ================= NEWS CARDS ================= */}
              <div className="grid gap-6 md:grid-cols-3">

                {news.map((item) => (

                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className="block"
                  >

                    <article className="overflow-hidden rounded-xl border border-gray-300 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg">

                      {/* News Image */}
                      <div className="overflow-hidden">

                        <img
                          src={item.image || "/news-placeholder.jpg"}
                          alt={item.title}
                          className="h-40 w-full object-cover transition duration-300 hover:scale-105"
                        />

                      </div>


                      {/* Card Content */}
                      <div className="p-4">

                        <span className="text-xs font-semibold text-red-600">
                          {item.category}
                        </span>

                        <h3 className="mt-2 font-bold text-black hover:text-red-600">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm text-gray-600">
                          {item.description}
                        </p>

                        <p className="mt-3 text-xs text-gray-500">
                          {new Date(item.published_at).toLocaleString("bn-BD")}
                        </p>

                        <p className="mt-3 text-sm font-bold text-red-600">
                          বিস্তারিত পড়ুন →
                        </p>

                      </div>

                    </article>

                  </Link>

                ))}

              </div>

            </section>
          </>

        )}

      </div>


      {/* ================= FOOTER ================= */}
      <footer className="mt-12 bg-black text-white">

        <div className="mx-auto max-w-7xl px-4 py-8">

          <h2 className="text-xl font-bold">
            বাংলার সংবাদ
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            সত্যের সঙ্গে, মানুষের পাশে।
          </p>

          <div className="mt-6 border-t border-gray-700 pt-4 text-sm text-gray-400">
            © 2026 Banglar Sangbad. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}