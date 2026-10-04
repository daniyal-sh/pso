import type { MetadataRoute } from "next";
import { tracks } from "@/lib/data";
import { getPublishedBlogPosts, getPublishedGuides } from "@/lib/public-content";
import { getPublishedPastPapers } from "@/lib/public-datasets";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const staticRoutes = ["/", "/olympiads", "/guides", "/resources", "/question-bank", "/past-papers", "/blog", "/alumni", "/about"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, guides, papers] = await Promise.all([getPublishedBlogPosts(), getPublishedGuides(), getPublishedPastPapers()]);
  const paths = [
    ...staticRoutes,
    ...tracks.map((track) => `/olympiads/${track.slug}`),
    ...guides.map((guide) => `/guides/${guide.slug}`),
    ...posts.map((post) => `/blog/${post.slug}`),
    ...papers.map((paper) => `/past-papers/${paper.id}`),
  ];

  return paths.map((path) => ({ url: `${siteUrl}${path === "/" ? "" : path}` }));
}
