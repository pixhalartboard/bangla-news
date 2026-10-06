"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type ViewTrackerProps = {
  newsId: number;
};

export default function ViewTracker({ newsId }: ViewTrackerProps) {
  useEffect(() => {
    async function recordView() {
      const supabase = createClient();

      const { error } = await supabase.from("news_views").insert({
        news_id: newsId,
      });

      if (error) {
        console.error("News view tracking error:", error);
      }
    }

    recordView();
  }, [newsId]);

  return null;
}