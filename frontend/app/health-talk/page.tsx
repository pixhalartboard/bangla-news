import Link from "next/link";
import { supabase } from "@/lib/supabase";

type HealthTalkItem = {
  id: number;
  title: string;
  description: string;
  image: string | null;
  published_at: string;
  youtube_url: string | null;
};

type SiteSettings = {
  site_name: string;
  tagline: string;
  logo_url: string | null;
};

const menuItems = [
  "দেশের কথা",
  "বিশ্বের জানালা",
  "বাংলার দিনলিপি",
  "মাঠের লড়াই",
  "রুপোলি পর্দা",
  "শরীর-মন",
  "ঘোরাঘুরি",
];

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

  /*
   * পশ্চিমবঙ্গের বাংলা পঞ্জিকা অনুযায়ী ২০২৬-২৭ সালের
   * প্রয়োজনীয় বাংলা মাসের শুরুর তারিখ।
   *
   * ২৭ সেপ্টেম্বর ২০২৬ =
   * ১০ আশ্বিন ১৪৩৩
   */
  const banglaMonthStarts = [
    { start: new Date(2026, 3, 15), name: "বৈশাখ", year: 1433 },
    { start: new Date(2026, 4, 15), name: "জ্যৈষ্ঠ", year: 1433 },
    { start: new Date(2026, 5, 15), name: "আষাঢ়", year: 1433 },
    { start: new Date(2026, 6, 16), name: "শ্রাবণ", year: 1433 },
    { start: new Date(2026, 7, 17), name: "ভাদ্র", year: 1433 },
    { start: new Date(2026, 8, 18), name: "আশ্বিন", year: 1433 },
    { start: new Date(2026, 9, 18), name: "কার্তিক", year: 1433 },
    { start: new Date(2026, 10, 17), name: "অগ্রহায়ণ", year: 1433 },
    { start: new Date(2026, 11, 17), name: "পৌষ", year: 1433 },

    { start: new Date(2027, 0, 16), name: "মাঘ", year: 1433 },
    { start: new Date(2027, 1, 14), name: "ফাল্গুন", year: 1433 },
    { start: new Date(2027, 2, 15), name: "চৈত্র", year: 1433 },
    { start: new Date(2027, 3, 15), name: "বৈশাখ", year: 1434 },
  ];

  const current = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  let selectedMonth = banglaMonthStarts[0];

  for (const item of banglaMonthStarts) {
    if (current >= item.start) {
      selectedMonth = item;
    }
  }

  const diffDays = Math.floor(
    (current.getTime() - selectedMonth.start.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const banglaDay = diffDays + 1;

  return `${toBengaliDigits(banglaDay)} ${
    selectedMonth.name
  } ${toBengaliDigits(selectedMonth.year)} • ${
    weekdays[date.getDay()]
  } • ${toBengaliDigits(date.getDate())} ${
    gregorianMonths[date.getMonth()]
  } ${toBengaliDigits(date.getFullYear())}`;
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

  const site: SiteSettings = {
    site_name: settings?.site_name ?? "বাংলার সংবাদ",
    tagline: settings?.tagline ?? "সত্যের সঙ্গে, মানুষের পাশে",
    logo_url: settings?.logo_url ?? null,
  };

  const allVideos = (healthTalk ?? []) as HealthTalkItem[];

  const videos = searchQuery
    ? allVideos.filter((video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allVideos;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b-4 border-red-600 bg-white">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">

          {/* LOGO + SEARCH */}
          <div className="flex items-center justify-between gap-3">

            {/* LOGO */}
            <Link href="/" className="shrink-0">
              {site.logo_url ? (
                <img
                  src={site.logo_url}
                  alt={site.site_name}
                  className="h-16 w-auto max-w-[180px] object-contain sm:h-20 sm:max-w-[240px] md:h-24 md:max-w-[280px]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-900 text-xl font-extrabold text-white sm:h-20 sm:w-20">
                  বাং
                </div>
              )}
            </Link>

            {/* SEARCH */}
            <form
              action="/health-talk"
              method="GET"
              className="flex min-w-0 flex-1 justify-end gap-2"
            >
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="খুঁজুন..."
                aria-label="হেলথ টক খুঁজুন"
                className="min-w-0 w-full max-w-[420px] rounded-lg border-2 border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-900 sm:px-4"
              />

              <button
                type="submit"
                className="shrink-0 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 sm:px-5"
              >
                Search
              </button>
            </form>
          </div>

          {/* DATE */}
          <div className="mt-2 text-sm font-semibold text-blue-950 sm:text-base">
            {formatBanglaHeaderDate(new Date())}
          </div>

        </div>
      </header>

      {/* Fixed / sticky menu */}
      <nav className="sticky top-0 z-50 border-b-4 border-red-600 bg-blue-900 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 sm:gap-4 sm:px-4 lg:px-6">
          <Link
            href="/"
            aria-label="Home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl transition hover:bg-blue-800"
          >
            🏠
          </Link>

          {menuItems.map((item) => (
            <Link
              key={item}
              href={`/?category=${encodeURIComponent(item)}`}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition hover:bg-blue-800"
            >
              {item}
            </Link>
          ))}

          <Link
            href="/health-talk"
            className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold whitespace-nowrap text-white"
          >
            হেলথ টক
          </Link>
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

      <footer className="mt-12 bg-[#18295f] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

            {/* SITE INFO */}
            <div>
              <p className="text-xl font-medium text-white sm:text-2xl">
                {site.site_name}
              </p>

              <p className="mt-2 text-base text-white sm:text-lg">
                {site.tagline}
              </p>
            </div>

            {/* ADMIN PANEL - NORMAL TEXT */}
            <Link
              href="/admin"
              className="text-base text-white transition hover:text-blue-200 sm:text-lg"
            >
              অ্যাডমিন প্যানেল
            </Link>

          </div>

          {/* DIVIDER + COPYRIGHT */}
          <div className="mt-8 border-t border-blue-400/40 pt-6 text-sm text-blue-200 sm:text-base">
            © {new Date().getFullYear()} {site.site_name}. সর্বস্বত্ব সংরক্ষিত।
          </div>

        </div>
      </footer>
    </main>
  );
}
