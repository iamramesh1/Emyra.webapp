// src/pages/landing/LandingPageView.jsx   (route: /p/:slug  - must be PUBLIC, outside auth/admin layout)
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import landingPageService from "../../../services/landingPageService";
import "./LandingPageView.css";

const MB = 1024 * 1024;

/* ---------------------------------------------------------------- helpers */
const pick = (obj, ...keys) => {
  for (const key of keys) if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  return undefined;
};
const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
};
const gid = (value) => String(value ?? "").toLowerCase();
const apiMessage = (error, fallback) => {
  const data = error?.response?.data;
  return data?.message || (data?.errors && Object.values(data.errors).flat()[0]) || error?.message || fallback;
};

// Works for both the API response (PascalCase/camelCase) and the admin preview payload.
function normalize(raw) {
  const ratings = {};
  asList(pick(raw, "ProductRatings", "productRatings")).forEach((r) => {
    ratings[gid(pick(r, "ProductId", "productId"))] = {
      avg: Number(pick(r, "AverageRating", "averageRating")) || 0,
      count: Number(pick(r, "ReviewCount", "reviewCount")) || 0,
    };
  });

  return {
    title: pick(raw, "Title", "title") || "",
    description: pick(raw, "Description", "description") || "",
    bg: pick(raw, "BackgroundColor", "backgroundColor") || "#f5f5f7",
    fg: pick(raw, "TextColor", "textColor") || "#1d1d1f",
    btn: pick(raw, "ButtonColor", "buttonColor") || "#0071e3",
    ratings,
    slides: asList(pick(raw, "Slides", "slides")).map((s) => ({
      eyebrow: pick(s, "Eyebrow", "eyebrow") || "",
      title: pick(s, "Title", "title") || "",
      description: pick(s, "Description", "description") || "",
      imageUrl: pick(s, "ImageUrl", "imageUrl") || "",
      imageAlt: pick(s, "ImageAlt", "imageAlt") || "",
      imageHeight: Number(pick(s, "ImageHeight", "imageHeight")) || 620,
      imageFit: pick(s, "ImageFit", "imageFit") || "cover",
      productId: gid(pick(s, "ProductId", "productId")),
      buttonLabel: pick(s, "ButtonLabel", "buttonLabel") || "Buy now",
    })),
    products: asList(pick(raw, "ProductContents", "productContents")).map((c) => ({
      productId: gid(pick(c, "ProductId", "productId")),
      description: pick(c, "Description", "description") || "",
      gallery: asList(pick(c, "GalleryImages", "galleryImages")),
      videoUrl: pick(c, "VideoUrl", "videoUrl") || "",
      highlights: asList(pick(c, "Highlights", "highlights")),
      sections: asList(pick(c, "Sections", "sections")).map((x) => ({
        title: pick(x, "Title", "title") || "",
        content: pick(x, "Content", "content") || "",
      })),
    })),
    reviews: asList(pick(raw, "Reviews", "reviews")).map((r) => ({
      id: pick(r, "Id", "id"),
      productId: gid(pick(r, "ProductId", "productId")),
      name: pick(r, "ReviewerName", "reviewerName") || "Customer",
      rating: Number(pick(r, "Rating", "rating")) || 0,
      comment: pick(r, "Comment", "comment") || "",
      images: asList(pick(r, "ImageUrls", "imageUrls")),
      videoUrl: pick(r, "VideoUrl", "videoUrl") || "",
      date: pick(r, "CreatedDate", "createdDate"),
    })),
  };
}

const checkoutUrl = (productId) => `/checkout?productId=${encodeURIComponent(productId)}`;

/* ------------------------------------------------------------------ stars */
function Stars({ value, size = 18 }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="lp-stars" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "on" : n - 0.5 === rounded ? "half" : ""}>★</span>
      ))}
    </span>
  );
}

function RatingSummary({ rating }) {
  if (!rating || !rating.count) return <span className="lp-muted">No reviews yet</span>;
  return (
    <span className="lp-rating-inline">
      <Stars value={rating.avg} size={16} />
      <strong>{rating.avg.toFixed(1)}</strong>
      <span className="lp-muted">({rating.count} {rating.count === 1 ? "review" : "reviews"})</span>
    </span>
  );
}

