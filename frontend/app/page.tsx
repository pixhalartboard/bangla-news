import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SiteSettings = {
  id: number;
  site_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  updated_at?: string | null;
};

type NewsItem = {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string | null;
  published_at: string;
  breaking: boolean;
};

const FIXED_CATEGORIES = [
  "দেশের কথা",
  "বিশ্বের জানালা",
  "বাংলার দিনলিপি",
  "মাঠের লড়াই",
  "রুপোলি পর্দা",
  "শরীর-মন",
  "ঘোরাঘুরি",
];

export default async function Home() {
  // =========================================================
  // SITE SETTINGS
  // =========================================================

  const {
    data: settingsData,
    error: settingsError,
  } = await supabase
    .from("site_settings")
    .select("id, site_name, tagline, logo_url, updated_at")
    .eq("id", 1)
    .maybeSingle();

  // =========================================================
  // NEWS
  // =========================================================

  const {
    data: newsData,
    error: newsError,
  } = await supabase
    .from("news")
    .select(
      "id, title, description, category, image, published_at, breaking"
    )
    .order("published_at", { ascending: false });

  const settings = settingsData as SiteSettings | null;
  const news = (newsData ?? []) as NewsItem[];

  // =========================================================
  // SITE DATA
  // =========================================================

  const siteName = settings?.site_name || "বাংলার সংবাদ";

  const tagline =
    settings?.tagline || "সত্যের সঙ্গে, মানুষের পাশে";

  const logoUrl = settings?.logo_url || null;

  // =========================================================
  // DATE
  // =========================================================

  const today = new Date();

  const formattedDate = today.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // =========================================================
  // MAIN NEWS
  // =========================================================

  const mainNews = news.length > 0 ? news[0] : null;

  const latestNews = news.slice(0, 5);

  // =========================================================
  // CATEGORY-WISE NEWS
  // Only fixed 7 categories will be displayed
  // =========================================================

  const categoryMap: Record<string, NewsItem[]> = {};

  FIXED_CATEGORIES.forEach((category) => {
    categoryMap[category] = [];
  });

  news.forEach((item) => {
    const category = item.category?.trim();

    if (category && FIXED_CATEGORIES.includes(category)) {
      categoryMap[category].push(item);
    }
  });

  // =========================================================
  // ERROR MESSAGES
  // =========================================================

  const newsErrorMessage = newsError
    ? newsError.message || "News database থেকে data load করা যাচ্ছে না।"
    : null;

  const settingsErrorMessage = settingsError
    ? settingsError.message || "Site settings load করা যাচ্ছে না।"
    : null;

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b-4 border-red-600 bg-white shadow-sm">

        <div className="mx-auto max-w-7xl px-4">

          <div className="flex min-h-[135px] items-center justify-between gap-4 py-5">

            {/* LOGO + SITE INFO */}

            <div className="min-w-0 flex-1">

              <Link href="/" className="inline-block">

                <div className="flex items-center gap-4">

                  {/* DATABASE LOGO */}

                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={siteName}
                      className="h-24 w-24 rounded-xl object-contain md:h-28 md:w-28"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-blue-900 text-3xl font-extrabold text-white md:h-28 md:w-28">
                      বাং
                    </div>
                  )}

                  {/* SITE NAME */}

                  <div className="min-w-0">

                    <h1 className="text-2xl font-extrabold text-blue-950 md:text-4xl">
                      {siteName}
                    </h1>

                    <p className="mt-1 text-xs font-medium text-gray-600 md:text-sm">
                      {tagline}
                    </p>

                    {/* DATE */}

                    <p className="mt-2 text-xs font-bold text-red-600 md:text-sm">
                      {formattedDate}
                    </p>

                  </div>

                </div>

              </Link>

            </div>

            {/* SEARCH */}

            <div className="hidden items-center gap-2 md:flex">

              <input
                type="text"
                placeholder="খবর খুঁজুন..."
                className="w-56 rounded-lg border-2 border-blue-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-900"
              />

              <button
                type="button"
                className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Search
              </button>

            </div>

            {/* MOBILE BUTTONS */}

            <div className="flex gap-2 md:hidden">

              <button
                type="button"
                className="rounded-lg border-2 border-blue-900 bg-white px-3 py-2 text-lg text-blue-900"
                aria-label="Search"
              >
                🔍
              </button>

              <button
                type="button"
                className="rounded-lg border-2 border-blue-900 bg-white px-3 py-2 text-xl font-bold text-blue-900"
                aria-label="Menu"
              >
                ☰
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          STICKY MENU BAR
      ====================================================== */}

      <nav className="sticky top-0 z-50 bg-blue-900 shadow-lg">

        <div className="mx-auto max-w-7xl">

          <div className="flex gap-6 overflow-x-auto px-4 py-3 text-sm font-semibold text-white">

            {/* HOME ICON ONLY */}

            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className="flex shrink-0 items-center text-lg transition hover:text-red-300"
            >
              🏠
            </Link>

            {/* FIXED CATEGORIES */}

            {FIXED_CATEGORIES.map((category) => (
              <a
                key={category}
                href={`#category-${encodeURIComponent(category)}`}
                className="shrink-0 whitespace-nowrap transition hover:text-red-300"
              >
                {category}
              </a>
            ))}

          </div>

        </div>

      </nav>

      {/* =====================================================
          SETTINGS ERROR
      ====================================================== */}

      {settingsErrorMessage && (

        <div className="mx-auto max-w-7xl px-4 pt-5">

          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">

            <p className="font-bold">
              Site Settings load হয়নি
            </p>

            <p className="mt-1 text-sm">
              {settingsErrorMessage}
            </p>

          </div>

        </div>

      )}

      {/* =====================================================
          NEWS ERROR
      ====================================================== */}

      {newsErrorMessage && (

        <div className="mx-auto max-w-7xl px-4 pt-5">

          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">

            <p className="font-bold">
              News load করা যায়নি
            </p>

            <p className="mt-1 text-sm">
              {newsErrorMessage}
            </p>

          </div>

        </div>

      )}

      {/* =====================================================
          BREAKING NEWS
      ====================================================== */}

      {mainNews?.breaking && (

        <section className="border-b border-red-800 bg-red-600 text-white">

          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">

            <span className="whitespace-nowrap rounded bg-white px-3 py-1 text-sm font-extrabold text-red-600">
              🔥 BREAKING
            </span>

            <Link
              href={`/news/${mainNews.id}`}
              className="overflow-hidden text-sm font-semibold hover:underline md:text-base"
            >
              {mainNews.title}
            </Link>

          </div>

        </section>

      )}

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* ===================================================
            NO NEWS
        ==================================================== */}

        {!mainNews ? (

          <div className="py-20 text-center">

            <div className="mx-auto max-w-xl rounded-xl border border-blue-100 bg-blue-50 p-8">

              <div className="mb-4 text-5xl">
                📰
              </div>

              <h2 className="text-2xl font-extrabold text-blue-900 md:text-3xl">
                এখনও কোনও News প্রকাশিত হয়নি
              </h2>

              <p className="mt-3 text-gray-600">
                Admin Panel থেকে প্রথম News Publish করুন।
              </p>

              <Link
                href="/admin"
                className="mt-6 inline-block rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
              >
                Admin Panel
              </Link>

            </div>

          </div>

        ) : (

          <>

            {/* =================================================
                MAIN NEWS + LATEST NEWS
            ================================================== */}

            <div className="grid gap-8 lg:grid-cols-3">

              {/* MAIN NEWS */}

              <section className="lg:col-span-2">

                <Link href={`/news/${mainNews.id}`}>

                  <div className="mb-5">

                    <span className="text-sm font-bold text-red-600">
                      প্রধান খবর
                    </span>

                    <h2 className="mt-2 text-3xl font-extrabold leading-tight text-blue-950 transition hover:text-red-600 md:text-4xl">
                      {mainNews.title}
                    </h2>

                    <p className="mt-3 text-gray-600">
                      {mainNews.description}
                    </p>

                  </div>

                  <div className="overflow-hidden rounded-xl border border-blue-100">

                    <img
                      src={mainNews.image || "/news-placeholder.jpg"}
                      alt={mainNews.title}
                      className="h-64 w-full object-cover transition duration-300 hover:scale-105 md:h-96"
                    />

                  </div>

                </Link>

              </section>

              {/* =================================================
                  LATEST NEWS
              ================================================== */}

              <aside>

                <h2 className="mb-4 border-b-4 border-red-600 pb-3 text-xl font-extrabold text-blue-950">
                  সর্বশেষ খবর
                </h2>

                <div className="space-y-4">

                  {latestNews.map((item) => (

                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className="block"
                    >

                      <article className="border-b border-gray-200 pb-4">

                        <span className="text-xs font-semibold text-red-600">

                          {new Date(
                            item.published_at
                          ).toLocaleDateString(
                            "bn-BD",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}

                        </span>

                        <h3 className="mt-1 font-bold text-blue-950 transition hover:text-red-600">
                          {item.title}
                        </h3>

                      </article>

                    </Link>

                  ))}

                </div>

              </aside>

            </div>

            {/* =================================================
                FIXED CATEGORY SECTIONS
            ================================================== */}

            <div className="mt-12 space-y-14">

              {FIXED_CATEGORIES.map((category) => {

                const categoryNews =
                  categoryMap[category].slice(0, 6);

                // Do not show empty category sections

                if (categoryNews.length === 0) {
                  return null;
                }

                return (

                  <section
                    key={category}
                    id={`category-${encodeURIComponent(category)}`}
                    className="scroll-mt-20"
                  >

                    {/* CATEGORY HEADER */}

                    <div className="mb-5 flex items-center justify-between border-b-2 border-blue-900 pb-3">

                      <h2 className="flex items-center gap-2 text-2xl font-extrabold text-blue-950">

                        <span className="h-7 w-1 rounded-full bg-red-600" />

                        {category}

                      </h2>

                      <span className="text-sm font-bold text-red-600">
                        {categoryMap[category].length}টি খবর
                      </span>

                    </div>

                    {/* NEWS CARDS */}

                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">

                      {categoryNews.map((item) => (

                        <Link
                          key={item.id}
                          href={`/news/${item.id}`}
                          className="block"
                        >

                          <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">

                            {/* IMAGE */}

                            <div className="overflow-hidden">

                              <img
                                src={
                                  item.image ||
                                  "/news-placeholder.jpg"
                                }
                                alt={item.title}
                                className="h-44 w-full object-cover transition duration-300 hover:scale-105"
                              />

                            </div>

                            {/* CONTENT */}

                            <div className="p-4">

                              <span className="text-xs font-bold text-red-600">
                                {item.category}
                              </span>

                              <h3 className="mt-2 font-bold leading-6 text-blue-950 transition hover:text-red-600">
                                {item.title}
                              </h3>

                              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                {item.description}
                              </p>

                              <p className="mt-3 text-xs text-gray-500">

                                {new Date(
                                  item.published_at
                                ).toLocaleDateString(
                                  "bn-BD",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}

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

                );

              })}

            </div>

          </>

        )}

      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-12 bg-blue-950 text-white">

        <div className="mx-auto max-w-7xl px-4 py-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            {/* SITE INFO */}

            <div>

              <h2 className="text-xl font-bold">
                {siteName}
              </h2>

              <p className="mt-2 text-sm text-blue-200">
                {tagline}
              </p>

              <p className="mt-2 text-sm text-blue-300">
                {formattedDate}
              </p>

            </div>

            {/* ADMIN PANEL */}

            <Link
              href="/admin"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              ⚙️ Admin Panel
            </Link>

          </div>
git status
          <div className="mt-6 border-t border-blue-800 pt-4 text-sm text-blue-300">
            © 2026 {siteName}. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}