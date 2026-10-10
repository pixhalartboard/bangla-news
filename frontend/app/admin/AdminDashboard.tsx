"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createClient as createBrowserClient } from "@/lib/supabase/client";


type NewsItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string | null;
  published_at: string;
  breaking: boolean;
  youtube_url?: string | null;
};

type SiteSettings = {
  id: number;
  site_name: string;
  tagline: string;
  logo_url: string | null;
};

type NewsView = {
  news_id: number | null;
  viewed_at: string;
};

type MediaFile = {
  name: string;
  path: string;
  url: string;
  created_at?: string | null;
};

const categories = [
  "দেশের কথা",
  "বিশ্বের জানালা",
  "বাংলার দিনলিপি",
  "মাঠের লড়াই",
  "রুপোলি পর্দা",
  "শরীর-মন",
  "ঘোরাঘুরি",
  "Health Talk",
];

const menuItems = [
  "Dashboard",
  "News",
  "Add News",
  "Categories",
  "Media",
  "Settings",
  "Health Talk",
];

const BUCKET = "news-images";


function createNewsSlug(title: string, uniqueId?: number): string {
  // Bengali headline stays unchanged; only the URL slug is transliterated to English letters.
  const consonants: Record<string, string> = {
    "ক":"k","খ":"kh","গ":"g","ঘ":"gh","ঙ":"ng",
    "চ":"ch","ছ":"chh","জ":"j","ঝ":"jh","ঞ":"ny",
    "ট":"t","ঠ":"th","ড":"d","ঢ":"dh","ণ":"n",
    "ত":"t","থ":"th","দ":"d","ধ":"dh","ন":"n",
    "প":"p","ফ":"ph","ব":"b","ভ":"bh","ম":"m",
    "য":"j","র":"r","ল":"l","শ":"sh","ষ":"sh","স":"s","হ":"h",
    "ড়":"r","ঢ়":"rh","য়":"y","ৎ":"t"
  };
  const vowels: Record<string, string> = {
    "অ":"o","আ":"a","ই":"i","ঈ":"i","উ":"u","ঊ":"u",
    "ঋ":"ri","এ":"e","ঐ":"oi","ও":"o","ঔ":"ou"
  };
  const signs: Record<string, string> = {
    "া":"a","ি":"i","ী":"i","ু":"u","ূ":"u","ৃ":"ri",
    "ে":"e","ৈ":"oi","ো":"o","ৌ":"ou","্":""
  };
  const marks: Record<string, string> = {"ং":"ng","ঃ":"h","ঁ":"n"};
  const chars = Array.from(title.normalize("NFC").trim().toLowerCase());
  let output = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (consonants[ch]) {
      output += consonants[ch];
      const next = chars[i + 1];
      // Add Bengali's inherent "o" sound unless a vowel sign/virama follows.
      if (!next || !(next in signs)) output += "o";
    } else if (vowels[ch]) {
      output += vowels[ch];
    } else if (signs[ch] !== undefined) {
      output += signs[ch];
    } else if (marks[ch]) {
      output += marks[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      output += ch;
    } else {
      output += "-";
    }
  }
  const base = output
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "news";
  return uniqueId !== undefined ? `${base}-${uniqueId}` : base;
}

