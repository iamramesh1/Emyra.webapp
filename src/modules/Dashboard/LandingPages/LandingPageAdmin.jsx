import { useCallback, useEffect, useState } from "react";
import { FaCopy, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import landingPageService from "../../../services/landingPageService";
import productService from "../../../services/productService";

const blankSlide = () => ({
  eyebrow: "",
  title: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  imageHeight: 620,
  imageFit: "cover",
  productId: "",
  buttonLabel: "Buy now",
  detailDescription: "",
  galleryImages: [],
  videoUrl: "",
  features: [],
  sections: [],
});

const blankPage = () => ({
  id: "",
  title: "",
  slug: "",
  description: "",
  backgroundColor: "#f5f5f7",
  textColor: "#1d1d1f",
  buttonColor: "#0071e3",
  isPublished: false,
  slides: [blankSlide()],
});

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  color: "var(--text)",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  font: "inherit",
};

const panelStyle = {
  padding: 20,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 14px",
  color: "#fff",
  background: "var(--accent)",
  border: 0,
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};

function getValue(item, ...keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
  }
  return "";
}

function getId(item) {
  return getValue(item, "Id", "id", "LandingPageId", "landingPageId");
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }
}

function mapPage(page) {
  const slides = getValue(page, "Slides", "slides");
  const productContents = getValue(page, "ProductContents", "productContents");
  return {
    id: getId(page),
    title: getValue(page, "Title", "title"),
    slug: getValue(page, "Slug", "slug"),
    description: getValue(page, "Description", "description"),
    backgroundColor: getValue(page, "BackgroundColor", "backgroundColor") || "#f5f5f7",
    textColor: getValue(page, "TextColor", "textColor") || "#1d1d1f",
    buttonColor: getValue(page, "ButtonColor", "buttonColor") || "#0071e3",
    isPublished: Boolean(getValue(page, "IsPublished", "isPublished")),
    slides: Array.isArray(slides) && slides.length ? slides.map((slide) => {
      const productContent = Array.isArray(productContents)
        ? productContents.find((content) =>
          String(getValue(content, "ProductId", "productId")) ===
          String(getValue(slide, "ProductId", "productId")))
        : null;
      return {
        eyebrow: getValue(slide, "Eyebrow", "eyebrow"),
        title: getValue(slide, "Title", "title"),
        description: getValue(slide, "Description", "description"),
        imageUrl: getValue(slide, "ImageUrl", "imageUrl"),
        imageAlt: getValue(slide, "ImageAlt", "imageAlt"),
        imageHeight: Number(getValue(slide, "ImageHeight", "imageHeight")) || 620,
        imageFit: getValue(slide, "ImageFit", "imageFit") || "cover",
        productId: String(getValue(slide, "ProductId", "productId") || ""),
        buttonLabel: getValue(slide, "ButtonLabel", "buttonLabel") || "Buy now",
        detailDescription: getValue(productContent, "Description", "description"),
        galleryImages: listValue(getValue(productContent, "GalleryImages", "galleryImages")),
        videoUrl: getValue(productContent, "VideoUrl", "videoUrl"),
        features: listValue(getValue(productContent, "Highlights", "highlights")),
        sections: listValue(getValue(productContent, "Sections", "sections")),
      };
    }) : [blankSlide()],
  };
}

function productId(product) {
  return getValue(product, "Id", "id", "ProductId", "productId");
}

function productTitle(product) {
  return getValue(product, "ProductName", "productName", "ProductsName", "title", "Title") || `Product ${productId(product)}`;
}

