import { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaShareAlt } from "react-icons/fa";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import landingPageService from "../../../services/landingPageService";

function getValue(item, ...keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
  }
  return "";
}

function SharedLandingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewMode = searchParams.get("preview") === "1";
  const [page, setPage] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadedSlug, setLoadedSlug] = useState("");
  const [error, setError] = useState("");
  const [shareNotice, setShareNotice] = useState("");

  useEffect(() => {
    let active = true;
    const pageRequest = previewMode
      ? Promise.resolve().then(() => {
        const savedDraft = localStorage.getItem(`landing-page-preview:${slug}`);
        if (!savedDraft) throw new Error("No local preview is available. Open Preview from the landing-page editor.");
        return JSON.parse(savedDraft);
      })
      : landingPageService.getPublished(slug);
    pageRequest
      .then((result) => {
        if (!result || (!previewMode && getValue(result, "IsPublished", "isPublished") === false)) {
          throw new Error("This landing page is not available.");
        }
        if (active) {
          setPage(result);
          setActiveSlide(0);
          setActiveImage(0);
          setError("");
        }
      })
      .catch((loadError) => {
        console.error("Failed to load shared landing page:", loadError);
        if (active) setError(loadError.response?.status === 404 ? "This landing page could not be found." : loadError.message || "Unable to load this landing page.");
      })
      .finally(() => {
        if (active) {
          setLoadedSlug(slug);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [previewMode, slug]);

  const slidesRaw = getValue(page, "Slides", "slides");
  const slides = Array.isArray(slidesRaw) ? [...slidesRaw].sort((a, b) => Number(getValue(a, "SortOrder", "sortOrder") || 0) - Number(getValue(b, "SortOrder", "sortOrder") || 0)) : [];
  const slide = slides[activeSlide];
  const productContentsRaw = getValue(page, "ProductContents", "productContents");
  const productContents = Array.isArray(productContentsRaw) ? productContentsRaw : [];
  const productId = getValue(slide, "ProductId", "productId");
  const productContent = productContents.find((content) =>
    String(getValue(content, "ProductId", "productId")) === String(productId)
  );
  const galleryValue = getValue(productContent, "GalleryImages", "galleryImages");
  const galleryImages = Array.isArray(galleryValue)
    ? galleryValue.filter((url) => typeof url === "string" && url.trim())
    : [];
  if (slide?.ImageUrl || slide?.imageUrl) {
    const heroImage = getValue(slide, "ImageUrl", "imageUrl");
    if (heroImage && !galleryImages.includes(heroImage)) galleryImages.unshift(heroImage);
  }
  const activeImageUrl = galleryImages[activeImage] || getValue(slide, "ImageUrl", "imageUrl");

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveImage(0);
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (direction) => {
    setActiveImage(0);
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };

  const sharePage = async () => {
    const shareData = {
      title: getValue(page, "Title", "title"),
      text: getValue(page, "Description", "description"),
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareData.url);
      setShareNotice("Link copied. Share it on your social channels.");
    } catch (shareError) {
      if (shareError.name !== "AbortError") {
        console.error("Unable to share landing page:", shareError);
        setShareNotice(`Copy this link to share: ${shareData.url}`);
      }
    }
  };

  const buyNow = () => {
    const product = getValue(slide, "ProductId", "productId");
    if (!product) {
      navigate("/products");
      return;
    }
    navigate(`/checkout?productId=${encodeURIComponent(String(product))}`);
  };

  if (loading || loadedSlug !== slug) return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--text2)" }}>Loading campaign...</div>;
  if (error || !page || !slide) {
    return <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}><div><h1>Page unavailable</h1><p style={{ color: "var(--text2)" }}>{error || "This landing page does not have any content yet."}</p></div></main>;
  }

  const backgroundColor = getValue(page, "BackgroundColor", "backgroundColor") || "#f5f5f7";
  const textColor = getValue(page, "TextColor", "textColor") || "#1d1d1f";
  const buttonColor = getValue(page, "ButtonColor", "buttonColor") || "#0071e3";
  const imageHeight = Math.min(1400, Math.max(240, Number(getValue(slide, "ImageHeight", "imageHeight")) || 620));
  const imageFit = getValue(slide, "ImageFit", "imageFit") === "contain" ? "contain" : "cover";

  return (
    <main style={{ background: backgroundColor, color: textColor, minHeight: "75vh" }}>
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "24px clamp(20px, 6vw, 80px) 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ color: textColor, fontSize: 14, fontWeight: 600 }}>← Store</a>
          <button type="button" onClick={sharePage} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${textColor}33`, borderRadius: 999, padding: "9px 14px", background: "transparent", color: textColor, font: "inherit", cursor: "pointer" }}><FaShareAlt />Share</button>
        </div>
        {shareNotice && <p role="status" style={{ textAlign: "right", fontSize: 13 }}>{shareNotice}</p>}
        <header style={{ maxWidth: 850, margin: "clamp(44px, 8vw, 100px) auto 38px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 62px)", letterSpacing: "-0.045em", lineHeight: 1.06, margin: "0 0 16px", fontWeight: 700 }}>{getValue(page, "Title", "title")}</h1>
          {getValue(page, "Description", "description") && <p style={{ fontSize: "clamp(16px, 2vw, 21px)", lineHeight: 1.55, opacity: 0.78, margin: 0 }}>{getValue(page, "Description", "description")}</p>}
        </header>
      </section>

      <section aria-roledescription="carousel" aria-label="Campaign slideshow" style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px) 52px" }}>
        <article key={activeSlide} style={{ overflow: "hidden", borderRadius: 24, background: `${textColor}08`, textAlign: "center" }}>
          <div style={{ padding: "clamp(30px, 5vw, 64px) 20px 26px" }}>
            {getValue(slide, "Eyebrow", "eyebrow") && <p style={{ color: buttonColor, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>{getValue(slide, "Eyebrow", "eyebrow")}</p>}
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.035em", margin: "0 0 12px" }}>{getValue(slide, "Title", "title")}</h2>
            {getValue(slide, "Description", "description") && <p style={{ fontSize: "clamp(15px, 1.7vw, 19px)", lineHeight: 1.6, maxWidth: 760, margin: "0 auto 22px", opacity: 0.8 }}>{getValue(slide, "Description", "description")}</p>}
            <button type="button" onClick={buyNow} style={{ border: 0, borderRadius: 999, padding: "12px 22px", background: buttonColor, color: "#fff", font: "inherit", fontWeight: 650, cursor: "pointer" }}>
              {getValue(slide, "ButtonLabel", "buttonLabel") || (getValue(slide, "ProductId", "productId") ? "Buy now" : "Explore products")} <span aria-hidden="true">›</span>
            </button>
          </div>
          <img
            src={activeImageUrl}
            alt={getValue(slide, "ImageAlt", "imageAlt") || getValue(slide, "Title", "title")}
            style={{ display: "block", width: "100%", height: `min(${imageHeight}px, 70vh)`, objectFit: imageFit, objectPosition: "center", background: `${textColor}08` }}
          />
        </article>

        {galleryImages.length > 1 && (
          <div role="group" aria-label="Product images" style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", paddingTop: 16 }}>
            {galleryImages.map((imageUrl, index) => (
              <button key={`${imageUrl}-${index}`} type="button" aria-label={`Show product image ${index + 1}`} aria-pressed={index === activeImage} onClick={() => setActiveImage(index)} style={{ padding: 3, border: `2px solid ${index === activeImage ? buttonColor : `${textColor}22`}`, borderRadius: 10, background: "transparent", cursor: "pointer" }}>
                <img src={imageUrl} alt={`Product view ${index + 1}`} style={{ display: "block", width: 72, height: 72, objectFit: "cover", borderRadius: 7 }} />
              </button>
            ))}
          </div>
        )}

        {(getValue(productContent, "Description", "description") ||
          getValue(productContent, "VideoUrl", "videoUrl") ||
          getValue(productContent, "Highlights", "highlights") ||
          getValue(productContent, "Sections", "sections")) && (
          <section aria-label="Product information" style={{ maxWidth: 1000, margin: "0 auto", padding: "24px clamp(20px, 5vw, 64px) 56px" }}>
            {getValue(productContent, "Description", "description") && <p style={{ fontSize: 17, lineHeight: 1.8, whiteSpace: "pre-line" }}>{getValue(productContent, "Description", "description")}</p>}
            {getValue(productContent, "VideoUrl", "videoUrl") && <video controls preload="metadata" src={getValue(productContent, "VideoUrl", "videoUrl")} style={{ display: "block", width: "100%", maxHeight: 560, margin: "24px auto", borderRadius: 16, background: "#000" }}>Your browser does not support video playback.</video>}
            {(() => {
              const highlightsRaw = getValue(productContent, "Highlights", "highlights");
              const highlights = Array.isArray(highlightsRaw) ? highlightsRaw : [];
              return highlights.length > 0 && <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, padding: 0, listStyle: "none" }}>{highlights.map((item, index) => <li key={index} style={{ padding: 16, borderRadius: 12, background: `${textColor}08`, lineHeight: 1.5 }}>✓ {typeof item === "string" ? item : getValue(item, "Title", "title", "Name", "name")}</li>)}</ul>;
            })()}
            {(() => {
              const sectionsRaw = getValue(productContent, "Sections", "sections");
              const sections = Array.isArray(sectionsRaw) ? sectionsRaw : [];
              return sections.map((section, index) => <article key={index} style={{ padding: "16px 0", borderTop: `1px solid ${textColor}22` }}><h3 style={{ margin: "0 0 8px" }}>{getValue(section, "Title", "title")}</h3><p style={{ whiteSpace: "pre-line", lineHeight: 1.7, margin: 0 }}>{getValue(section, "Content", "content")}</p></article>);
            })()}
          </section>
        )}

        {slides.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, paddingTop: 20 }}>
            <button type="button" aria-label="Previous slide" onClick={() => goToSlide(-1)} style={carouselButtonStyle}><FaArrowLeft /></button>
            <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Choose slide">
              {slides.map((item, index) => <button key={index} type="button" aria-label={`Show slide ${index + 1}`} aria-current={index === activeSlide ? "true" : undefined} onClick={() => setActiveSlide(index)} style={{ width: index === activeSlide ? 24 : 9, height: 9, border: 0, borderRadius: 999, background: index === activeSlide ? buttonColor : `${textColor}55`, cursor: "pointer", transition: "width 180ms ease" }} />)}
            </div>
            <button type="button" aria-label="Next slide" onClick={() => goToSlide(1)} style={carouselButtonStyle}><FaArrowRight /></button>
          </div>
        )}
      </section>
    </main>
  );
}

const carouselButtonStyle = {
  display: "grid",
  placeItems: "center",
  width: 36,
  height: 36,
  border: "1px solid currentColor",
  borderRadius: "50%",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

export default SharedLandingPage;