export default function AdminDashboard() {
  // =========================================================
  // MENU
  // =========================================================

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabaseAuth = createBrowserClient();
      await supabaseAuth.auth.signOut();
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout Error:", error);
      setIsLoggingOut(false);
      setErrorMessage("Logout করার সময় সমস্যা হয়েছে।");
    }
  };

  // =========================================================
  // NEWS
  // =========================================================

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // =========================================================
  // NEWS FORM
  // =========================================================

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const [breaking, setBreaking] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // =========================================================
  // EDIT
  // =========================================================

  const [editingId, setEditingId] = useState<number | null>(null);
  const [oldImage, setOldImage] = useState<string | null>(null);

  // =========================================================
  // NEWS UI
  // =========================================================

  const [isPublishing, setIsPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // =========================================================
  // SETTINGS
  // =========================================================

  const [siteSettings, setSiteSettings] =
    useState<SiteSettings | null>(null);

  const [siteName, setSiteName] = useState("বাংলার সংবাদ");

  const [tagline, setTagline] = useState(
    "সত্যের সঙ্গে, মানুষের পাশে"
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [isSavingSettings, setIsSavingSettings] =
    useState(false);

  const [isLoadingSettings, setIsLoadingSettings] =
    useState(false);

  // =========================================================
  // MEDIA
  // =========================================================

  const [mediaFiles, setMediaFiles] =
    useState<MediaFile[]>([]);

  const [isLoadingMedia, setIsLoadingMedia] =
    useState(false);

  const [mediaUploadFile, setMediaUploadFile] =
    useState<File | null>(null);

  const [isUploadingMedia, setIsUploadingMedia] =
    useState(false);

  const [deletingMediaPath, setDeletingMediaPath] =
    useState<string | null>(null);

  // =========================================================
  // CATEGORY FILTER
  // =========================================================

  const [selectedCategory, setSelectedCategory] =
    useState("সব");

  // =========================================================
  // COMMON UI
  // =========================================================

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // =========================================================
  // VIEWS ANALYTICS
  // =========================================================

  const [newsViews, setNewsViews] = useState<NewsView[]>([]);
  const [isLoadingViews, setIsLoadingViews] = useState(false);


  // =========================================================
  // FETCH NEWS
  // =========================================================

  const fetchNews = async () => {
    setIsLoadingNews(true);

    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Fetch News Error:",
          error
        );

        setErrorMessage(
          `News load হয়নি: ${error.message}`
        );

        return;
      }

      setNewsList((data ?? []) as NewsItem[]);
    } catch (error) {
      console.error(
        "Fetch News Unexpected Error:",
        error
      );

      setErrorMessage(
        "News load করার সময় সমস্যা হয়েছে।"
      );
    } finally {
      setIsLoadingNews(false);
    }
  };

  // =========================================================
  // FETCH SETTINGS
  // =========================================================

  const fetchSettings = async () => {
    setIsLoadingSettings(true);

    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "id, site_name, tagline, logo_url"
        )
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error(
          "Settings Fetch Error:",
          error
        );

        setErrorMessage(
          `Settings load হয়নি: ${error.message}`
        );

        return;
      }

      if (data) {
        const settings =
          data as SiteSettings;

        setSiteSettings(settings);

        setSiteName(
          settings.site_name ||
            "বাংলার সংবাদ"
        );

        setTagline(
          settings.tagline ||
            "সত্যের সঙ্গে, মানুষের পাশে"
        );

        setLogoPreview(
          settings.logo_url || null
        );
      } else {
        setSiteSettings(null);

        setSiteName("বাংলার সংবাদ");

        setTagline(
          "সত্যের সঙ্গে, মানুষের পাশে"
        );

        setLogoPreview(null);
      }
    } catch (error) {
      console.error(
        "Settings Unexpected Error:",
        error
      );

      setErrorMessage(
        "Settings load করার সময় সমস্যা হয়েছে।"
      );
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // =========================================================
  // FETCH VIEWS
  // =========================================================

  const fetchViews = async () => {
    setIsLoadingViews(true);

    try {
      const allViews: NewsView[] = [];
      const pageSize = 1000;
      let from = 0;

      while (true) {
        const supabaseAuth = createBrowserClient();

        const { data, error } = await supabaseAuth
          .from("news_views")
          .select("news_id, viewed_at")
          .order("viewed_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error("Fetch Views Error:", error);
          setNewsViews([]);
          return;
        }

        const page = (data ?? []) as NewsView[];
        allViews.push(...page);

        if (page.length < pageSize) break;
        from += pageSize;
      }

      setNewsViews(allViews);
    } catch (error) {
      console.error("Fetch Views Unexpected Error:", error);
      setNewsViews([]);
    } finally {
      setIsLoadingViews(false);
    }
  };

  // =========================================================
  // LOAD EVERYTHING
  // =========================================================

  useEffect(() => {
    fetchNews();
    fetchSettings();
    fetchMedia();
    fetchViews();
  }, []);

  // =========================================================
  // RESET NEWS FORM
  // =========================================================

  const resetForm = () => {
    setTitle("");
    setCategory(categories[0]);
    setDescription("");
    if (descriptionEditorRef.current) descriptionEditorRef.current.innerHTML = "";
    setBreaking(false);
    setImage(null);
    setYoutubeUrl("");
    setEditingId(null);
    setOldImage(null);

    setErrorMessage("");
    setSuccessMessage("");
  };

  // =========================================================
  // IMAGE UPLOAD HELPER
  // =========================================================

  const uploadImage = async (
    file: File,
    folder: string
  ): Promise<string | null> => {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const safeName = file.name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}-${safeName}.${extension}`;

    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      throw new Error(
        uploadError.message
      );
    }

    const { data } =
      supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // =========================================================
  // GET STORAGE PATH FROM PUBLIC URL
  // =========================================================

  const getStoragePathFromUrl = (
    imageUrl: string | null
  ): string | null => {
    if (!imageUrl) return null;

    const marker =
      `/storage/v1/object/public/${BUCKET}/`;

    if (!imageUrl.includes(marker)) {
      return null;
    }

    return (
      imageUrl.split(marker)[1] || null
    );
  };

  // =========================================================
  // DELETE STORAGE IMAGE
  // =========================================================

  const deleteStorageImage = async (
    imageUrl: string | null
  ) => {
    const filePath =
      getStoragePathFromUrl(imageUrl);

    if (!filePath) return;

    try {
      const { error } =
        await supabase.storage
          .from(BUCKET)
          .remove([filePath]);

      if (error) {
        console.error(
          "Storage Image Delete Error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Storage Image Delete Unexpected Error:",
        error
      );
    }
  };

  // =========================================================
  // PUBLISH / UPDATE NEWS
  // =========================================================

  const handlePublish = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage(
        "News Title দিন।"
      );
      return;
    }

    if (!description.trim()) {
      setErrorMessage(
        "Description দিন।"
      );
      return;
    }

    setIsPublishing(true);

    try {
      let imageUrl = oldImage;

      // NEW IMAGE UPLOAD
      if (image) {
        imageUrl = await uploadImage(
          image,
          "news"
        );
      }

      // UPDATE EXISTING NEWS
      if (editingId !== null) {
        const { error } =
          await supabase
            .from("news")
            .update({
              title: title.trim(),
              slug: createNewsSlug(title, editingId!),
              category,
              description:
                description.trim(),
              image: imageUrl,
              breaking,
              youtube_url:
                category === "Health Talk"
                  ? youtubeUrl.trim() || null
                  : null,
            })
            .eq("id", editingId);

        if (error) {
          console.error(
            "Update News Error:",
            error
          );

          setErrorMessage(
            `News update হয়নি: ${error.message}`
          );

          return;
        }

        // Delete old image if new image uploaded
        if (
          image &&
          oldImage &&
          oldImage !== imageUrl
        ) {
          await deleteStorageImage(
            oldImage
          );
        }

        setSuccessMessage(
          "News সফলভাবে update হয়েছে।"
        );
      }

      // INSERT NEW NEWS
      else {
        const { error } =
          await supabase
            .from("news")
            .insert([
              {
                title: title.trim(),
                slug: createNewsSlug(title, Date.now()),
                category,
                description:
                  description.trim(),
                image: imageUrl,
                breaking,
                youtube_url:
                  category === "Health Talk"
                    ? youtubeUrl.trim() || null
                    : null,
              },
            ]);

        if (error) {
          console.error(
            "Insert News Error:",
            error
          );

          setErrorMessage(
            `News publish হয়নি: ${error.message}`
          );

          return;
        }

        setSuccessMessage(
          "News সফলভাবে publish হয়েছে।"
        );
      }

      resetForm();

      await fetchNews();
      await fetchMedia();

      setActiveMenu("News");
    } catch (error) {
      console.error(
        "Publish Unexpected Error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? `News save হয়নি: ${error.message}`
          : "News save করার সময় সমস্যা হয়েছে।"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // =========================================================
  // EDIT NEWS
  // =========================================================

  const handleEdit = (
    item: NewsItem
  ) => {
    setEditingId(item.id);

    setTitle(item.title);

    setCategory(item.category);

    setDescription(item.description);
    if (descriptionEditorRef.current) {
      const savedDescription = item.description || "";
      if (/<\/?(p|br|strong|b|em|i|u|mark|h[1-6]|ul|ol|li|a)\b/i.test(savedDescription)) {
        descriptionEditorRef.current.innerHTML = savedDescription;
      } else {
        descriptionEditorRef.current.textContent = savedDescription;
      }
    }

    setBreaking(item.breaking);

    setYoutubeUrl(item.youtube_url || "");

    setOldImage(item.image);

    setImage(null);

    setErrorMessage("");
    setSuccessMessage("");

    setActiveMenu("Add News");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DELETE NEWS
  // =========================================================

  const handleDelete = async (
    item: NewsItem
  ) => {
    const confirmed =
      window.confirm(
        `আপনি কি "${item.title}" News টি delete করতে চান?`
      );

    if (!confirmed) return;

    setDeletingId(item.id);

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } =
        await supabase
          .from("news")
          .delete()
          .eq("id", item.id);

      if (error) {
        console.error(
          "Delete News Error:",
          error
        );

        setErrorMessage(
          `News delete হয়নি: ${error.message}`
        );

        return;
      }

      await deleteStorageImage(
        item.image
      );

      setSuccessMessage(
        "News সফলভাবে delete হয়েছে।"
      );

      await fetchNews();
      await fetchMedia();
    } catch (error) {
      console.error(
        "Delete News Unexpected Error:",
        error
      );

      setErrorMessage(
        "News delete করার সময় সমস্যা হয়েছে।"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // FETCH MEDIA
  // =========================================================

  const fetchMedia = async () => {
    setIsLoadingMedia(true);

    try {
      const folders = [
        "news",
        "media",
        "site",
      ];

      const allFiles: MediaFile[] = [];

      for (const folder of folders) {
        const { data, error } =
          await supabase.storage
            .from(BUCKET)
            .list(folder, {
              limit: 100,
              offset: 0,
              sortBy: {
                column: "created_at",
                order: "desc",
              },
            });

        if (error) {
          console.error(
            `Media folder ${folder} error:`,
            error
          );

          continue;
        }

        for (const file of data ?? []) {
          if (!file.name) continue;

          const path =
            `${folder}/${file.name}`;

          const {
            data: publicUrlData,
          } =
            supabase.storage
              .from(BUCKET)
              .getPublicUrl(path);

          allFiles.push({
            name: file.name,
            path,
            url:
              publicUrlData.publicUrl,
            created_at:
              file.created_at,
          });
        }
      }

      setMediaFiles(allFiles);
    } catch (error) {
      console.error(
        "Fetch Media Error:",
        error
      );
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // =========================================================
  // MEDIA UPLOAD
  // =========================================================

  const handleMediaUpload =
    async () => {
      if (!mediaUploadFile) {
        setErrorMessage(
          "আগে একটি image select করুন।"
        );

        return;
      }

      setIsUploadingMedia(true);

      setErrorMessage("");
      setSuccessMessage("");

      try {
        await uploadImage(
          mediaUploadFile,
          "media"
        );

        setMediaUploadFile(null);

        setSuccessMessage(
          "Image Media Library-তে upload হয়েছে।"
        );

        await fetchMedia();
      } catch (error) {
        console.error(
          "Media Upload Error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? `Image upload হয়নি: ${error.message}`
            : "Image upload হয়নি।"
        );
      } finally {
        setIsUploadingMedia(false);
      }
    };

  // =========================================================
  // DELETE MEDIA
  // =========================================================

  const handleDeleteMedia =
    async (
      file: MediaFile
    ) => {
      const confirmed =
        window.confirm(
          `"${file.name}" delete করতে চান?`
        );

      if (!confirmed) return;

      setDeletingMediaPath(
        file.path
      );

      setErrorMessage("");
      setSuccessMessage("");

      try {
        const { error } =
          await supabase.storage
            .from(BUCKET)
            .remove([file.path]);

        if (error) {
          setErrorMessage(
            `Media delete হয়নি: ${error.message}`
          );

          return;
        }

        setSuccessMessage(
          "Media সফলভাবে delete হয়েছে।"
        );

        await fetchMedia();
      } catch (error) {
        console.error(
          "Media Delete Error:",
          error
        );

        setErrorMessage(
          "Media delete করার সময় সমস্যা হয়েছে।"
        );
      } finally {
        setDeletingMediaPath(
          null
        );
      }
    };

  // =========================================================
  // COPY MEDIA URL
  // =========================================================

  const copyMediaUrl = async (
    url: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        url
      );

      setSuccessMessage(
        "Image URL copy হয়েছে।"
      );

      setErrorMessage("");
    } catch (error) {
      console.error(
        "Copy URL Error:",
        error
      );

      setErrorMessage(
        "URL copy করা যায়নি।"
      );
    }
  };

  // =========================================================
  // LOGO SELECT
  // =========================================================

  const handleLogoSelect = (
    file: File | null
  ) => {
    setLogoFile(file);

    if (file) {
      const previewUrl =
        URL.createObjectURL(file);

      setLogoPreview(previewUrl);
    }
  };

  // =========================================================
  // SAVE SETTINGS
  // =========================================================

  const handleSaveSettings =
    async () => {
      if (!siteName.trim()) {
        setErrorMessage(
          "Website Name দিন।"
        );

        return;
      }

      if (!tagline.trim()) {
        setErrorMessage(
          "Tagline দিন।"
        );

        return;
      }

      setIsSavingSettings(true);

      setErrorMessage("");
      setSuccessMessage("");

      try {
        let logoUrl =
          siteSettings?.logo_url ||
          null;

        // =====================================================
        // LOGO UPLOAD
        // =====================================================

        if (logoFile) {
          logoUrl =
            await uploadImage(
              logoFile,
              "site"
            );
        }

        // =====================================================
        // UPDATE EXISTING SETTINGS
        //
        // IMPORTANT:
        // এখানে id INSERT করা হচ্ছে না।
        // Existing id = 1 row update হচ্ছে।
        // =====================================================

        const { data, error } =
          await supabase
            .from("site_settings")
            .update({
              site_name:
                siteName.trim(),

              tagline:
                tagline.trim(),

              logo_url:
                logoUrl,
            })
            .eq("id", 1)
            .select()
            .single();

        if (error) {
          console.error(
            "Settings Save Error:",
            error
          );

          setErrorMessage(
            `Settings save হয়নি: ${error.message}`
          );

          return;
        }

        // =====================================================
        // UPDATE LOCAL STATE
        // =====================================================

        setSiteSettings(
          data as SiteSettings
        );

        setLogoFile(null);

        if (logoUrl) {
          setLogoPreview(
            logoUrl
          );
        }

        setSuccessMessage(
          "Website Settings সফলভাবে save হয়েছে।"
        );

        await fetchSettings();

        await fetchMedia();
      } catch (error) {
        console.error(
          "Settings Save Unexpected Error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? `Settings save হয়নি: ${error.message}`
            : "Settings save করার সময় সমস্যা হয়েছে।"
        );
      } finally {
        setIsSavingSettings(
          false
        );
      }
    };

  // =========================================================
  // CATEGORY COUNTS
  // =========================================================

  const categoryCounts =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      categories.forEach(
        (cat) => {
          counts[cat] =
            newsList.filter(
              (item) =>
                item.category ===
                cat
            ).length;
        }
      );

      return counts;
    }, [newsList]);

  // =========================================================
  // FILTERED NEWS
  // =========================================================

  const filteredNews =
    useMemo(() => {
      if (
        selectedCategory ===
        "সব"
      ) {
        return newsList;
      }

      return newsList.filter(
        (item) =>
          item.category ===
          selectedCategory
      );
    }, [
      newsList,
      selectedCategory,
    ]);

  // =========================================================
  // VIEWS ANALYTICS
  // =========================================================

  const viewAnalytics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfThisMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const todayViews = newsViews.filter(
      (view) => new Date(view.viewed_at) >= startOfToday
    ).length;

    const thisMonthViews = newsViews.filter(
      (view) => new Date(view.viewed_at) >= startOfThisMonth
    ).length;

    const lastMonthViews = newsViews.filter((view) => {
      const date = new Date(view.viewed_at);
      return date >= startOfLastMonth && date < endOfLastMonth;
    }).length;

    const totalViews = newsViews.length;

    const monthlyViews = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - (11 - index),
        1
      );
      const nextMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        1
      );

      const count = newsViews.filter((view) => {
        const date = new Date(view.viewed_at);
        return date >= monthDate && date < nextMonth;
      }).length;

      return {
        key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
        label: monthDate.toLocaleDateString("bn-BD", {
          month: "short",
        }),
        count,
      };
    });

    const viewsByNews = new Map<number, number>();

    newsViews.forEach((view) => {
      if (view.news_id === null) return;
      viewsByNews.set(
        view.news_id,
        (viewsByNews.get(view.news_id) || 0) + 1
      );
    });

    const topNews = newsList
      .map((news) => ({
        ...news,
        views: viewsByNews.get(news.id) || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const categoryViews: Record<string, number> = {};

    newsViews.forEach((view) => {
      if (view.news_id === null) return;

      const news = newsList.find(
        (item) => item.id === view.news_id
      );

      if (!news) return;

      categoryViews[news.category] =
        (categoryViews[news.category] || 0) + 1;
    });

    const maxMonthlyViews = Math.max(
      ...monthlyViews.map((item) => item.count),
      1
    );

    return {
      todayViews,
      thisMonthViews,
      lastMonthViews,
      totalViews,
      monthlyViews,
      topNews,
      categoryViews,
      maxMonthlyViews,
    };
  }, [newsViews, newsList]);

  // =========================================================
  // DASHBOARD
  // =========================================================

  const applyTextFormat = (command: string, value?: string) => {
    const editor = descriptionEditorRef.current;
    if (!editor) return;
    editor.focus();
    if (command === "createLink") {
      const url = window.prompt("লিংকটি লিখুন (https://...)");
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, value);
    }
    setDescription(editor.innerHTML);
  };

  const handleDescriptionInput = () => {
    if (descriptionEditorRef.current) {
      setDescription(descriptionEditorRef.current.innerHTML);
    }
  };

  const renderDashboard =
    () => {
      const totalNews =
        newsList.length;

      const breakingNews =
        newsList.filter(
          (item) =>
            item.breaking
        ).length;

      const mediaCount =
        newsList.filter(
          (item) =>
            item.image
        ).length;

      return (
        <>
          {/* STAT CARDS */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">
                Total News
              </p>

              <h3 className="mt-2 text-3xl font-extrabold">
                {totalNews}
              </h3>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">
                Categories
              </p>

              <h3 className="mt-2 text-3xl font-extrabold">
                {categories.length}
              </h3>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">
                Breaking News
              </p>

              <h3 className="mt-2 text-3xl font-extrabold">
                {breakingNews}
              </h3>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">
                News Images
              </p>

              <h3 className="mt-2 text-3xl font-extrabold">
                {mediaCount}
              </h3>
            </div>
          </div>

          {/* VIEWS ANALYTICS */}

          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold">
                  Views Analytics
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Website-এর News কতবার দেখা হয়েছে তার overview।
                </p>
              </div>

              <button
                type="button"
                onClick={fetchViews}
                disabled={isLoadingViews}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                {isLoadingViews ? "Loading..." : "↻ Refresh Views"}
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">Today Views</p>
                <h4 className="mt-2 text-3xl font-extrabold">
                  {viewAnalytics.todayViews}
                </h4>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">This Month</p>
                <h4 className="mt-2 text-3xl font-extrabold">
                  {viewAnalytics.thisMonthViews}
                </h4>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">Last Month</p>
                <h4 className="mt-2 text-3xl font-extrabold">
                  {viewAnalytics.lastMonthViews}
                </h4>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">Total Views</p>
                <h4 className="mt-2 text-3xl font-extrabold">
                  {viewAnalytics.totalViews}
                </h4>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h4 className="font-bold">Last 12 Months</h4>

                <div className="mt-6 flex h-56 items-end gap-2 overflow-x-auto">
                  {viewAnalytics.monthlyViews.map((month) => {
                    const height =
                      month.count === 0
                        ? 4
                        : Math.max(
                            8,
                            Math.round(
                              (month.count /
                                viewAnalytics.maxMonthlyViews) *
                                100
                            )
                          );

                    return (
                      <div
                        key={month.key}
                        className="flex min-w-[42px] flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-[10px] font-bold text-gray-600">
                          {month.count}
                        </span>

                        <div className="flex h-40 w-full items-end rounded-md bg-gray-100">
                          <div
                            className="w-full rounded-md bg-black"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span className="text-[10px] text-gray-500">
                          {month.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h4 className="font-bold">Most Viewed News</h4>

                <div className="mt-4 space-y-3">
                  {viewAnalytics.topNews.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      এখনও কোনও view data নেই।
                    </p>
                  ) : (
                    viewAnalytics.topNews.map((news, index) => (
                      <div
                        key={news.id}
                        className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                            {index + 1}
                          </span>

                          <p className="truncate text-sm font-semibold">
                            {news.title}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">
                          {news.views}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
              <h4 className="font-bold">Category-wise Views</h4>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <p className="truncate text-sm font-semibold">
                      {cat}
                    </p>

                    <p className="mt-2 text-2xl font-extrabold">
                      {viewAnalytics.categoryViews[cat] || 0}
                    </p>

                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}

          <section className="mt-8">
            <h3 className="text-xl font-bold">
              Quick Actions
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveMenu(
                    "Add News"
                  );
                }}
                className="rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-2xl">
                  📰
                </p>

                <h4 className="mt-3 font-bold">
                  Add New News
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  নতুন খবর প্রকাশ করুন
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveMenu(
                    "News"
                  )
                }
                className="rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-2xl">
                  📋
                </p>

                <h4 className="mt-3 font-bold">
                  Manage News
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Edit ও Delete করুন
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveMenu(
                    "Media"
                  )
                }
                className="rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-2xl">
                  🖼️
                </p>

                <h4 className="mt-3 font-bold">
                  Media Library
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Uploaded images দেখুন
                </p>
              </button>
            </div>
          </section>

          {/* RECENT NEWS */}

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                Recent News
              </h3>

              <button
                type="button"
                onClick={() =>
                  setActiveMenu(
                    "News"
                  )
                }
                className="text-sm font-bold text-red-600"
              >
                View All →
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {newsList.length ===
              0 ? (
                <div className="p-8 text-center text-gray-500">
                  এখনও কোনও News নেই।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left">
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
                      </tr>
                    </thead>

                    <tbody>
                      {newsList
                        .slice(0, 5)
                        .map(
                          (item) => (
                            <tr
                              key={
                                item.id
                              }
                              className="border-b last:border-0"
                            >
                              <td className="px-5 py-4 font-semibold">
                                {
                                  item.title
                                }
                              </td>

                              <td className="px-5 py-4 text-sm">
                                {
                                  item.category
                                }
                              </td>

                              <td className="px-5 py-4">
                                {item.breaking ? (
                                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                    Breaking
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                    Published
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      );
    };

  // =========================================================
  // ADD / EDIT NEWS
  // =========================================================

  const renderAddNews =
    () => {
      return (
        <section>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-2xl font-bold">
                {editingId !== null
                  ? "Edit News"
                  : "Add New News"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {editingId !== null
                  ? "News-এর তথ্য পরিবর্তন করুন।"
                  : "নতুন খবর প্রকাশ করুন।"}
              </p>
            </div>

            {editingId !==
              null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold hover:bg-gray-100"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
            <div className="space-y-5">
              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  News Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="খবরের শিরোনাম লিখুন"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* CATEGORY */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                        value={
                          item
                        }
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {category === "Health Talk" && (
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    YouTube Video Link
                  </label>

                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) =>
                      setYoutubeUrl(e.target.value)
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Health Talk-এর YouTube ভিডিওর link এখানে দিন।
                  </p>
                </div>
              )}

              {/* DESCRIPTION / RICH TEXT EDITOR */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>

                <div className="overflow-hidden rounded-lg border border-gray-300 focus-within:border-black">
                  <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
                    {[
                      { label: "B", command: "bold", title: "Bold" },
                      { label: "I", command: "italic", title: "Italic" },
                      { label: "U", command: "underline", title: "Underline" },
                      { label: "S", command: "strikeThrough", title: "Strikethrough" },
                    ].map((tool) => (
                      <button
                        key={tool.command}
                        type="button"
                        title={tool.title}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyTextFormat(tool.command)}
                        className="min-w-9 rounded border border-gray-200 bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100"
                      >
                        <span className={tool.command === "italic" ? "italic" : tool.command === "underline" ? "underline" : tool.command === "strikeThrough" ? "line-through" : ""}>
                          {tool.label}
                        </span>
                      </button>
                    ))}
                    <button type="button" title="Highlight" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("hiliteColor", "#fff176")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-bold hover:bg-yellow-100">Highlight</button>
                    <button type="button" title="Heading" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("formatBlock", "h2")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100">H2</button>
                    <button type="button" title="Subheading" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("formatBlock", "h3")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100">H3</button>
                    <button type="button" title="Paragraph" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("formatBlock", "p")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100">P</button>
                    <button type="button" title="Bullet list" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("insertUnorderedList")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100">• List</button>
                    <button type="button" title="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("insertOrderedList")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100">1. List</button>
                    <button type="button" title="Add link" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("createLink")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100">Link</button>
                    <button type="button" title="Remove formatting" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTextFormat("removeFormat")} className="rounded border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-100">Clear Format</button>
                  </div>

                  <div
                    ref={descriptionEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleDescriptionInput}
                    role="textbox"
                    aria-multiline="true"
                    className="min-h-[220px] w-full whitespace-pre-wrap px-4 py-3 text-base leading-8 outline-none [&_h2]:my-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-xl [&_h3]:font-bold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-7 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_a]:text-blue-700 [&_a]:underline"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  লেখা select করে toolbar ব্যবহার করুন। Bold, Italic, Underline, Highlight, Heading, List ও Link যোগ করা যাবে।
                </p>
              </div>

              {/* CURRENT IMAGE */}

              {editingId !==
                null &&
                oldImage && (
                  <div>
                    <p className="mb-2 text-sm font-bold">
                      Current Image
                    </p>

                    <img
                      src={oldImage}
                      alt="Current"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  </div>
                )}

              {/* IMAGE */}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  {editingId !==
                  null
                    ? "Replace Image"
                    : "News Image"}
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) =>
                    setImage(
                      e.target
                        .files?.[0] ||
                        null
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
                />

                {image && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected:{" "}
                    {
                      image.name
                    }
                  </p>
                )}

                {editingId !==
                  null && (
                  <p className="mt-2 text-xs text-gray-400">
                    নতুন image select করলে পুরনো image replace হবে।
                  </p>
                )}
              </div>

              {/* BREAKING */}

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    breaking
                  }
                  onChange={(e) =>
                    setBreaking(
                      e.target
                        .checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm font-semibold">
                  Breaking News হিসেবে প্রকাশ করুন
                </span>
              </label>

              {/* ERROR */}

              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-bold">
                    সমস্যা হয়েছে
                  </p>

                  <p className="mt-1">
                    {
                      errorMessage
                    }
                  </p>
                </div>
              )}

              {/* SUCCESS */}

              {successMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  <p className="font-bold">
                    সফল হয়েছে
                  </p>

                  <p className="mt-1">
                    {
                      successMessage
                    }
                  </p>
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    handlePublish
                  }
                  disabled={
                    isPublishing
                  }
                  className="rounded-lg bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPublishing
                    ? "Saving..."
                    : editingId !==
                        null
                      ? "Update News"
                      : "Publish News"}
                </button>

                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  disabled={
                    isPublishing
                  }
                  className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-bold text-black hover:bg-gray-100 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>
      );
    };

  // =========================================================
  // NEWS LIST
  // =========================================================

  const renderNewsList =
    () => {
      return (
        <section>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-2xl font-bold">
                All News
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Database-এর সব News এখানে দেখা যাবে।
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveMenu(
                  "Add News"
                );
              }}
              className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
            >
              + Add News
            </button>
          </div>

          {/* CATEGORY FILTER */}

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "সব",
              ...categories,
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    item
                  )
                }
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  selectedCategory ===
                  item
                    ? "bg-black text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item}

                {item !==
                  "সব" &&
                  ` (${categoryCounts[item] || 0})`}
              </button>
            ))}
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {isLoadingNews ? (
              <div className="p-10 text-center text-gray-500">
                News loading...
              </div>
            ) : filteredNews.length ===
              0 ? (
              <div className="p-10 text-center">
                <h4 className="text-xl font-bold">
                  কোনও News পাওয়া যায়নি
                </h4>

                <p className="mt-2 text-sm text-gray-500">
                  অন্য category select করুন অথবা নতুন News publish করুন।
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="border-b bg-gray-50 text-sm">
                    <tr>
                      <th className="px-5 py-4">
                        News
                      </th>

                      <th className="px-5 py-4">
                        Category
                      </th>

                      <th className="px-5 py-4">
                        Image
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredNews.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                          className="border-b last:border-0"
                        >
                          <td className="px-5 py-4">
                            <div className="max-w-[320px]">
                              <p className="font-bold">
                                {
                                  item.title
                                }
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                {
                                  item.description
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {
                              item.category
                            }
                          </td>

                          <td className="px-5 py-4">
                            {item.image ? (
                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  item.title
                                }
                                className="h-14 w-20 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                                No Image
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {item.breaking ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                Breaking
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                Published
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-gray-500">
                            {item.published_at
                              ? new Date(
                                  item.published_at
                                ).toLocaleString(
                                  "bn-BD"
                                )
                              : "-"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    item
                                  )
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold hover:bg-gray-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  item.id
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId ===
                                item.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      );
    };

  // =========================================================
  // CATEGORIES
  // =========================================================

  const renderCategories =
    () => {
      return (
        <section>
          <h3 className="text-2xl font-bold">
            Categories
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Website-এর News categories এবং প্রতিটি category-র News count।
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(
              (item) => {
                const count =
                  categoryCounts[
                    item
                  ] || 0;

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => {
                      setSelectedCategory(
                        item
                      );

                      setActiveMenu(
                        "News"
                      );
                    }}
                    className="rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold">
                        {item}
                      </h4>

                      <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                        {count}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {count ===
                      1
                        ? "1টি News"
                        : `${count}টি News`}
                    </p>

                    <p className="mt-4 text-xs font-bold text-red-600">
                      View News →
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </section>
      );
    };

  // =========================================================
  // MEDIA LIBRARY
  // =========================================================

  const renderMedia =
    () => {
      return (
        <section>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-2xl font-bold">
                Media Library
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Supabase Storage-এর uploaded images এখানে দেখা যাবে।
              </p>
            </div>

            <button
              type="button"
              onClick={
                fetchMedia
              }
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold hover:bg-gray-100"
            >
              ↻ Refresh
            </button>
          </div>

          {/* UPLOAD */}

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
            <h4 className="font-bold">
              Upload Media
            </h4>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  setMediaUploadFile(
                    e.target
                      .files?.[0] ||
                      null
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
              />

              <button
                type="button"
                onClick={
                  handleMediaUpload
                }
                disabled={
                  isUploadingMedia
                }
                className="rounded-lg bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {isUploadingMedia
                  ? "Uploading..."
                  : "Upload"}
              </button>
            </div>

            {mediaUploadFile && (
              <p className="mt-3 text-sm text-gray-500">
                Selected:{" "}
                {
                  mediaUploadFile.name
                }
              </p>
            )}
          </div>

          {/* MESSAGES */}

          {errorMessage && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* MEDIA */}

          {isLoadingMedia ? (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
              Media loading...
            </div>
          ) : mediaFiles.length ===
            0 ? (
            <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
              <div className="text-5xl">
                🖼️
              </div>

              <h4 className="mt-4 font-bold">
                No Images
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                Media Library-তে এখনও কোনও image নেই।
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mediaFiles.map(
                (file) => (
                  <div
                    key={
                      file.path
                    }
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                  >
                    <div className="relative">
                      <img
                        src={
                          file.url
                        }
                        alt={
                          file.name
                        }
                        className="h-48 w-full object-cover"
                      />

                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                        {
                          file.path.split(
                            "/"
                          )[0]
                        }
                      </span>
                    </div>

                    <div className="p-4">
                      <p className="truncate text-sm font-bold">
                        {
                          file.name
                        }
                      </p>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyMediaUrl(
                              file.url
                            )
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold hover:bg-gray-100"
                        >
                          Copy URL
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteMedia(
                              file
                            )
                          }
                          disabled={
                            deletingMediaPath ===
                            file.path
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingMediaPath ===
                          file.path
                            ? "..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      );
    };

  // =========================================================
  // SETTINGS
  // =========================================================

  const renderSettings =
    () => {
      return (
        <section>
          <h3 className="text-2xl font-bold">
            Website Settings
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            এখান থেকেই website name, tagline এবং Admin Panel logo পরিবর্তন করুন।
          </p>

          <div className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
            {isLoadingSettings ? (
              <div className="p-8 text-center text-gray-500">
                Settings loading...
              </div>
            ) : (
              <div className="space-y-6">
                {/* LOGO PREVIEW */}

                <div>
                  <label className="mb-3 block text-sm font-bold">
                    Website Logo
                  </label>

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      {logoPreview ? (
                        <img
                          src={
                            logoPreview
                          }
                          alt="Website Logo"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl font-black">
                          A
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) =>
                          handleLogoSelect(
                            e.target
                              .files?.[0] ||
                              null
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
                      />

                      <p className="mt-2 text-xs text-gray-400">
                        PNG, JPG, WEBP অথবা SVG logo ব্যবহার করতে পারবেন।
                      </p>

                      {logoFile && (
                        <p className="mt-2 text-sm font-semibold text-green-600">
                          Selected:{" "}
                          {
                            logoFile.name
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SITE NAME */}

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Website Name
                  </label>

                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) =>
                      setSiteName(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                {/* TAGLINE */}

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Tagline
                  </label>

                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) =>
                      setTagline(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                {/* MESSAGES */}

                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {successMessage}
                  </div>
                )}

                {/* SAVE */}

                <button
                  type="button"
                  onClick={
                    handleSaveSettings
                  }
                  disabled={
                    isSavingSettings
                  }
                  className="rounded-lg bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingSettings
                    ? "Saving..."
                    : "Save Settings"}
                </button>
              </div>
            )}
          </div>
        </section>
      );
    };

  // =========================================================
  // SIDEBAR LOGO
  // =========================================================

  const renderLogo = () => {
    if (
      siteSettings?.logo_url
    ) {
      return (
        <img
          src={
            siteSettings.logo_url
          }
          alt={siteName}
          className="h-12 w-12 rounded-lg object-contain"
        />
      );
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-lg font-black text-black">
        A
      </div>
    );
  };

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100 text-black">

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-800 bg-black text-white md:block">
        <div className="border-b border-gray-800 px-6 py-6">
          <div className="flex items-center gap-3">
            {renderLogo()}

            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold">
                {siteName}
              </h1>

              <p className="mt-1 text-xs text-gray-400">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {menuItems.map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (
                    item ===
                    "Add News"
                  ) {
                    resetForm();
                  }

                  setActiveMenu(
                    item
                  );

                  setErrorMessage(
                    ""
                  );

                  setSuccessMessage(
                    ""
                  );
                }}
                className={`mb-2 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                  activeMenu ===
                  item
                    ? "bg-white text-black"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item ===
                  "Dashboard" &&
                  "📊 "}

                {item === "News" &&
                  "📰 "}

                {item ===
                  "Add News" &&
                  "➕ "}

                {item ===
                  "Categories" &&
                  "📁 "}

                {item ===
                  "Media" &&
                  "🖼️ "}

                {item ===
                  "Settings" &&
                  "⚙️ "}

                {item}
              </button>
            )
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/";
            }}
            className="w-full rounded-lg border border-gray-700 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800"
          >
            ← Website
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "↪ Logout"}
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE TOP
      ===================================================== */}

      <div className="border-b border-gray-200 bg-black p-4 text-white md:hidden">
        <div className="flex items-center gap-3">
          {renderLogo()}

          <div>
            <h1 className="text-xl font-extrabold">
              {siteName}
            </h1>

            <p className="mt-1 text-xs text-gray-400">
              Admin Panel
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {menuItems.map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (
                    item ===
                    "Add News"
                  ) {
                    resetForm();
                  }

                  setActiveMenu(
                    item
                  );

                  setErrorMessage(
                    ""
                  );

                  setSuccessMessage(
                    ""
                  );
                }}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${
                  activeMenu ===
                  item
                    ? "bg-white text-black"
                    : "bg-gray-800 text-white"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="flex-1 rounded-lg border border-gray-700 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-gray-800"
          >
            ← Website
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "↪ Logout"}
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="md:ml-64">

        {/* HEADER */}

        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4 md:px-8">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                {activeMenu}
              </h2>

              <p className="text-xs text-gray-500">
                {siteName} Admin Panel
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

              {siteSettings?.logo_url ? (
                <img
                  src={
                    siteSettings.logo_url
                  }
                  alt="Admin"
                  className="h-10 w-10 rounded-full border border-gray-200 object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                  A
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="p-4 md:p-8">
          {activeMenu ===
            "Dashboard" &&
            renderDashboard()}

          {activeMenu ===
            "News" &&
            renderNewsList()}

          {activeMenu ===
            "Add News" &&
            renderAddNews()}

          {activeMenu ===
            "Categories" &&
            renderCategories()}

          {activeMenu ===
            "Media" &&
            renderMedia()}

          {activeMenu ===
            "Settings" &&
            renderSettings()}

          {activeMenu === "Health Talk" && (
            <section>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    Health Talk
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    YouTube-এর Health Talk ভিডিও publish করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setCategory("Health Talk");
                    setActiveMenu("Add News");
                  }}
                  className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  + Add Health Talk
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