function LandingPageAdmin() {
  const [pages, setPages] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(blankPage);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pageRows, productRows] = await Promise.all([
        landingPageService.getAll(),
        productService.getProducts(),
      ]);
      setPages(pageRows);
      setProducts(productRows);
    } catch (loadError) {
      console.error("Failed to load landing pages:", loadError);
      setError(loadError.response?.data?.message || loadError.message || "Unable to load landing pages. Check the API and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([landingPageService.getAll(), productService.getProducts()])
      .then(([pageRows, productRows]) => {
        if (!active) return;
        setPages(pageRows);
        setProducts(productRows);
      })
      .catch((loadError) => {
        console.error("Failed to load landing pages:", loadError);
        if (active) setError(loadError.response?.data?.message || loadError.message || "Unable to load landing pages. Check the API and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const updatePageField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && (!current.slug || current.slug === slugify(current.title))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const updateSlide = (index, key, value) => {
    setForm((current) => ({
      ...current,
      slides: current.slides.map((slide, slideIndex) => slideIndex === index ? { ...slide, [key]: value } : slide),
    }));
  };

  const selectProduct = (index, selectedId) => {
    const product = products.find((item) => String(productId(item)) === String(selectedId));
    setForm((current) => ({
      ...current,
      slides: current.slides.map((slide, slideIndex) => slideIndex === index
        ? {
          ...slide,
          productId: selectedId,
          ...(product ? {
            title: productTitle(product),
            imageUrl: product.image || slide.imageUrl,
            imageAlt: productTitle(product),
            description: product.longDescription || slide.description,
            detailDescription: product.longDescription || slide.detailDescription,
            galleryImages: product.imageUrls?.length ? product.imageUrls : slide.galleryImages,
          } : {}),
        }
        : slide),
    }));
  };

  const uploadMedia = async (index, file, kind) => {
    if (!file) return;
    const isVideo = kind === "video";
    if (isVideo ? !file.type.startsWith("video/") : !file.type.startsWith("image/")) {
      setError(isVideo ? "Choose a video file." : "Choose an image file.");
      return;
    }
    if (isVideo && file.size > 5 * 1024 * 1024) {
      setError("The video must be 5 MB or smaller.");
      return;
    }
    setError("");
    setUploadingMedia(`${kind}:${index}`);
    try {
      const mediaUrl = await landingPageService.uploadMedia(file);
      if (kind === "slide") {
        updateSlide(index, "imageUrl", mediaUrl);
      } else {
        updateSlide(index, "videoUrl", mediaUrl);
      }
      setNotice(`${isVideo ? "Video" : "Image"} uploaded.`);
    } catch (uploadError) {
      console.error(`Failed to upload landing-page ${kind} media:`, uploadError);
      setError(uploadError.response?.data?.message || uploadError.message || `Unable to upload the ${kind} media.`);
    } finally {
      setUploadingMedia("");
    }
  };

  const uploadGalleryImages = async (index, files) => {
    if (!files.length) return;
    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setError("Choose image files for the product gallery.");
      return;
    }

    setError("");
    setUploadingMedia(`gallery:${index}`);
    try {
      const uploadedUrls = await Promise.all(
        files.map((file) => landingPageService.uploadMedia(file))
      );
      setForm((current) => ({
        ...current,
        slides: current.slides.map((slide, slideIndex) => slideIndex === index
          ? { ...slide, galleryImages: [...slide.galleryImages, ...uploadedUrls] }
          : slide),
      }));
      setNotice(`${uploadedUrls.length} gallery ${uploadedUrls.length === 1 ? "image" : "images"} uploaded.`);
    } catch (uploadError) {
      console.error("Failed to upload landing-page gallery images:", uploadError);
      setError(uploadError.response?.data?.message || uploadError.message || "Unable to upload gallery images.");
    } finally {
      setUploadingMedia("");
    }
  };

  const buildPayload = () => ({
    Title: form.title.trim(),
    Slug: slugify(form.slug),
    Description: form.description.trim(),
    BackgroundColor: form.backgroundColor,
    TextColor: form.textColor,
    ButtonColor: form.buttonColor,
    IsPublished: form.isPublished,
    Slides: form.slides.map((slide, index) => ({
      SortOrder: index,
      Eyebrow: slide.eyebrow.trim(),
      Title: slide.title.trim(),
      Description: slide.description.trim(),
      ImageUrl: slide.imageUrl.trim(),
      ImageAlt: slide.imageAlt.trim(),
      ImageHeight: Number(slide.imageHeight),
      ImageFit: slide.imageFit,
      ProductId: slide.productId || null,
      ButtonLabel: slide.buttonLabel.trim() || "Buy now",
    })),
    ProductContents: [...new Map(form.slides.filter((slide) => slide.productId).map((slide) => [String(slide.productId), slide])).values()].map((slide) => ({
      ProductId: slide.productId,
      Description: slide.detailDescription.trim(),
      GalleryImages: slide.galleryImages,
      VideoUrl: slide.videoUrl.trim(),
      Highlights: slide.features,
      Sections: slide.sections,
    })),
  });

  const previewPage = () => {
    setError("");
    const payload = buildPayload();
    try {
      localStorage.setItem(`landing-page-preview:${payload.Slug}`, JSON.stringify(payload));
      window.open(`/p/${encodeURIComponent(payload.Slug)}?preview=1`, "_blank", "noopener,noreferrer");
    } catch (previewError) {
      console.error("Unable to create landing-page preview:", previewError);
      setError("Unable to open the preview. Check browser storage permissions and try again.");
    }
  };

  const savePage = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!form.slides.length || form.slides.some((slide) => !slide.title.trim() || !slide.imageUrl.trim())) {
      setError("Every slide needs a title and an uploaded image.");
      return;
    }
    setSaving(true);
    const payload = buildPayload();
    try {
      const saved = form.id
        ? await landingPageService.update(form.id, payload)
        : await landingPageService.create(payload);
      const savedId = getId(saved);
      if (savedId) setForm((current) => ({ ...current, id: savedId }));
      setNotice(form.isPublished ? "Landing page published." : "Landing page saved as a draft.");
      await loadData();
    } catch (saveError) {
      console.error("Failed to save landing page:", saveError);
      setError(saveError.response?.data?.message || "Unable to save this landing page.");
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (page) => {
    if (!window.confirm(`Delete landing page "${getValue(page, "Title", "title")}"?`)) return;
    setError("");
    setNotice("");
    try {
      await landingPageService.delete(getId(page));
      if (String(form.id) === String(getId(page))) setForm(blankPage());
      setNotice("Landing page deleted.");
      await loadData();
    } catch (deleteError) {
      console.error("Failed to delete landing page:", deleteError);
      setError(deleteError.response?.data?.message || "Unable to delete this landing page.");
    }
  };

  const sharePage = async (slug) => {
    const url = `${window.location.origin}/p/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Public link copied to clipboard.");
    } catch (copyError) {
      console.error("Could not copy landing page link:", copyError);
      setError(`Copy this public link: ${url}`);
    }
  };

  return (
    <main style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
          Campaign studio
        </p>
        <h1 style={{ margin: 0, fontSize: 28 }}>Landing pages</h1>
        <p style={{ color: "var(--text2)", marginBottom: 0 }}>
          Build polished, responsive product stories with image slideshows, direct checkout, and shareable public links.
        </p>
      </header>

      {error && <div role="alert" style={{ padding: 12, marginBottom: 16, color: "#b91c1c", background: "#fee2e2", borderRadius: 8, overflowWrap: "anywhere" }}>{error}</div>}
      {notice && <div role="status" style={{ padding: 12, marginBottom: 16, color: "#166534", background: "#dcfce7", borderRadius: 8 }}>{notice}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 20, alignItems: "start" }}>
        <section style={{ ...panelStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: 18, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Your pages</h2>
            <button type="button" onClick={() => { setForm(blankPage()); setError(""); setNotice(""); }} style={buttonStyle}><FaPlus />New page</button>
          </div>
          {loading ? <p style={{ padding: 18, color: "var(--text2)" }}>Loading pages...</p> : pages.length === 0 ? <p style={{ padding: 18, color: "var(--text2)" }}>No landing pages yet.</p> : pages.map((page) => {
            const slug = getValue(page, "Slug", "slug");
            const published = Boolean(getValue(page, "IsPublished", "isPublished"));
            return (
              <article key={getId(page)} style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{getValue(page, "Title", "title")}</h3>
                    <p style={{ color: "var(--text2)", fontSize: 12, margin: 0, overflowWrap: "anywhere" }}>/p/{slug}</p>
                    <span style={{ color: published ? "var(--success)" : "var(--text2)", fontSize: 12 }}>{published ? "Published" : "Draft"}</span>
                  </div>
                  <button type="button" aria-label={`Delete ${getValue(page, "Title", "title")}`} onClick={() => deletePage(page)} style={{ ...buttonStyle, background: "#dc2626", padding: 8 }}><FaTrash /></button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <button type="button" onClick={() => { setForm(mapPage(page)); setError(""); setNotice(""); }} style={{ ...buttonStyle, padding: "7px 10px", background: "var(--surface2)", color: "var(--text)" }}>Edit</button>
                  {published && <Link to={`/p/${slug}`} target="_blank" rel="noreferrer" style={{ ...buttonStyle, padding: "7px 10px", background: "var(--surface2)", color: "var(--text)" }}><FaEye />Preview</Link>}
                  {published && <button type="button" onClick={() => sharePage(slug)} style={{ ...buttonStyle, padding: "7px 10px", background: "var(--surface2)", color: "var(--text)" }}><FaCopy />Share</button>}
                </div>
              </article>
            );
          })}
        </section>

        <form onSubmit={savePage} style={panelStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{form.id ? "Edit landing page" : "Create landing page"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <label>Page title
              <input required maxLength={150} value={form.title} onChange={(event) => updatePageField("title", event.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <label>Share URL slug
              <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => updatePageField("slug", slugify(event.target.value))} style={{ ...inputStyle, marginTop: 6 }} />
              <small style={{ display: "block", marginTop: 4, color: "var(--text2)" }}>{window.location.origin}/p/{form.slug || "your-page"}</small>
            </label>

              {/* <label>upload product image
              <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => updatePageField("slug", slugify(event.target.value))} style={{ ...inputStyle, marginTop: 6 }} />
              <small style={{ display: "block", marginTop: 4, color: "var(--text2)" }}>{window.location.origin}/p/{form.slug || "your-page"}</small>
            </label>
            <label>upload video
              <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => updatePageField("slug", slugify(event.target.value))} style={{ ...inputStyle, marginTop: 6 }} />
              <small style={{ display: "block", marginTop: 4, color: "var(--text2)" }}>{window.location.origin}/p/{form.slug || "your-page"}</small>
            </label> */}

          </div>
          <label style={{ display: "block", marginTop: 14 }}>Page description
            <textarea rows={3} maxLength={1000} value={form.description} onChange={(event) => updatePageField("description", event.target.value)} style={{ ...inputStyle, marginTop: 6, resize: "vertical" }} />
          </label>

          <h3 style={{ fontSize: 16, margin: "22px 0 10px" }}>Page appearance</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
            {[["Background", "backgroundColor"], ["Text", "textColor"], ["Button", "buttonColor"]].map(([label, key]) => (
              <label key={key}>{label} color
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <input aria-label={`${label} color`} type="color" value={form[key]} onChange={(event) => updatePageField(key, event.target.value)} style={{ width: 48, height: 40, border: 0, background: "transparent", cursor: "pointer" }} />
                  <input value={form[key]} onChange={(event) => updatePageField(key, event.target.value)} style={inputStyle} />
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "24px 0 12px" }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>Slideshow content</h3>
            <button type="button" onClick={() => setForm((current) => ({ ...current, slides: [...current.slides, blankSlide()] }))} style={{ ...buttonStyle, background: "var(--surface2)", color: "var(--text)" }}><FaPlus />Add slide</button>
          </div>

          {form.slides.map((slide, index) => (
            <section key={index} style={{ padding: 16, marginBottom: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>Slide {index + 1}</h4>
                <button type="button" aria-label={`Remove slide ${index + 1}`} disabled={form.slides.length === 1} onClick={() => setForm((current) => ({ ...current, slides: current.slides.filter((_, slideIndex) => slideIndex !== index) }))} style={{ ...buttonStyle, background: "#dc2626", padding: 8, opacity: form.slides.length === 1 ? 0.5 : 1 }}><FaTrash /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <label>Eyebrow text<input maxLength={80} value={slide.eyebrow} onChange={(event) => updateSlide(index, "eyebrow", event.target.value)} style={{ ...inputStyle, marginTop: 6 }} /></label>
                <label>Slide title<input required maxLength={150} value={slide.title} onChange={(event) => updateSlide(index, "title", event.target.value)} style={{ ...inputStyle, marginTop: 6 }} /></label>
                {/* <label>Slide image
                  <input required aria-label={`Upload image for slide ${index + 1}`} type="file" accept="image/*" disabled={Boolean(uploadingMedia)} onChange={(event) => { uploadMedia(index, event.target.files?.[0], "slide"); event.target.value = ""; }} style={{ ...inputStyle, marginTop: 6 }} />
                  {uploadingMedia === `slide:${index}` && <small role="status">Uploading slide image...</small>}
                </label> */}
                
<label>
  Slide image (optional)
  <input
    aria-label={`Upload optional image for slide ${index + 1}`}
    type="file"
    accept="image/*"
    disabled={Boolean(uploadingMedia)}
    onChange={(event) => {
      uploadMedia(index, event.target.files?.[0], "slide");
      event.target.value = "";
    }}
    style={{ ...inputStyle, marginTop: 6 }}
  />
  <small>Upload an image only if required.</small>
</label>

                <label>Image alt text<input maxLength={250} value={slide.imageAlt} onChange={(event) => updateSlide(index, "imageAlt", event.target.value)} style={{ ...inputStyle, marginTop: 6 }} /></label>
                <label>Image height (px)<input type="number" min={240} max={1400} step={10} value={slide.imageHeight} onChange={(event) => updateSlide(index, "imageHeight", event.target.value)} style={{ ...inputStyle, marginTop: 6 }} /></label>
                <label>Image fit
                  <select value={slide.imageFit} onChange={(event) => updateSlide(index, "imageFit", event.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
                    <option value="cover">Fill area (cover)</option><option value="contain">Show full image (contain)</option>
                  </select>
                </label>
                <label>Buy button text<input maxLength={40} value={slide.buttonLabel} onChange={(event) => updateSlide(index, "buttonLabel", event.target.value)} style={{ ...inputStyle, marginTop: 6 }} /></label>
                <label>Product for direct checkout
                  <select value={slide.productId} onChange={(event) => selectProduct(index, event.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
                    <option value="">No product selected</option>
                    {products.map((product) => <option key={productId(product)} value={productId(product)}>{productTitle(product)}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: "block", marginTop: 12 }}>Slide description
                <textarea rows={3} maxLength={1500} value={slide.description} onChange={(event) => updateSlide(index, "description", event.target.value)} style={{ ...inputStyle, marginTop: 6, resize: "vertical" }} />
              </label>
              {slide.productId && (
                <section style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ margin: "0 0 12px" }}>Product landing content</h4>
                  <label style={{ display: "block" }}>Full product description
                    <textarea rows={4} maxLength={5000} value={slide.detailDescription} onChange={(event) => updateSlide(index, "detailDescription", event.target.value)} style={{ ...inputStyle, marginTop: 6, resize: "vertical" }} />
                  </label>
                  <label style={{ display: "block", marginTop: 10 }}>Upload gallery images
                    <input type="file" accept="image/*" multiple disabled={Boolean(uploadingMedia)} onChange={(event) => { uploadGalleryImages(index, Array.from(event.target.files || [])); event.target.value = ""; }} style={{ ...inputStyle, marginTop: 6 }} />
                  </label>
                  {uploadingMedia === `gallery:${index}` && <p role="status">Uploading gallery images...</p>}
                  {slide.galleryImages.length > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>{slide.galleryImages.map((url, imageIndex) => <div key={`${url}-${imageIndex}`} style={{ position: "relative" }}>
                    <img src={url} alt={`Product gallery ${imageIndex + 1}`} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }} />
                    <button type="button" aria-label={`Remove product gallery image ${imageIndex + 1}`} onClick={() => updateSlide(index, "galleryImages", slide.galleryImages.filter((_, currentIndex) => currentIndex !== imageIndex))} style={{ ...buttonStyle, position: "absolute", top: 3, right: 3, padding: 5, background: "#dc2626" }}><FaTrash /></button>
                  </div>)}</div>}
                  <label style={{ display: "block", marginTop: 12 }}>Product video (MP4/WebM, maximum 5 MB)
                    <input type="file" accept="video/*" disabled={Boolean(uploadingMedia)} onChange={(event) => { uploadMedia(index, event.target.files?.[0], "video"); event.target.value = ""; }} style={{ ...inputStyle, marginTop: 6 }} />
                  </label>
                  {uploadingMedia === `video:${index}` && <p role="status">Uploading video...</p>}
                  <label style={{ display: "block", marginTop: 12 }}>Highlights (one per line)
                    <textarea rows={3} value={slide.features.join("\n")} onChange={(event) => updateSlide(index, "features", event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))} style={{ ...inputStyle, marginTop: 6, resize: "vertical" }} />
                  </label>
                  <label style={{ display: "block", marginTop: 12 }}>Additional sections (one per line: heading | description)
                    <textarea rows={4} value={slide.sections.map((section) => `${getValue(section, "Title", "title")} | ${getValue(section, "Content", "content")}`).join("\n")} onChange={(event) => updateSlide(index, "sections", event.target.value.split(/\r?\n/).map((line) => { const [title, ...content] = line.split("|"); return { Title: title.trim(), Content: content.join("|").trim() }; }).filter((section) => section.Title || section.Content))} style={{ ...inputStyle, marginTop: 6, resize: "vertical" }} />
                  </label>
                </section>
              )}
              {slide.imageUrl && <img src={slide.imageUrl} alt={slide.imageAlt} style={{ display: "block", maxWidth: "100%", maxHeight: 180, objectFit: "contain", marginTop: 12, borderRadius: 8 }} />}
            </section>
          ))}

          <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 18px" }}>
            <input type="checkbox" checked={form.isPublished} onChange={(event) => updatePageField("isPublished", event.target.checked)} />
            Publish page and make its share link public
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" disabled={saving || loading} style={buttonStyle}>{saving ? "Saving..." : form.isPublished ? "Save & publish" : "Save draft"}</button>
            <button type="button" onClick={() => { setForm(blankPage()); setError(""); setNotice(""); }} style={{ ...buttonStyle, background: "var(--surface2)", color: "var(--text)" }}>Clear form</button>
            <button type="button" onClick={previewPage} disabled={!form.slug || Boolean(uploadingMedia)} style={{ ...buttonStyle, background: "var(--surface2)", color: "var(--text)" }}><FaEye />Preview current draft</button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default LandingPageAdmin;
