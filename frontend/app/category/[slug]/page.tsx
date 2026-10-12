

import { supabase } from "@/lib/supabase";

import Link from "next/link";

import { notFound } from "next/navigation";



export const dynamic = "force-dynamic";



type SiteSettings = {

  id: number;

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



const CATEGORIES: Record<string, string> = {

  "desher-kotha": "দেশের কথা",

  "biswer-janala": "বিশ্বের জানালা",

  "banglar-dinlipi": "বাংলার দিনলিপি",

  "mather-lorai": "মাঠের লড়াই",

  "rupoli-porda": "রুপোলি পর্দা",

  "shorir-mon": "শরীর-মন",

  "ghoraghuri": "ঘোরাঘুরি",

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



type PageProps = {

  params: Promise<{ slug: string }>;

};



function cleanDescription(

  description: string | null | undefined

): string {

  return (description || "")

    .replace(/<[^>]*>/g, " ")

    .replace(/&lt;/g, "<")

    .replace(/&gt;/g, ">")

    .replace(/&quot;/g, '"')

    .replace(/&#39;/g, "'")

    .replace(/&amp;/g, "&")

    .replace(/\s+/g, " ")

    .trim();

}



function formatDate(dateString: string): string {

  return new Date(dateString).toLocaleDateString("bn-IN", {

    day: "numeric",

    month: "long",

    year: "numeric",

    timeZone: "Asia/Kolkata",

  });

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



function NewsCard({ item }: { item: NewsItem }) {

  const newsUrl = `/news/${item.slug || item.id}`;



  return (

    <article className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">

      <div>

        <Link href={newsUrl} className="block overflow-hidden">

          <img

            src={item.image || "/news-placeholder.jpg"}

            alt={item.title}

            className="h-44 w-full object-cover transition duration-300 hover:scale-105"

          />

        </Link>



        <div className="p-4">

          {item.breaking && (

            <span className="mb-2 inline-block rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">

              BREAKING NEWS

            </span>

          )}



          <span className="text-xs font-bold text-red-600">

            {item.category}

          </span>



          <Link href={newsUrl}>

            <h2 className="mt-2 font-bold leading-6 text-blue-950 transition hover:text-red-600">

              {item.title}

            </h2>

          </Link>



          <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">

            {cleanDescription(item.description)}

          </p>



          <p className="mt-3 text-xs text-gray-500">

            {formatDate(item.published_at)}

          </p>

        </div>

      </div>



      <div className="px-4 pb-4 pt-1">

        <Link

          href={newsUrl}

          className="inline-block text-sm font-bold text-red-600 transition hover:underline"

        >

          বিস্তারিত পড়ুন →

        </Link>

      </div>

    </article>

  );

}



export default async function CategoryPage({ params }: PageProps) {

  const { slug } = await params;

  const category = CATEGORIES[slug];



  if (!category) {

    notFound();

  }



  const [

    { data: settingsData, error: settingsError },

    { data: newsData, error: newsError },

  ] = await Promise.all([

    supabase

      .from("site_settings")

      .select("id, site_name, tagline, logo_url")

      .eq("id", 1)

      .maybeSingle(),



    supabase

      .from("news")

      .select(

        "id, slug, title, description, category, image, published_at, breaking"

      )

      .in(
        "category",
        slug === "mather-lorai"
          ? ["মাঠের লড়াই", "মাঠের লড়াই"]
          : [category]
      )
      .order("published_at", { ascending: false }),

  ]);



  const settings = settingsData as SiteSettings | null;

  const news = (newsData ?? []) as NewsItem[];



  const siteName = settings?.site_name || "বাংলার সংবাদ";

  const tagline = settings?.tagline || "সত্যের সঙ্গে, মানুষের পাশে";

  const logoUrl = settings?.logo_url || null;



  const mainNews = news[0] || null;
  const otherNews = news.slice(1);

  // সর্বশেষ খবর: মূল খবর + পরের ৫টি খবর
  const sideNews = news.slice(0, 6);

  const formattedDate = formatHeaderDate();



  return (

    <main className="min-h-screen bg-white text-gray-900">

      {/* HEADER */}



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

                  aria-current={

                    slug === categorySlug ? "page" : undefined

                  }

                  className={`shrink-0 whitespace-nowrap transition hover:text-red-300 ${

                    slug === categorySlug ? "text-red-300" : ""

                  }`}

                >

                  {name}

                </Link>

              )

            )}



            <Link

              href="/health-talk"

              className="shrink-0 whitespace-nowrap transition hover:text-red-300"

            >

              Health Talk

            </Link>

          </div>

        </div>

      </nav>



      {/* ERROR MESSAGES */}



      {settingsError && (

        <div className="mx-auto max-w-7xl px-4 pt-5">

          <p className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">

            সাইটের কিছু তথ্য লোড করা যায়নি।

          </p>

        </div>

      )}



      {newsError && (

        <div className="mx-auto max-w-7xl px-4 pt-5">

          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">

            খবর লোড করা যায়নি। অনুগ্রহ করে পরে চেষ্টা করুন।

          </p>

        </div>

      )}



      {/* CATEGORY NEWS */}



      <section className="mx-auto max-w-7xl px-4 py-8">

        {newsError ? null : !mainNews ? (

          <div className="py-20 text-center">

            <div className="mx-auto max-w-xl rounded-xl border border-blue-100 bg-blue-50 p-8">

              <div className="mb-4 text-5xl">📰</div>



              <h2 className="text-2xl font-extrabold text-blue-900">

                এখনও কোনও খবর প্রকাশিত হয়নি

              </h2>



              <p className="mt-3 text-gray-600">

                এই বিভাগে নতুন খবর প্রকাশিত হলে এখানে দেখা যাবে।

              </p>



              <Link

                href="/"

                className="mt-6 inline-block rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-red-600"

              >

                সব খবর দেখুন

              </Link>

            </div>

          </div>

        ) : (

          <>

            {/* MAIN NEWS + SIDE NEWS */}



            <div className="grid gap-8 lg:grid-cols-3">

              {/* LATEST CATEGORY NEWS: LARGE */}



              <section className="lg:col-span-2">

                <article className="overflow-hidden rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">

                  {mainNews.breaking && (
                    <span className="mb-2 inline-block rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                      BREAKING NEWS
                    </span>
                  )}

                  <Link

                    href={`/news/${mainNews.slug || mainNews.id}`}

                  >

                    <h1 className="mt-2 text-2xl font-extrabold leading-tight text-blue-950 transition hover:text-red-600 md:text-3xl">

                      {mainNews.title}

                    </h1>

                  </Link>



                  <div className="my-5 overflow-hidden rounded-lg">

                    <Link

                      href={`/news/${mainNews.slug || mainNews.id}`}

                      className="block overflow-hidden"

                    >

                      <img

                        src={mainNews.image || "/news-placeholder.jpg"}

                        alt={mainNews.title}

                        className="h-64 w-full object-cover transition duration-300 hover:scale-105 md:h-96"

                      />

                    </Link>

                  </div>



                  <div>

                    <p className="line-clamp-3 leading-relaxed text-gray-600">

                      {cleanDescription(mainNews.description)}

                    </p>



                    <p className="mt-3 text-xs text-gray-500">

                      {formatDate(mainNews.published_at)}

                    </p>



                    <p className="mt-4 text-sm font-bold text-red-600">

                      <Link

                        href={`/news/${mainNews.slug || mainNews.id}`}

                        className="hover:underline"

                      >

                        বিস্তারিত পড়ুন →

                      </Link>

                    </p>

                  </div>

                </article>

              </section>



              {/* EXACTLY NEXT FIVE NEWS */}



              <aside>

                <h2 className="mb-4 border-b-4 border-red-600 pb-3 text-xl font-extrabold text-blue-950">

                  সর্বশেষ খবর

                </h2>



                <div className="space-y-4">

                  {sideNews.map((item) => (

                    <Link

                      key={item.id}

                      href={`/news/${item.slug || item.id}`}

                      className="block"

                    >

                      <article className="border-b border-gray-200 pb-4">

                        <span className="text-xs font-semibold text-red-600">

                          {formatDate(item.published_at)}

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



            {/* ALL REMAINING NEWS AS CARDS */}



            {otherNews.length > 0 && (

              <div className="mt-12">

                <h2 className="mb-5 border-b-2 border-blue-900 pb-3 text-xl font-extrabold text-blue-950 sm:text-2xl">

                  অন্যান্য খবর

                </h2>



                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">

                  {otherNews.map((item) => (

                    <NewsCard key={item.id} item={item} />

                  ))}

                </div>

              </div>

            )}

          </>

        )}

      </section>



      {/* FOOTER */}



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
