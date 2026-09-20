export type News = {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
  publishedAt: string;
  breaking: boolean;
};

export const news: News[] = [
  {
    id: 1,
    title: "বাংলার গুরুত্বপূর্ণ খবর ও দিনের প্রধান সংবাদ",
    description:
      "আজকের গুরুত্বপূর্ণ খবর এবং সর্বশেষ আপডেট এখানে প্রকাশিত হবে।",
    category: "দেশের কথা",
    image: "/news-placeholder.jpg",
    publishedAt: "১০ মিনিট আগে",
    breaking: true,
  },

  {
    id: 2,
    title: "বাংলার নতুন খবর ও আপডেট",
    description:
      "দেশের বিভিন্ন প্রান্ত থেকে সর্বশেষ সংবাদ ও গুরুত্বপূর্ণ তথ্য।",
    category: "দেশের কথা",
    image: "/news-placeholder.jpg",
    publishedAt: "২৫ মিনিট আগে",
    breaking: false,
  },

  {
    id: 3,
    title: "দেশের বিভিন্ন প্রান্তের খবর",
    description:
      "রাজ্য ও দেশের বিভিন্ন জায়গার সর্বশেষ খবর এখানে পাওয়া যাবে।",
    category: "দেশের কথা",
    image: "/news-placeholder.jpg",
    publishedAt: "৪৫ মিনিট আগে",
    breaking: false,
  },
];