import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type HealthTalkItem = {
  id: number;
  title: string;
  description: string;
  image: string | null;
  published_at: string;
  youtube_url: string | null;
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

function getYouTubeId(url: string | null) {
  if (!url) return "";

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace("www.", "").toLowerCase();

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") || "";
      }

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (
        parts[0] === "shorts" ||
        parts[0] === "embed" ||
        parts[0] === "live"
      ) {
        return parts[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}


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



  const getPart = (type: string) =>

    Number(parts.find((part) => part.type === type)?.value);



  const day = getPart("day");

  const month = getPart("month");

  const year = getPart("year");



  const bengaliDigits = (value: string | number) =>

    String(value).replace(

      /[0-9]/g,

      (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]

    );



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



  const currentKey = `${year}-${String(month).padStart(2, "0")}-${String(

    day

  ).padStart(2, "0")}`;



  let selectedMonth = bengaliMonths[0];



  for (const item of bengaliMonths) {

    if (currentKey >= item.start) {

      selectedMonth = item;

    }

  }



  const [startYear, startMonth, startDay] = selectedMonth.start

    .split("-")

    .map(Number);



  const currentUTC = Date.UTC(year, month - 1, day);

  const startUTC = Date.UTC(startYear, startMonth - 1, startDay);



  const diffDays = Math.floor(

    (currentUTC - startUTC) / (24 * 60 * 60 * 1000)

  );



  const bengaliDay = diffDays + 1;



  return `${weekday}, ${bengaliDigits(bengaliDay)} ${

    selectedMonth.name

  } ${bengaliDigits(selectedMonth.year)} | ${bengaliDigits(day)} ${

    gregorianMonths[month - 1]

  } ${bengaliDigits(year)}`;

}



export default async function HealthTalkPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() || "";

  const [{ data: settings }, { data: healthTalk, error }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("site_name, tagline, logo_url")
      .eq("id", 1)
      .maybeSingle(),

    supabase
      .from("news")
      .select("id, title, description, image, published_at, youtube_url")
      .eq("category", "Health Talk")
      .not("youtube_url", "is", null)
      .order("published_at", { ascending: false }),
  ]);

  const siteName = settings?.site_name || "বাংলার সংবাদ";
  const tagline = settings?.tagline || "সত্যের সঙ্গে, মানুষের পাশে";
  const logoUrl = settings?.logo_url || null;
  const formattedDate = formatHeaderDate();

  const allVideos = (healthTalk ?? []) as HealthTalkItem[];

  const videos = searchQuery
    ? allVideos.filter((video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allVideos;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b-4 border-red-600 bg-white shadow-sm">

        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">

          <div className="flex items-center justify-between gap-3">

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



            <form

              action="/health-talk"

              method="GET"

              className="flex min-w-0 flex-1 justify-end gap-2"

            >

              <input

                type="search"

                name="q"

                defaultValue={searchQuery}

                placeholder="খবর খুঁজুন..."

                aria-label="হেলথ টক খুঁজুন"

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



      {/* NAVIGATION MENU */}



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



            {Object.entries(CATEGORY_SLUGS).map(

              ([name, categorySlug]) => (

                <Link

                  key={categorySlug}

                  href={`/category/${categorySlug}`}

                  className="shrink-0 whitespace-nowrap transition hover:text-red-300"

                >

                  {name}

                </Link>

              )

            )}



            <Link

              href="/health-talk"

              aria-current="page"

              className="shrink-0 whitespace-nowrap font-bold text-red-300 transition hover:text-red-200"

            >

              Health Talk

            </Link>

          </div>

        </div>

      </nav>



      {/* Page content */}
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-wider text-red-600">
            হেলথ টক
          </p>

          <h2 className="mt-1 text-3xl font-extrabold text-blue-950">
            স্বাস্থ্য নিয়ে কথা
          </h2>

          <p className="mt-2 max-w-2xl text-gray-600">
            স্বাস্থ্য, শরীর ও সুস্থ জীবনযাপন নিয়ে আমাদের হেলথ টক ভিডিও।
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            হেলথ টক লোড করা যাচ্ছে না।
            <p className="mt-1 text-sm">{error.message}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center sm:p-10">
            <div className="text-4xl">🎥</div>

            <h3 className="mt-4 text-xl font-bold text-blue-950">
              {searchQuery
                ? "কোনও অনুসন্ধানের ফল পাওয়া যায়নি"
                : "এখনও কোনো হেলথ টক ভিডিও প্রকাশিত হয়নি"}
            </h3>

            <p className="mt-2 text-gray-500">
              {searchQuery
                ? `“${searchQuery}” নামে কোনও হেলথ টক পাওয়া যায়নি।`
                : "অ্যাডমিন প্যানেল থেকে হেলথ টক ভিডিও প্রকাশ করলে এখানে দেখা যাবে।"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => {
              const videoId = getYouTubeId(video.youtube_url);

              const thumbnail =
                video.image ||
                (videoId
                  ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  : "");

              return (
                <article
                  key={video.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <a
                    href={
                      video.youtube_url ||
                      (videoId
                        ? `https://www.youtube.com/watch?v=${videoId}`
                        : "#")
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-video overflow-hidden bg-gray-100"
                  >
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        থাম্বনেইল নেই
                      </div>
                    )}

                    <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-xl transition group-hover:scale-110">
                      ▶
                    </span>
                  </a>

                  <div className="p-5">
                    <p className="text-xs font-semibold text-gray-500">
                      {formatDate(video.published_at)}
                    </p>

                    <h3 className="mt-3 line-clamp-2 text-xl font-bold leading-snug text-blue-950">
                      {video.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                      {video.description}
                    </p>

                    <a
                      href={
                        video.youtube_url ||
                        (videoId
                          ? `https://www.youtube.com/watch?v=${videoId}`
                          : "#")
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                    >
                      ইউটিউবে দেখুন ▶
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="mt-12 bg-blue-950 text-white">

        <div className="mx-auto max-w-7xl px-4 py-7">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="font-medium text-white">{siteName}</p>



              <p className="mt-1 text-sm text-blue-200">

                {tagline}

              </p>

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
