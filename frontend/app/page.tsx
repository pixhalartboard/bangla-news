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
  slug: string | null;
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
  "মাঠের লড়াই",
  "রুপোলি পর্দা",
  "শরীর-মন",
  "ঘোরাঘুরি",
];

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q;
  const searchQuery = q?.trim() || "";

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
      "id, slug, title, description, category, image, published_at, breaking"
    )
    .neq("category", "Health Talk")
    .order("published_at", { ascending: false });

  const settings = settingsData as SiteSettings | null;
  const allNews = (newsData ?? []) as NewsItem[];

  const news = searchQuery
    ? allNews.filter((item) => {
        const query = searchQuery.toLocaleLowerCase("bn-BD");

        return (
          item.title?.toLocaleLowerCase("bn-BD").includes(query) ||
          item.description?.toLocaleLowerCase("bn-BD").includes(query) ||
          item.category?.toLocaleLowerCase("bn-BD").includes(query)
        );
      })
    : allNews;

  // =========================================================
  // SITE DATA
  // =========================================================

  const siteName = settings?.site_name || "বাংলার সংবাদ";

  const tagline =
    settings?.tagline || "সত্যের সঙ্গে, মানুষের পাশে";

  const logoUrl = settings?.logo_url || null;

  // =========================================================
  // DATE (Compact & Clean)
  // =========================================================

  function toBengaliDigits(value: string | number) {
    return String(value).replace(
      /[0-9]/g,
      (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]
    );
  }

  function formatBanglaHeaderDate(date: Date) {
    const weekdays = [
      "রবিবার",
      "সোমবার",
      "মঙ্গলবার",
      "বুধবার",
      "বৃহস্পতিবার",
      "শুক্রবার",
      "শনিবার",
    ];

    const gregorianMonths = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];

    const bengaliMonths = [
      { name: "বৈশাখ", start: new Date(2026, 3, 15), year: 1433 },
      { name: "জ্যৈষ্ঠ", start: new Date(2026, 4, 15), year: 1433 },
      { name: "আষাঢ়", start: new Date(2026, 5, 15), year: 1433 },
      { name: "শ্রাবণ", start: new Date(2026, 6, 16), year: 1433 },
      { name: "ভাদ্র", start: new Date(2026, 7, 17), year: 1433 },
      { name: "আশ্বিন", start: new Date(2026, 8, 18), year: 1433 },
      { name: "কার্তিক", start: new Date(2026, 9, 18), year: 1433 },
      { name: "অগ্রহায়ণ", start: new Date(2026, 10, 17), year: 1433 },
      { name: "পৌষ", start: new Date(2026, 11, 17), year: 1433 },
    ];

    const current = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    let selectedMonth = bengaliMonths[0];

    for (const month of bengaliMonths) {
      if (current >= month.start) {
        selectedMonth = month;
      }
    }

    const diffDays = Math.floor(
      (current.getTime() - selectedMonth.start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const bengaliDay = diffDays + 1;

    return `${weekdays[date.getDay()]}, ${toBengaliDigits(bengaliDay)} ${selectedMonth.name} ${toBengaliDigits(selectedMonth.year)} | ${toBengaliDigits(date.getDate())} ${gregorianMonths[date.getMonth()]} ${toBengaliDigits(date.getFullYear())}`;
  }

  const formattedDate = formatBanglaHeaderDate(new Date());

  // =========================================================
  // MAIN NEWS
  // =========================================================

  const mainNews = news.length > 0 ? news[0] : null;
  const breakingNews =
  [...news]
    .filter((item) => item.breaking)
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() -
        new Date(a.published_at).getTime()
    )[0] || null;

  const latestNews = news.slice(0, 5);

  // =========================================================
  // CATEGORY-WISE NEWS
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
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">

          <div className="flex items-center justify-between gap-3">

            {/* LOGO */}
            <Link href="/" className="shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-16 w-auto max-w-[180px] object-contain sm:h-20 sm:max-w-[230px] md:h-24 md:max-w-[280px]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-900 text-xl font-extrabold text-white sm:h-20 sm:w-20">
                  বাং
                </div>
              )}
            </Link>

            {/* SEARCH */}
            <form
              action="/"
              method="GET"
              className="flex min-w-0 flex-1 justify-end gap-2"
            >
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="খবর খুঁজুন..."
                aria-label="খবর খুঁজুন"
                className="min-w-0 w-full max-w-[420px] rounded-lg border-2 border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-900 sm:px-4"
              />

              <button
                type="submit"
                className="shrink-0 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 sm:px-5"
              >
                খুঁজুন
              </button>
            </form>

          </div>

          <div className="mt-2 text-[11px] font-semibold text-gray-600 sm:text-xs">
            {formattedDate}
          </div>

        </div>
      </header>

      {/* =====================================================
          STICKY MENU BAR
      ====================================================== */}
      <nav className="sticky top-0 z-50 bg-blue-900 shadow-lg">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-4 overflow-x-auto px-3 py-3 text-sm font-semibold text-white sm:gap-6 sm:px-4">
            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className="flex shrink-0 items-center text-lg transition hover:text-red-300"
            >
              🏠
            </Link>

            {FIXED_CATEGORIES.map((category) => (
              <a
                key={category}
                href={`#category-${encodeURIComponent(category)}`}
                className="shrink-0 whitespace-nowrap transition hover:text-red-300"
              >
                {category}
              </a>
            ))}

            <Link
              href="/health-talk"
              className="shrink-0 whitespace-nowrap transition hover:text-red-300"
            >
              Health Talk
            </Link>
          </div>
        </div>
      </nav>

      {/* =====================================================
          SETTINGS ERROR
      ====================================================== */}
      {settingsErrorMessage && (
        <div className="mx-auto max-w-7xl px-4 pt-5">
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            <p className="font-bold">Site Settings load হয়নি</p>
            <p className="mt-1 text-sm">{settingsErrorMessage}</p>
          </div>
        </div>
      )}

      {/* =====================================================
          NEWS ERROR
      ====================================================== */}
      {newsErrorMessage && (
        <div className="mx-auto max-w-7xl px-4 pt-5">
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-bold">News load করা যায়নি</p>
            <p className="mt-1 text-sm">{newsErrorMessage}</p>
          </div>
        </div>
      )}

      {/* =====================================================
          BREAKING NEWS
      ====================================================== */}
      {breakingNews && (
        <section className="border-b border-red-800 bg-red-600 text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <span className="whitespace-nowrap rounded bg-white px-3 py-1 text-sm font-extrabold text-red-600">
              🔥 BREAKING
            </span>
            <Link
              href={`/news/${breakingNews.id}`}
              className="overflow-hidden text-sm font-semibold hover:underline md:text-base"
            >
              {breakingNews.title}
            </Link>
          </div>
        </section>
      )}

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="mx-auto max-w-7xl px-4 py-8">

        {searchQuery && (
          <section className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-blue-950">
                  Search Results
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  “{searchQuery}” এর জন্য {news.length}টি খবর পাওয়া গেছে।
                </p>
              </div>
              <Link
                href="/"
                className="w-fit rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
              >
                Search Clear
              </Link>
            </div>
          </section>
        )}

        {searchQuery && !mainNews ? (
          <div className="py-20 text-center">
            <div className="mx-auto max-w-xl rounded-xl border border-blue-100 bg-blue-50 p-8">
              <div className="mb-4 text-5xl">🔍</div>
              <h2 className="text-2xl font-extrabold text-blue-900 md:text-3xl">
                কোনও Search Result পাওয়া যায়নি
              </h2>
              <p className="mt-3 text-gray-600">
                “{searchQuery}” নামে কোনও News পাওয়া যায়নি।
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
              >
                Search Clear
              </Link>
            </div>
          </div>
        ) : !searchQuery && !mainNews ? (
          <div className="py-20 text-center">
            <div className="mx-auto max-w-xl rounded-xl border border-blue-100 bg-blue-50 p-8">
              <div className="mb-4 text-5xl">📰</div>
              <h2 className="text-2xl font-extrabold text-blue-900 md:text-3xl">
                এখনও কোনও News প্রকাশিত হয়নি
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

              {/* MAIN NEWS (Order: Title -> Image -> Text) */}
              <section className="lg:col-span-2">
                {mainNews && (
                  <article className="overflow-hidden rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
                    
                    {/* 1. TITLE */}
                    <div>
                      
                      <Link href={`/news/${mainNews.slug || mainNews.id}`}>
                        <h2 className="mt-2 text-2xl font-extrabold leading-tight text-blue-950 transition hover:text-red-600 md:text-3xl">
                          {mainNews.title}
                        </h2>
                      </Link>
                    </div>

                    {/* 2. IMAGE */}
                    <div className="my-5 overflow-hidden rounded-lg">
                      <Link href={`/news/${mainNews.slug || mainNews.id}`} className="block overflow-hidden">
                        <img
                          src={mainNews.image || "/news-placeholder.jpg"}
                          alt={mainNews.title}
                          className="h-64 w-full object-cover transition duration-300 hover:scale-105 md:h-96"
                        />
                      </Link>
                    </div>

                    {/* 3. TEXT (Description & Read More) */}
                    <div>
                     
<div
  className="line-clamp-3 text-gray-600 leading-relaxed"
  dangerouslySetInnerHTML={{
    __html: (mainNews.description || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\r\n/g, "\n")
      .replace(/\n/g, "<br />"),
  }}
/>


                      <p className="mt-4 text-sm font-bold text-red-600">
                        <Link href={`/news/${mainNews.slug || mainNews.id}`} className="hover:underline">
                          বিস্তারিত পড়ুন →
                        </Link>
                      </p>
                    </div>

                  </article>
                )}
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
                      href={`/news/${item.slug || item.id}`}
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

                if (categoryNews.length === 0) {
                  return null;
                }

                return (
                  <section
                    key={category}
                    id={`category-${encodeURIComponent(category)}`}
                    className="scroll-mt-20"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-blue-900 pb-3 sm:mb-5">
                      <h2 className="flex items-center gap-2 text-xl font-extrabold text-blue-950 sm:text-2xl">
                        <span className="h-7 w-1 rounded-full bg-red-600" />
                        {category}
                      </h2>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                      {categoryNews.map((item) => (
                        <article
                          key={item.id}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg flex flex-col justify-between"
                        >
                          <div>
                            <Link href={`/news/${item.slug || item.id}`} className="block overflow-hidden">
                              <img
                                src={
                                  item.image ||
                                  "/news-placeholder.jpg"
                                }
                                alt={item.title}
                                className="h-44 w-full object-cover transition duration-300 hover:scale-105"
                              />
                            </Link>

                            <div className="p-4">
                              <span className="text-xs font-bold text-red-600">
                                {item.category}
                              </span>

                              <Link href={`/news/${item.slug || item.id}`}>
                                <h3 className="mt-2 font-bold leading-6 text-blue-950 transition hover:text-red-600">
                                  {item.title}
                                </h3>
                              </Link>

                              

<div className="mt-2 line-clamp-2 text-sm text-gray-600">
  {item.description
    ?.replace(/<[^>]*>/g, " ")
    .replace(/&lt;|&gt;|&quot;|&#39;|&amp;/g, (entity) => {
      const entities: Record<string, string> = {
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&amp;": "&",
      };
      return entities[entity] || entity;
    })
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()}
</div>



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
                            </div>
                          </div>

                          <div className="px-4 pb-4 pt-1">
                            <Link
                              href={`/news/${item.slug || item.id}`}
                              className="inline-block text-sm font-bold text-red-600 transition hover:underline"
                            >
                              বিস্তারিত পড়ুন →
                            </Link>
                          </div>
                        </article>
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
        <div className="mx-auto max-w-7xl px-4 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-white">{siteName}</p>
              <p className="mt-1 text-sm text-blue-200">{tagline}</p>
            </div>

            <Link
              href="/admin"
              className="text-sm text-blue-200 transition hover:text-white"
            >
              অ্যাডমিন প্যানেল
            </Link>
          </div>

          <div className="mt-5 border-t border-blue-800 pt-4 text-sm text-blue-300">
            © 2026 {siteName}. সর্বস্বত্ব সংরক্ষিত।
          </div>
        </div>
      </footer>

    </main>
  );
}