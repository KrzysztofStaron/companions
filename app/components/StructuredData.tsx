interface StructuredDataProps {
  type?: "WebApplication" | "SoftwareApplication" | "Article";
  name?: string;
  description?: string;
  url?: string;
  author?: string;
  publisher?: string;
  applicationCategory?: string;
  operatingSystem?: string;
}

export default function StructuredData({
  type = "WebApplication",
  name = "AI Companion",
  description = "Interactive AI companion with realistic animations and voice chat",
  url,
  author = "AI Companion Team",
  publisher = "AI Companion",
  applicationCategory = "Entertainment",
  operatingSystem = "Web Browser",
}: StructuredDataProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": type,
    name,
    description,
    url: url || baseUrl,
    author: {
      "@type": "Organization",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: publisher,
    },
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "100",
    },
    keywords: "AI companion, artificial intelligence, 3D animation, voice chat, interactive AI, virtual assistant",
    image: `${baseUrl}/og_image.png`,
    screenshot: `${baseUrl}/og_image.png`,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
