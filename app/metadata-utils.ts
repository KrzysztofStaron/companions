import { Metadata } from "next";

interface PageMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[];
}

export function generatePageMetadata({ title, description, image, keywords = [] }: PageMetadataProps): Metadata {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const defaultImage = "/og_image.png";

  return {
    title,
    description,
    keywords: ["AI companion", "AI chat", "virtual assistant", "3D animation", "voice chat", ...keywords],
    openGraph: {
      title: title || "AI Companion",
      description: description || "Interactive AI companion with realistic animations and voice chat",
      images: [
        {
          url: image || defaultImage,
          width: 1200,
          height: 630,
          alt: title || "AI Companion",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title || "AI Companion",
      description: description || "Interactive AI companion with realistic animations and voice chat",
      images: [image || defaultImage],
    },
  };
}

// Example of how to use generateMetadata for dynamic pages
export async function generateDynamicMetadata(
  params: { slug?: string },
  searchParams?: { [key: string]: string | string[] | undefined }
): Promise<Metadata> {
  // This would be used if you had dynamic routes like /chat/[id] or /character/[name]
  // You could fetch data based on params and generate appropriate metadata

  return generatePageMetadata({
    title: `AI Chat ${params.slug ? `- ${params.slug}` : ""}`,
    description: "Chat with AI companions and see them respond with realistic animations",
    keywords: ["AI chat", "conversation", "interactive AI"],
  });
}
