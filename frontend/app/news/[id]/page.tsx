import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
import ViewTracker from "./ViewTracker";

export const dynamic = "force-dynamic";

type SiteSettings = {
  site_name: string | null;
  tagline: string | null;
  logo_url: string | null;
};

type NewsItem = {
  id: number;
  slug: string | null;
  title: string;
  description: string | null;
  category: string;
  image: string | null;
  published_at: string;
  breaking: boolean;
};

const CATEGORY_SLUGS: Record<string, string> = {
  "দেশের কথা": "desher-kotha",
  "বিশ্বের জানালা": "biswer-janala",
  "বাংলার দিনলিপি": "banglar-dinlipi",
  "মাঠের লড়াই": "mather-lorai",
  "রুপোলি পর্দা": "rupoli-porda",
  "শরীর-মন": "shorir-mon",
  "ঘোরাঘুরি": "ghoraghuri",
};

function toBengaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

// একই তারিখের ফরম্যাট category page-এর header-এর মতো রাখা হয়েছে।
function formatHeaderDate(): string {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("bn-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(now);

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).formatToParts(now);
  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");

  const gregorianMonths = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];

  const bengaliMonths = [
    { name: "বৈশাখ", start: "2026-04-15", year: 1433 },
    { name: "জ্যৈষ্ঠ", start: "2026-05-15", year: 1433 },
    { name: "আষাঢ়", start: "2026-06-15", year: 1433 },
    { name: "শ্রাবণ", start: "2026-07-16", year: 1433 },
    { name: "ভাদ্র", start: "2026-08-17", year: 1433 },
    { name: "আশ্বিন", start: "2026-09-18", year: 1433 },
    { name: "কার্তিক", start: "2026-10-18", year: 1433 },
    { name: "অগ্রহায়ণ", start: "2026-11-17", year: 1433 },
    { name: "পৌষ", start: "2026-12-17", year: 1433 },
    { name: "মাঘ", start: "2027-01-15", year: 1433 },
    { name: "ফাল্গুন", start: "2027-02-14", year: 1433 },
    { name: "চৈত্র", start: "2027-03-15", year: 1433 },
    { name: "বৈশাখ", start: "2027-04-15", year: 1434 },
  ];

  const currentKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  let selectedMonth = bengaliMonths[0];
  for (const item of bengaliMonths) {
    if (currentKey >= item.start) selectedMonth = item;
  }

  const [startYear, startMonth, startDay] = selectedMonth.start.split("-").map(Number);
  const currentUTC = Date.UTC(year, month - 1, day);
  const startUTC = Date.UTC(startYear, startMonth - 1, startDay);
  const diffDays = Math.floor((currentUTC - startUTC) / (24 * 60 * 60 * 1000));
  const bengaliDay = diffDays + 1;

  return `${weekday}, ${toBengaliDigits(bengaliDay)} ${selectedMonth.name} ${toBengaliDigits(selectedMonth.year)} | ${toBengaliDigits(day)} ${gregorianMonths[month - 1]} ${toBengaliDigits(year)}`;
}

function formatPublishedDate(date: string): string {
  return new Intl.DateTimeFormat("bn-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

function SiteHeader({ siteName, logoUrl, formattedDate }: {
  siteName: string;
  logoUrl: string | null;
  formattedDate: string;
}) {
  return (
    <>
      <header className="border-b-4 border-red-600 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-16 w-auto max-w-[180px] object-contain sm:h-20 sm:max-w-[230px] md:h-24 md:max-w-[280px]" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-900 text-xl font-extrabold text-white sm:h-20 sm:w-20">বাং</div>
              )}
            </Link>
            <form action="/" method="GET" className="flex min-w-0 flex-1 justify-end gap-2">
              <input type="search" name="q" placeholder="খবর খুঁজুন..." aria-label="খবর খুঁজুন" className="min-w-0 w-full max-w-[420px] rounded-lg border-2 border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-900 sm:px-4" />
              <button type="submit" className="shrink-0 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 sm:px-5">খুঁজুন</button>
            </form>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-gray-600 sm:text-xs">{formattedDate}</div>
        </div>
      </header>

      <nav className="sticky top-0 z-50 bg-blue-900 shadow-lg">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-4 overflow-x-auto px-3 py-3 text-sm font-semibold text-white sm:gap-6 sm:px-4">
            <Link href="/" aria-label="Home" title="Home" className="flex shrink-0 items-center text-lg transition hover:text-red-300">🏠</Link>
            {Object.entries(CATEGORY_SLUGS).map(([name, categorySlug]) => (
              <Link key={categorySlug} href={`/category/${categorySlug}`} className="shrink-0 whitespace-nowrap transition hover:text-red-300">{name}</Link>
            ))}
            <Link href="/health-talk" className="shrink-0 whitespace-nowrap transition hover:text-red-300">Health Talk</Link>
          </div>
        </div>
      </nav>
    </>
  );
}

