import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "product" | "article" | "organization";
  price?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
  category?: string;
  sku?: string;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
  alternateLanguages?: { lang: string; url: string }[];
  breadcrumbs?: { name: string; url: string }[];
  faq?: { question: string; answer: string }[];
  reviews?: { rating: number; count: number };
}

const SEO = ({
  title = "Premium ADA Compliant Braille Signs | Acrylic Braille Signs Canada & USA",
  description = "Professional ADA compliant acrylic braille signage for offices, healthcare, and commercial spaces. Premium quality door numbers, restroom signs, and custom signage. Serving Canada & USA with expert installation.",
  canonical,
  image = "https://78cdd8dc-3c6a-4e4f-9f85-841f2f509702.lovableproject.com/assets/hero-office.jpg",
  type = "website",
  price,
  availability,
  brand = "Acrylic Braille Signs",
  category,
  sku,
  keywords = ["ADA compliant signs", "braille signage", "acrylic signs", "door number signs", "restroom signs", "office signage", "custom braille signs", "accessibility signage", "professional signage Canada USA"],
  author,
  publishedTime,
  modifiedTime,
  locale = "en_US",
  alternateLanguages = [],
  breadcrumbs = [],
  faq = [],
  reviews
}: SEOProps) => {
  const siteUrl = "https://78cdd8dc-3c6a-4e4f-9f85-841f2f509702.lovableproject.com";
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;

  // Generate comprehensive structured data
  const generateStructuredData = () => {
    const baseStructuredData = {
      "@context": "https://schema.org",
      "@graph": []
    };

    // Organization/Website data
    const organizationData = {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Acrylic Braille Signs",
      description: "Professional ADA compliant signage solutions for Canada & USA",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/acrylic-braille-logo.png`,
        width: 200,
        height: 200
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+1-647-278-2905",
          contactType: "customer service",
          email: "acrylicbraillesigns@gmail.com",
          availableLanguage: ["English"],
          areaServed: ["Canada", "United States"]
        }
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "US",
        addressLocality: "Los Angeles",
        addressRegion: "CA"
      },
      sameAs: [
        "https://www.facebook.com/absigns",
        "https://www.instagram.com/absigns",
        "https://www.linkedin.com/company/absigns"
      ]
    };

    // Website data
    const websiteData = {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "AB Signs",
      description: "Professional Door Signs & Signage Solutions",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    // Breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbData = {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: `${siteUrl}${crumb.url}`
        }))
      };
      baseStructuredData["@graph"].push(breadcrumbData);
    }

    // FAQ Schema
    if (faq && faq.length > 0) {
      const faqData = {
        "@type": "FAQPage",
        mainEntity: faq.map(item => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      };
      baseStructuredData["@graph"].push(faqData);
    }

    // Product-specific schema
    if (type === "product") {
      const productData = {
        "@type": "Product",
        name: title,
        description,
        image,
        brand: {
          "@type": "Brand",
          name: brand
        },
        manufacturer: {
          "@type": "Organization",
          name: brand
        },
        ...(sku && { sku, mpn: sku }),
        ...(category && { category }),
        ...(price && {
          offers: {
            "@type": "Offer",
            price: String(price).replace(/[^0-9.]/g, ''),
            priceCurrency: "USD",
            availability: `https://schema.org/${availability || 'InStock'}`,
            url: canonicalUrl,
            seller: { "@id": `${siteUrl}/#organization` }
          }
        }),
        ...(reviews && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.rating,
            reviewCount: reviews.count,
            worstRating: 1,
            bestRating: 5
          }
        })
      };
      baseStructuredData["@graph"].push(productData);
    }

    // Article schema
    if (type === "article" && author) {
      const articleData = {
        "@type": "Article",
        headline: title,
        description,
        image,
        author: {
          "@type": "Person",
          name: author
        },
        publisher: { "@id": `${siteUrl}/#organization` },
        ...(publishedTime && { datePublished: publishedTime }),
        ...(modifiedTime && { dateModified: modifiedTime }),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl
        }
      };
      baseStructuredData["@graph"].push(articleData);
    }

    // WebPage schema
    const webPageData = {
      "@type": "WebPage",
      "@id": canonicalUrl,
      url: canonicalUrl,
      name: title,
      description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      ...(publishedTime && { datePublished: publishedTime }),
      ...(modifiedTime && { dateModified: modifiedTime })
    };

    baseStructuredData["@graph"].push(organizationData, websiteData, webPageData);
    return baseStructuredData;
  };

  const structuredData = generateStructuredData();

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Language and locale */}
      <html lang={locale.split('_')[0]} />
      <meta property="og:locale" content={locale} />
      {alternateLanguages.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${title} - Preview Image`} />
      <meta property="og:site_name" content="AB Signs" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={`${title} - Preview Image`} />
      <meta name="twitter:creator" content="@absigns" />
      <meta name="twitter:site" content="@absigns" />
      
      {/* Article specific meta tags */}
      {author && <meta name="author" content={author} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      
      {/* Product specific meta tags */}
      {price && <meta property="product:price:amount" content={String(price).replace(/[^0-9.]/g, '')} />}
      {price && <meta property="product:price:currency" content="USD" />}
      {availability && <meta property="product:availability" content={availability} />}
      {brand && <meta property="product:brand" content={brand} />}
      {category && <meta property="product:category" content={category} />}
      
      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#007cf0" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="AB Signs" />
      
      {/* PWA Meta Tags */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/assets/acrylic-braille-logo.png" />
      
      {/* Performance and SEO hints */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      

      {/* Robots meta */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
};

export default SEO;