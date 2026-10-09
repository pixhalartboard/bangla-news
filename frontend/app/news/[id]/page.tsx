import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ViewTracker from "./ViewTracker";
export const dynamic = "force-dynamic";

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

type SiteSettings = {
  site_name: string;
  tagline: string;
  logo_url: string | null;
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
    "জানুয়ারি",
    "ফেব্রুয়ারি",
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

  // পশ্চিমবঙ্গের প্রচলিত বাংলা পঞ্জিকা অনুযায়ী ২০২৬ সালের
  // বাংলা মাসের শুরুর তারিখ।
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

  return `${toBengaliDigits(bengaliDay)} ${
    selectedMonth.name
  } ${toBengaliDigits(selectedMonth.year)} • ${
    weekdays[date.getDay()]
  } • ${toBengaliDigits(date.getDate())} ${
    gregorianMonths[date.getMonth()]
  } ${toBengaliDigits(date.getFullYear())}`;
}

function formatPublishedDate(date: string) {
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function NewsDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  

const decodedId = decodeURIComponent(id);

const articleQuery = /^\d+$/.test(decodedId)
  ? supabase
      .from("news")
      .select("*")
      .eq("id", Number(decodedId))
      .maybeSingle()
  : supabase
      .from("news")
      .select("*")
      .eq("slug", decodedId)
      .maybeSingle();


const [{ data: article, error }, { data: settings }] =
  await Promise.all([
    articleQuery,

    supabase
      .from("site_settings")
      .select("site_name, tagline, logo_url")
      .eq("id", 1)
      .maybeSingle(),
  ]);


  const site: SiteSettings = {
    site_name: settings?.site_name ?? "Time Lock News",
    tagline: settings?.tagline ?? "সত্যের সঙ্গে, মানুষের পাশে",
    logo_url: settings?.logo_url ?? null,
  };

  const formattedDate = formatBanglaHeaderDate(new Date());

  if (error || !article) {
    return (
      <main className="min-h-screen bg-white text-gray-900">

        {/* =====================================================
            HEADER — HOME PAGE STYLE
        ====================================================== */}
        <header className="border-b-4 border-red-600 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">

            <div className="flex items-center justify-between gap-3">

              {/* LOGO */}
              <Link href="/" className="shrink-0">
                {site.logo_url ? (
                  <img
                    src={site.logo_url}
                    alt={site.site_name}
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

            {/* DATE */}
            <div className="mt-2 text-sm font-semibold text-blue-950 sm:text-base">
              {formattedDate}
            </div>

          </div>
        </header>

        {/* =====================================================
            STICKY MENU BAR — HOME PAGE STYLE
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
                <Link
                  key={category}
                  href={`/?category=${encodeURIComponent(category)}`}
                  className="shrink-0 whitespace-nowrap transition hover:text-red-300"
                >
                  {category}
                </Link>
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

        {/* NOT FOUND */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">

          <div className="text-5xl">📰</div>

          <h1 className="mt-5 text-3xl font-extrabold">
            খবরটি পাওয়া যায়নি
          </h1>

          <p className="mt-3 text-gray-600">
            এই খবরটি News Database-এ পাওয়া যাচ্ছে না।
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-red-600"
          >
            ← হোম পেজে ফিরে যান
          </Link>

        </section>

        {/* =====================================================
            FOOTER — HOME PAGE STYLE
        ====================================================== */}
        <footer className="mt-12 bg-[#18295f] text-white">

          <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <p className="text-xl font-medium text-white sm:text-2xl">
                  {site.site_name}
                </p>

                <p className="mt-2 text-base text-white sm:text-lg">
                  {site.tagline}
                </p>
              </div>

              <Link
                href="/admin"
                className="text-base text-white transition hover:text-blue-200 sm:text-lg"
              >
                অ্যাডমিন প্যানেল
              </Link>

            </div>

            <div className="mt-8 border-t border-blue-400/40 pt-6 text-sm text-blue-200 sm:text-base">
              © 2026 {site.site_name}. সর্বস্বত্ব সংরক্ষিত।
            </div>

          </div>
        </footer>

      </main>
    );
  }

  const newsArticle = article as NewsItem;

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* =====================================================
          HEADER — EXACT HOME PAGE STYLE
      ====================================================== */}
      <header className="border-b-4 border-red-600 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">

          <div className="flex items-center justify-between gap-3">

            {/* LOGO */}
            <Link href="/" className="shrink-0">
              {site.logo_url ? (
                <img
                  src={site.logo_url}
                  alt={site.site_name}
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

          {/* DATE */}
          <div className="mt-2 text-sm font-semibold text-blue-950 sm:text-base">
            {formattedDate}
          </div>

        </div>
      </header>

      {/* =====================================================
          STICKY MENU BAR — HOME PAGE STYLE
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
              <Link
                key={category}
                href={`/?category=${encodeURIComponent(category)}`}
                className="shrink-0 whitespace-nowrap transition hover:text-red-300"
              >
                {category}
              </Link>
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
          NEWS CONTENT
      ====================================================== */}
      <article className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <ViewTracker newsId={newsArticle.id} />

        {/* CATEGORY */}
        <p className="mb-3 text-sm font-bold text-red-600">
          {newsArticle.category}
        </p>

        {/* TITLE */}
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
          {newsArticle.title}
        </h1>

        {/* DATE */}
        <p className="mt-4 text-sm text-gray-500">
          প্রকাশিত: {formatPublishedDate(newsArticle.published_at)}
        </p>

        {/* BREAKING NEWS */}
        {newsArticle.breaking && (
          <div className="mt-5 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">
            🔥 BREAKING NEWS
          </div>
        )}

        {/* IMAGE */}
        <div className="mt-8 overflow-hidden rounded-xl bg-gray-100">
          <img
            src={newsArticle.image || "/news-placeholder.jpg"}
            alt={newsArticle.title}
            className="h-auto max-h-[600px] w-full object-cover"
          />
        </div>

        {/* DESCRIPTION */}
        
{/* DESCRIPTION */}
{/* DESCRIPTION */}
<div
  className="mt-8 text-lg leading-8 text-gray-700
    [&_p]:mb-4
    [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6
    [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6
    [&_li]:mb-2"
  dangerouslySetInnerHTML={{
    __html: newsArticle.description
      .replace(/\r\n/g, "\n")
      .replace(/\n/g, "<br />"),
  }}
/>


        {/* BACK */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-red-600"
          >
            ← সব খবর দেখুন
          </Link>
        </div>

      </article>

      {/* =====================================================
          FOOTER — EXACT HOME PAGE STYLE
      ====================================================== */}
      <footer className="mt-12 bg-[#18295f] text-white">

        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <p className="text-xl font-medium text-white sm:text-2xl">
                {site.site_name}
              </p>

              <p className="mt-2 text-base text-white sm:text-lg">
                {site.tagline}
              </p>
            </div>

            <Link
              href="/admin"
              className="text-base text-white transition hover:text-blue-200 sm:text-lg"
            >
              অ্যাডমিন প্যানেল
            </Link>

          </div>

          <div className="mt-8 border-t border-blue-400/40 pt-6 text-sm text-blue-200 sm:text-base">
            © 2026 {site.site_name}. সর্বস্বত্ব সংরক্ষিত।
          </div>

        </div>
      </footer>

    </main>
  );
}