/* -------------------------------------------------------------- slideshow */
function Slideshow({ slides, ratings }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) return null;
  const slide = slides[index];

  return (
    <section
      className="lp-hero"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="lp-hero-copy">
        {slide.eyebrow && <p className="lp-eyebrow">{slide.eyebrow}</p>}
        <h2>{slide.title}</h2>
        {slide.description && <p className="lp-lede">{slide.description}</p>}
        {slide.productId && (
          <>
            <RatingSummary rating={ratings[slide.productId]} />
            <div className="lp-actions">
              <Link className="lp-btn" to={checkoutUrl(slide.productId)}>{slide.buttonLabel}</Link>
              <a className="lp-btn lp-btn-ghost" href={`#product-${slide.productId}`}>Details &amp; reviews</a>
            </div>
          </>
        )}
      </div>

      <img
        key={index}
        className="lp-hero-img"
        src={slide.imageUrl}
        alt={slide.imageAlt || slide.title}
        style={{ height: `min(${slide.imageHeight}px, 70vh)`, objectFit: slide.imageFit }}
      />

      {slides.length > 1 && (
        <div className="lp-dots">
          {slides.map((s, i) => (
            <button
              key={i} type="button" className={i === index ? "active" : ""}
              aria-label={`Show slide ${i + 1}: ${s.title}`} aria-current={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ review form */
function ReviewForm({ slug, productId, disabled, onPosted }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const addImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (images.length + files.length > 5) return setError("You can add up to 5 photos.");
    if (files.some((f) => !f.type.startsWith("image/") || f.size > 5 * MB)) return setError("Photos must be images up to 5 MB each.");
    setError(""); setBusy("images");
    try {
      const urls = await Promise.all(files.map((f) => landingPageService.uploadReviewMedia(f)));
      setImages((current) => [...current, ...urls]);
    } catch (e) { setError(apiMessage(e, "Photo upload failed.")); } finally { setBusy(""); }
  };

  const addVideo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/") || file.size > 20 * MB) return setError("Video must be MP4/WebM/MOV up to 20 MB.");
    setError(""); setBusy("video");
    try { setVideoUrl(await landingPageService.uploadReviewMedia(file)); }
    catch (e) { setError(apiMessage(e, "Video upload failed.")); } finally { setBusy(""); }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(""); setDone("");
    if (!rating) return setError("Choose a star rating.");
    try {
      setBusy("submit");
      await landingPageService.addReview(slug, {
        ProductId: productId, ReviewerName: name.trim(), Rating: rating,
        Comment: comment.trim(), ImageUrls: images, VideoUrl: videoUrl || null,
      });
      setName(""); setRating(0); setComment(""); setImages([]); setVideoUrl("");
      setDone("Thanks! Your review is live.");
      onPosted();
    } catch (e) { setError(apiMessage(e, "Could not post your review.")); } finally { setBusy(""); }
  };

  return (
    <form className="lp-review-form" onSubmit={submit}>
      <h4>Write a review</h4>
      {disabled && <p className="lp-muted">Reviews are disabled in preview mode.</p>}
      <fieldset disabled={disabled || busy === "submit"}>
        <div className="lp-star-input" role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={n <= (hover || rating) ? "on" : ""}
              onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}
            >★</button>
          ))}
        </div>
        <label>Your name
          <input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>Your review
          <textarea rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <label>Photos (up to 5)
          <input type="file" accept="image/*" multiple disabled={Boolean(busy)} onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
        </label>
        {images.length > 0 && (
          <div className="lp-thumbs">
            {images.map((url, i) => (
              <div key={url}>
                <img src={url} alt={`Your photo ${i + 1}`} />
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setImages(images.filter((_, n) => n !== i))}>×</button>
              </div>
            ))}
          </div>
        )}
        <label>Video (one, up to 20 MB)
          <input type="file" accept="video/*" disabled={Boolean(busy)} onChange={(e) => { addVideo(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {videoUrl && (
          <div className="lp-video-added">
            <video src={videoUrl} controls preload="metadata" />
            <button type="button" onClick={() => setVideoUrl("")}>Remove video</button>
          </div>
        )}
        {busy === "images" && <p role="status" className="lp-muted">Uploading photos…</p>}
        {busy === "video" && <p role="status" className="lp-muted">Uploading video…</p>}
        {error && <p role="alert" className="lp-error">{error}</p>}
        {done && <p role="status" className="lp-ok">{done}</p>}
        <button className="lp-btn" type="submit" disabled={Boolean(busy)}>
          {busy === "submit" ? "Posting…" : "Post review"}
        </button>
      </fieldset>
    </form>
  );
}

/* -------------------------------------------------------- product section */
function ProductSection({ slug, product, title, buttonLabel, rating, reviews, preview, onPosted }) {
  const [activeImage, setActiveImage] = useState(0);
  const gallery = product?.gallery || [];

  return (
    <section className="lp-product" id={`product-${product.productId}`}>
      <header className="lp-product-head">
        <div>
          <h3>{title}</h3>
          <RatingSummary rating={rating} />
        </div>
        <Link className="lp-btn" to={checkoutUrl(product.productId)}>{buttonLabel}</Link>
      </header>

      <div className="lp-product-grid">
        {gallery.length > 0 && (
          <div className="lp-gallery">
            <img className="lp-gallery-main" src={gallery[activeImage] || gallery[0]} alt={`${title} photo ${activeImage + 1}`} />
            {gallery.length > 1 && (
              <div className="lp-gallery-strip">
                {gallery.map((url, i) => (
                  <button key={`${url}-${i}`} type="button" className={i === activeImage ? "active" : ""} aria-label={`Show photo ${i + 1}`} onClick={() => setActiveImage(i)}>
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="lp-product-text">
          {product.description && <p className="lp-lede">{product.description}</p>}
          {product.highlights.length > 0 && <ul className="lp-highlights">{product.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>}
        </div>
      </div>

      {product.videoUrl && <video className="lp-video" src={product.videoUrl} controls preload="metadata" playsInline />}

      {product.sections.map((section, i) => (
        <div className="lp-section" key={i}>
          <h4>{section.title}</h4>
          <p>{section.content}</p>
        </div>
      ))}

      <div className="lp-reviews">
        <h3>Customer reviews</h3>
        <div className="lp-reviews-grid">
          <div>
            {reviews.length === 0 && <p className="lp-muted">Be the first to review this product.</p>}
            {reviews.map((r) => (
              <article key={r.id} className="lp-review">
                <div className="lp-review-top"><Stars value={r.rating} size={15} /><strong>{r.name}</strong>
                  {r.date && <time className="lp-muted" dateTime={r.date}>{new Date(r.date).toLocaleDateString()}</time>}
                </div>
                {r.comment && <p>{r.comment}</p>}
                {r.images.length > 0 && (
                  <div className="lp-thumbs">{r.images.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Photo from ${r.name}`} /></a>)}</div>
                )}
                {r.videoUrl && <video className="lp-review-video" src={r.videoUrl} controls preload="metadata" playsInline />}
              </article>
            ))}
          </div>
          <ReviewForm slug={slug} productId={product.productId} disabled={preview} onPosted={onPosted} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- page */
export default function LandingPageView() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const preview = params.get("preview") === "1";
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      let raw;
      if (preview) {
        raw = JSON.parse(localStorage.getItem(`landing-page-preview:${slug}`) || "null");
        if (!raw) throw new Error("Nothing to preview. Open the preview from the editor again.");
      } else {
        raw = await landingPageService.getPublished(slug);
      }
      setPage(normalize(raw));
      setError("");
    } catch (e) {
      setError(e?.response?.status === 404 ? "This page isn't available." : apiMessage(e, "We couldn't load this page."));
    } finally {
      setLoading(false);
    }
  }, [slug, preview]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => { if (page?.title) document.title = page.title; }, [page?.title]);

  // One detail section per distinct product used by the slides.
  const productBlocks = useMemo(() => {
    if (!page) return [];
    const seen = new Set();
    return page.slides
      .filter((s) => s.productId && !seen.has(s.productId) && seen.add(s.productId))
      .map((s) => ({
        slide: s,
        product: page.products.find((p) => p.productId === s.productId)
          || { productId: s.productId, description: "", gallery: [], videoUrl: "", highlights: [], sections: [] },
      }));
  }, [page]);

  if (loading) return <main className="lp-state">Loading…</main>;
  if (error) return <main className="lp-state" role="alert">{error}</main>;

  return (
    <div className="lp-page" style={{ "--lp-bg": page.bg, "--lp-fg": page.fg, "--lp-btn": page.btn }}>
      {preview && <div className="lp-preview-bar">Preview of your unsaved draft</div>}
      <header className="lp-intro">
        <h1>{page.title}</h1>
        {page.description && <p className="lp-lede">{page.description}</p>}
      </header>

      <Slideshow slides={page.slides} ratings={page.ratings} />

      {productBlocks.map(({ slide, product }) => (
        <ProductSection
          key={product.productId}
          slug={slug}
          product={product}
          title={slide.title}
          buttonLabel={slide.buttonLabel}
          rating={page.ratings[product.productId]}
          reviews={page.reviews.filter((r) => r.productId === product.productId)}
          preview={preview}
          onPosted={load}
        />
      ))}
    </div>
  );
}