function SiteFooter({ siteName, tagline }: { siteName: string; tagline: string }) {
  return (
    <footer className="mt-12 bg-blue-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-white">{siteName}</p>
            <p className="mt-1 text-sm text-blue-200">{tagline}</p>
          </div>
          <Link href="/admin" className="text-sm text-blue-200 transition hover:text-white">অ্যাডমিন প্যানেল</Link>
        </div>
        <div className="mt-5 border-t border-blue-800 pt-4 text-sm text-blue-300">© 2026 {siteName}. সর্বস্বত্ব সংরক্ষিত।</div>
      </div>
    </footer>
  );
}

export default async function NewsDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  // ID ও slug—দুই ধরনের পুরোনো/নতুন URL-ই কাজ করবে।
  const articleQuery = async () => {
    if (/^\d+$/.test(decodedId)) {
      return supabase.from("news").select("*").eq("id", Number(decodedId)).maybeSingle();
    }

    const currentSlug = await supabase.from("news").select("*").eq("slug", decodedId).maybeSingle();
    if (currentSlug.data || currentSlug.error) return currentSlug;
    return supabase.from("news").select("*").eq("old_slug", decodedId).maybeSingle();
  };

  const [{ data: article, error }, { data: settings }] = await Promise.all([
    articleQuery(),
    supabase.from("site_settings").select("site_name, tagline, logo_url").eq("id", 1).maybeSingle(),
  ]);

  if (article && !/^\d+$/.test(decodedId) && article.old_slug === decodedId && article.slug && article.slug !== decodedId) {
    redirect(`/news/${article.slug}`);
  }

  const siteName = settings?.site_name || "বাংলার সংবাদ";
  const tagline = settings?.tagline || "সত্যের সঙ্গে, মানুষের পাশে";
  const logoUrl = settings?.logo_url || null;
  const formattedDate = formatHeaderDate();

  if (error || !article) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <SiteHeader siteName={siteName} logoUrl={logoUrl} formattedDate={formattedDate} />
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="text-5xl">📰</div>
          <h1 className="mt-5 text-3xl font-extrabold">খবরটি পাওয়া যায়নি</h1>
          <p className="mt-3 text-gray-600">এই খবরটি ডেটাবেসে পাওয়া যাচ্ছে না।</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-red-600">← হোম পেজে ফিরে যান</Link>
        </section>
        <SiteFooter siteName={siteName} tagline={tagline} />
      </main>
    );
  }

  const newsArticle = article as NewsItem;
  const description = newsArticle.description || "";

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader siteName={siteName} logoUrl={logoUrl} formattedDate={formattedDate} />

      <article className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <ViewTracker newsId={newsArticle.id} />
        <p className="mb-3 text-sm font-bold text-red-600">{newsArticle.category}</p>
        <h1 className="text-3xl font-extrabold leading-tight text-blue-950 md:text-5xl">{newsArticle.title}</h1>
        <p className="mt-4 text-sm text-gray-500">প্রকাশিত: {formatPublishedDate(newsArticle.published_at)}</p>

        {newsArticle.breaking && (
          <div className="mt-5 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">🔥 BREAKING NEWS</div>
        )}

        <div className="mt-8 overflow-hidden rounded-xl bg-gray-100">
          <img src={newsArticle.image || "/news-placeholder.jpg"} alt={newsArticle.title} className="h-auto max-h-[600px] w-full object-cover" />
        </div>

        <div
          className="mt-8 text-lg leading-8 text-gray-700 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2"
          dangerouslySetInnerHTML={{
            __html: description.replace(/\r\n/g, "\n").replace(/\n/g, "<br />"),
          }}
        />

        <div className="mt-10">
          <Link href="/" className="inline-block rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-red-600">← সব খবর দেখুন</Link>
        </div>
      </article>

      <SiteFooter siteName={siteName} tagline={tagline} />
    </main>
  );
}
