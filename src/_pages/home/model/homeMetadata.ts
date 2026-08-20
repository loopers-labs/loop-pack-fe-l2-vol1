import type { Metadata } from "next";
import { commerceOpenGraph } from "@/shared/metadata/commerceMetadata";
import type { HomeResponse } from "../api/homeApi";

export function buildHomeMetadata(data: HomeResponse): Metadata {
  const { title, description, image } = data.banner;

  return {
    title,
    description,
    openGraph: {
      ...commerceOpenGraph,
      title,
      description,
      images: [{ url: image, alt: title }],
    },
  };
}
