"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // Add News form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("দেশের কথা");
  const [description, setDescription] = useState("");
  const [breaking, setBreaking] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  // Success / error state
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const menuItems = [
    "Dashboard",
    "News",
    "Add News",
    "Categories",
    "Media",
    "Settings",
  ];

  // ================= PUBLISH NEWS =================
  const handlePublish = async () => {
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("News Title দিন।");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Description দিন।");
      return;
    }

    setIsPublishing(true);

    try {
      const { error } = await supabase.from("news").insert([
        {
          title: title.trim(),
          category,
          description: description.trim(),
          image: image ? image.name : null,
          breaking,
        },
      ]);

      if (error) {
        console.error("Supabase Insert Error:", error);
        setErrorMessage(error.message);
        return;
      }

      setShowSuccess(true);
    } catch (error) {
      console.error("Unexpected Error:", error);
      setErrorMessage("News publish করার সময় একটি সমস্যা হয়েছে।");
    } finally {
      setIsPublishing(false);
    }
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setShowSuccess(false);
    setTitle("");
    setDescription("");
    setCategory("দেশের কথা");
    setBreaking(false);
    setImage(null);
    setErrorMessage("");
  };

  return (
    <main className="min-h-screen bg-gray-100 text-black">

      {/* ================= SUCCESS SCREEN ================= */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl font-bold text-green-600">
              ✓
            </div>

            <h2 className="mt-6 text-2xl font-extrabold">
              News Published Successfully
            </h2>

            <p className="mt-3 text-gray-500">
              আপনার News database-এ সফলভাবে save হয়েছে।
            </p>

            <div className="mt-5 rounded-lg bg-gray-50 p-4 text-left">
              <p className="text-xs font-semibold text-gray-500">
                NEWS TITLE
              </p>

              <p className="mt-1 font-bold">
                {title}
              </p>

              <p className="mt-3 text-xs font-semibold text-gray-500">
                CATEGORY
              </p>

              <p className="mt-1 text-sm">
                {category}
              </p>
            </div>

            <button
              onClick={resetForm}
              className="mt-6 w-full rounded-lg bg-black px-6 py-3 font-bold text-white transition hover:bg-gray-800"
            >
              Continue
            </button>

          </div>
        </div>
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-200 bg-black text-white md:block">

        <div className="border-b border-gray-800 px-6 py-6">
          <h1 className="text-2xl font-extrabold">
            বাংলার সংবাদ
          </h1>

          <p className="mt-1 text-xs text-gray-400">
            Admin Panel
          </p>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveMenu(item)}
              className={`mb-2 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                activeMenu === item
                  ? "bg-white text-black"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full rounded-lg border border-gray-700 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800"
          >
            ← Website
          </button>
        </div>

      </aside>

      {/* ================= MAIN AREA ================= */}
      <div className="md:ml-64">

        {/* ================= TOP BAR ================= */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4 md:px-8">

            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                {activeMenu}
              </h2>

              <p className="text-xs text-gray-500">
                বাংলার সংবাদ Admin Panel
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold">
                  Admin
                </p>

                <p className="text-xs text-gray-500">
                  Administrator
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                A
              </div>

            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <div className="p-4 md:p-8">

          {/* ================= DASHBOARD ================= */}
          {activeMenu === "Dashboard" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">
                    Total News
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold">
                    3
                  </h3>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">
                    Categories
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold">
                    7
                  </h3>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">
                    Breaking News
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold">
                    1
                  </h3>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-sm text-gray-500">
                    Media
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold">
                    1
                  </h3>
                </div>

              </div>

              <section className="mt-8">
                <h3 className="text-xl font-bold">
                  Quick Actions
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  <button
                    onClick={() => setActiveMenu("Add News")}
                    className="rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <p className="text-2xl">📰</p>

                    <h4 className="mt-3 font-bold">
                      Add New News
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      নতুন খবর প্রকাশ করুন
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveMenu("Media")}
                    className="rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <p className="text-2xl">🖼️</p>

                    <h4 className="mt-3 font-bold">
                      Media Library
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      ছবি ও media manage করুন
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveMenu("Settings")}
                    className="rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <p className="text-2xl">⚙️</p>

                    <h4 className="mt-3 font-bold">
                      Website Settings
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      Logo ও website settings
                    </p>
                  </button>

                </div>
              </section>

              <section className="mt-8">
                <h3 className="text-xl font-bold">
                  Recent News
                </h3>

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left">

                      <thead className="border-b bg-gray-50 text-sm">
                        <tr>
                          <th className="px-5 py-4">
                            Title
                          </th>

                          <th className="px-5 py-4">
                            Category
                          </th>

                          <th className="px-5 py-4">
                            Status
                          </th>

                          <th className="px-5 py-4">
                            Time
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        <tr className="border-b">
                          <td className="px-5 py-4 font-semibold">
                            বাংলার গুরুত্বপূর্ণ খবর ও দিনের প্রধান সংবাদ
                          </td>

                          <td className="px-5 py-4 text-sm">
                            দেশের কথা
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                              Published
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-500">
                            ১০ মিনিট আগে
                          </td>
                        </tr>

                        <tr className="border-b">
                          <td className="px-5 py-4 font-semibold">
                            বাংলার নতুন খবর ও আপডেট
                          </td>

                          <td className="px-5 py-4 text-sm">
                            দেশের কথা
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                              Published
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-500">
                            ২৫ মিনিট আগে
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ================= NEWS ================= */}
          {activeMenu === "News" && (
            <section>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h3 className="text-2xl font-bold">
                    All News
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    আপনার website-এর সব খবর এখানে থাকবে।
                  </p>
                </div>

                <button
                  onClick={() => setActiveMenu("Add News")}
                  className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  + Add News
                </button>

              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[700px]">

                    <thead className="border-b bg-gray-50 text-left text-sm">
                      <tr>
                        <th className="px-5 py-4">
                          News
                        </th>

                        <th className="px-5 py-4">
                          Category
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {[
                        "বাংলার গুরুত্বপূর্ণ খবর ও দিনের প্রধান সংবাদ",
                        "বাংলার নতুন খবর ও আপডেট",
                        "দেশের বিভিন্ন প্রান্তের খবর",
                      ].map((newsTitle, index) => (
                        <tr
                          key={index}
                          className="border-b last:border-0"
                        >

                          <td className="px-5 py-4 font-semibold">
                            {newsTitle}
                          </td>

                          <td className="px-5 py-4 text-sm">
                            দেশের কথা
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                              Published
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button className="mr-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100">
                              Edit
                            </button>

                            <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                              Delete
                            </button>
                          </td>

                        </tr>
                      ))}

                    </tbody>
                  </table>

                </div>
              </div>

            </section>
          )}

          {/* ================= ADD NEWS ================= */}
          {activeMenu === "Add News" && (
            <section>

              <h3 className="text-2xl font-bold">
                Add New News
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                নতুন খবরের তথ্য দিন।
              </p>

              <div className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">

                <div className="space-y-5">

                  {/* News Title */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      News Title
                    </label>

                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="খবরের শিরোনাম লিখুন"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Category
                    </label>

                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                    >
                      <option>দেশের কথা</option>
                      <option>বিশ্বের জানালা</option>
                      <option>বাংলার দিনলিপি</option>
                      <option>মাঠের লড়াই</option>
                      <option>রুপোলি পর্দা</option>
                      <option>শরীর-মন</option>
                      <option>ঘোরাঘুরি</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Description
                    </label>

                    <textarea
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="খবরের বিস্তারিত লিখুন"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  {/* News Image */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      News Image
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImage(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
                    />

                    {image && (
                      <p className="mt-2 text-sm text-gray-500">
                        Selected: {image.name}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-400">
                      আপাতত শুধু image filename database-এ save হবে।
                      পরে Supabase Storage দিয়ে actual image upload করব।
                    </p>
                  </div>

                  {/* Breaking News */}
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={breaking}
                      onChange={(e) => setBreaking(e.target.checked)}
                      className="h-4 w-4"
                    />

                    <span className="text-sm font-semibold">
                      Breaking News হিসেবে প্রকাশ করুন
                    </span>
                  </label>

                  {/* Error */}
                  {errorMessage && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <p className="font-bold">
                        Publish করা যায়নি
                      </p>

                      <p className="mt-1">
                        {errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Publish Button */}
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="rounded-lg bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPublishing ? "Publishing..." : "Publish News"}
                  </button>

                </div>
              </div>

            </section>
          )}

          {/* ================= CATEGORIES ================= */}
          {activeMenu === "Categories" && (
            <section>

              <h3 className="text-2xl font-bold">
                Categories
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {[
                  "দেশের কথা",
                  "বিশ্বের জানালা",
                  "বাংলার দিনলিপি",
                  "মাঠের লড়াই",
                  "রুপোলি পর্দা",
                  "শরীর-মন",
                  "ঘোরাঘুরি",
                ].map((categoryName) => (
                  <div
                    key={categoryName}
                    className="rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <h4 className="font-bold">
                      {categoryName}
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      Category
                    </p>
                  </div>
                ))}

              </div>

            </section>
          )}

          {/* ================= MEDIA ================= */}
          {activeMenu === "Media" && (
            <section>

              <h3 className="text-2xl font-bold">
                Media Library
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Website-এর ছবি ও media এখানে manage করা হবে।
              </p>

              <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">

                <div className="text-5xl">
                  🖼️
                </div>

                <h4 className="mt-4 text-lg font-bold">
                  Upload Image
                </h4>

                <p className="mt-2 text-sm text-gray-500">
                  JPG, PNG বা WebP image upload করুন।
                </p>

                <button className="mt-5 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white">
                  Choose Image
                </button>

              </div>

            </section>
          )}

          {/* ================= SETTINGS ================= */}
          {activeMenu === "Settings" && (
            <section>

              <h3 className="text-2xl font-bold">
                Website Settings
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Website-এর basic settings এখানে পরিবর্তন করা যাবে।
              </p>

              <div className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">

                <div className="space-y-6">

                  {/* Logo */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Website Logo
                    </label>

                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">

                      <p className="text-3xl font-extrabold">
                        বাংলার সংবাদ
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        বর্তমান Logo
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        className="mt-5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
                      />

                    </div>
                  </div>

                  {/* Website Name */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Website Name
                    </label>

                    <input
                      type="text"
                      defaultValue="বাংলার সংবাদ"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Tagline
                    </label>

                    <input
                      type="text"
                      defaultValue="সত্যের সঙ্গে, মানুষের পাশে"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <button className="rounded-lg bg-black px-6 py-3 font-bold text-white hover:bg-gray-800">
                    Save Settings
                  </button>

                </div>
              </div>

            </section>
          )}

        </div>
      </div>
    </main>
  );
}