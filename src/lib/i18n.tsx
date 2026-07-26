import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Lightweight, React-native i18n — deliberately NOT using the Google
 * Translate widget. That widget is known to conflict with React's virtual
 * DOM (it injects <font> tags around translated text, and React can throw
 * "Failed to execute 'removeChild' on 'Node'" crashes on the next render
 * once the DOM it's tracking has been altered externally). For an app this
 * dynamic, that's a real stability risk — especially mid closed-testing.
 * A plain lookup dictionary has none of that risk and keeps translations
 * under our control.
 *
 * Coverage is intentionally scoped to the highest-traffic surfaces first
 * (sidebar navigation, dashboard, landing page, and the action-button
 * words repeated across every studio) rather than attempting full coverage
 * of every string in the app in one pass. Adding a new key is just adding
 * one line to each language object below; adding a new language is just
 * adding one new object.
 */

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
] as const;

export type LangCode = typeof LANGUAGES[number]["code"];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.overview": "Overview",
  "nav.history": "History",
  "nav.photoEditor": "Photo Editor",
  "nav.videoEditor": "Video Editor",
  "nav.animeStyle": "Anime Style",
  "nav.cartoonComic": "Cartoon & Comic",
  "nav.carouselMaker": "Carousel Maker",
  "nav.billing": "Billing",
  "nav.signOut": "Sign out",
  "nav.language": "Language",

  "dash.hey": "Hey",
  "dash.subtitle": "All 5 studios are ready. Pick one below and start creating.",
  "dash.yourPlan": "Your Plan",
  "dash.upgrade": "Upgrade",
  "dash.yourStudios": "Your Studios",
  "dash.studiosSubtitle": "Everything below is live — tap any studio to start.",
  "dash.openStudio": "Open studio",
  "dash.animeGenerated": "Anime Generated",
  "dash.savedPresets": "Saved Presets",
  "dash.currentPlan": "Current Plan",
  "dash.ctaTitle": "Go unlimited with Creator",
  "dash.viewPricing": "View pricing",
  "dash.requestFeature": "Request a feature",

  "common.back": "Back",
  "common.download": "Download",
  "common.downloadHD": "Download HD",
  "common.downloadWatermarked": "Download (watermarked)",
  "common.upload": "Upload",
  "common.new": "New",
  "common.reset": "Reset All",
  "common.generate": "Generate",
  "common.generating": "Generating...",
  "common.tryAgain": "Try Again",

  "landing.navFeatures": "Features",
  "landing.navPricing": "Pricing",
  "landing.navFaq": "FAQ",
  "landing.navAbout": "About",
  "landing.navContact": "Contact",
  "landing.getStarted": "Get Started",
  "landing.startCreatingFree": "Start creating free",
  "landing.exploreStudios": "Explore studios",
};

const hi: Dict = {
  "nav.overview": "ओवरव्यू",
  "nav.history": "इतिहास",
  "nav.photoEditor": "फ़ोटो एडिटर",
  "nav.videoEditor": "वीडियो एडिटर",
  "nav.animeStyle": "एनीमे स्टाइल",
  "nav.cartoonComic": "कार्टून और कॉमिक",
  "nav.carouselMaker": "कैरोसेल मेकर",
  "nav.billing": "बिलिंग",
  "nav.signOut": "साइन आउट",
  "nav.language": "भाषा",

  "dash.hey": "नमस्ते",
  "dash.subtitle": "सभी 5 स्टूडियो तैयार हैं। नीचे से कोई एक चुनें और बनाना शुरू करें।",
  "dash.yourPlan": "आपका प्लान",
  "dash.upgrade": "अपग्रेड करें",
  "dash.yourStudios": "आपके स्टूडियो",
  "dash.studiosSubtitle": "नीचे सब कुछ लाइव है — शुरू करने के लिए किसी भी स्टूडियो पर टैप करें।",
  "dash.openStudio": "स्टूडियो खोलें",
  "dash.animeGenerated": "एनीमे बनाए गए",
  "dash.savedPresets": "सेव किए गए प्रीसेट",
  "dash.currentPlan": "मौजूदा प्लान",
  "dash.ctaTitle": "क्रिएटर के साथ अनलिमिटेड बनें",
  "dash.viewPricing": "प्राइसिंग देखें",
  "dash.requestFeature": "फ़ीचर का सुझाव दें",

  "common.back": "वापस",
  "common.download": "डाउनलोड करें",
  "common.downloadHD": "HD डाउनलोड करें",
  "common.downloadWatermarked": "डाउनलोड करें (वॉटरमार्क सहित)",
  "common.upload": "अपलोड करें",
  "common.new": "नया",
  "common.reset": "सब रीसेट करें",
  "common.generate": "जनरेट करें",
  "common.generating": "जनरेट हो रहा है...",
  "common.tryAgain": "फिर कोशिश करें",

  "landing.navFeatures": "फ़ीचर्स",
  "landing.navPricing": "प्राइसिंग",
  "landing.navFaq": "सामान्य प्रश्न",
  "landing.navAbout": "हमारे बारे में",
  "landing.navContact": "संपर्क करें",
  "landing.getStarted": "शुरू करें",
  "landing.startCreatingFree": "मुफ्त में बनाना शुरू करें",
  "landing.exploreStudios": "स्टूडियो देखें",
};

const es: Dict = {
  "nav.overview": "Resumen",
  "nav.history": "Historial",
  "nav.photoEditor": "Editor de Fotos",
  "nav.videoEditor": "Editor de Video",
  "nav.animeStyle": "Estilo Anime",
  "nav.cartoonComic": "Caricatura y Cómic",
  "nav.carouselMaker": "Creador de Carruseles",
  "nav.billing": "Facturación",
  "nav.signOut": "Cerrar sesión",
  "nav.language": "Idioma",

  "dash.hey": "Hola",
  "dash.subtitle": "Los 5 estudios están listos. Elige uno abajo y empieza a crear.",
  "dash.yourPlan": "Tu Plan",
  "dash.upgrade": "Mejorar plan",
  "dash.yourStudios": "Tus Estudios",
  "dash.studiosSubtitle": "Todo lo de abajo está activo — toca cualquier estudio para empezar.",
  "dash.openStudio": "Abrir estudio",
  "dash.animeGenerated": "Anime generado",
  "dash.savedPresets": "Ajustes guardados",
  "dash.currentPlan": "Plan actual",
  "dash.ctaTitle": "Ilimitado con Creator",
  "dash.viewPricing": "Ver precios",
  "dash.requestFeature": "Sugerir función",

  "common.back": "Atrás",
  "common.download": "Descargar",
  "common.downloadHD": "Descargar en HD",
  "common.downloadWatermarked": "Descargar (con marca de agua)",
  "common.upload": "Subir",
  "common.new": "Nuevo",
  "common.reset": "Restablecer todo",
  "common.generate": "Generar",
  "common.generating": "Generando...",
  "common.tryAgain": "Intentar de nuevo",

  "landing.navFeatures": "Funciones",
  "landing.navPricing": "Precios",
  "landing.navFaq": "Preguntas",
  "landing.navAbout": "Nosotros",
  "landing.navContact": "Contacto",
  "landing.getStarted": "Comenzar",
  "landing.startCreatingFree": "Crear gratis",
  "landing.exploreStudios": "Ver estudios",
};

const fr: Dict = {
  "nav.overview": "Aperçu",
  "nav.history": "Historique",
  "nav.photoEditor": "Éditeur Photo",
  "nav.videoEditor": "Éditeur Vidéo",
  "nav.animeStyle": "Style Anime",
  "nav.cartoonComic": "Dessin Animé et BD",
  "nav.carouselMaker": "Créateur de Carrousel",
  "nav.billing": "Facturation",
  "nav.signOut": "Se déconnecter",
  "nav.language": "Langue",

  "dash.hey": "Salut",
  "dash.subtitle": "Les 5 studios sont prêts. Choisissez-en un ci-dessous pour commencer à créer.",
  "dash.yourPlan": "Votre Forfait",
  "dash.upgrade": "Passer au forfait supérieur",
  "dash.yourStudios": "Vos Studios",
  "dash.studiosSubtitle": "Tout ci-dessous est en ligne — touchez un studio pour commencer.",
  "dash.openStudio": "Ouvrir le studio",
  "dash.animeGenerated": "Animes générés",
  "dash.savedPresets": "Préréglages enregistrés",
  "dash.currentPlan": "Forfait actuel",
  "dash.ctaTitle": "Passez à l'illimité avec Creator",
  "dash.viewPricing": "Voir les tarifs",
  "dash.requestFeature": "Suggérer une fonctionnalité",

  "common.back": "Retour",
  "common.download": "Télécharger",
  "common.downloadHD": "Télécharger en HD",
  "common.downloadWatermarked": "Télécharger (avec filigrane)",
  "common.upload": "Importer",
  "common.new": "Nouveau",
  "common.reset": "Tout réinitialiser",
  "common.generate": "Générer",
  "common.generating": "Génération...",
  "common.tryAgain": "Réessayer",

  "landing.navFeatures": "Fonctionnalités",
  "landing.navPricing": "Tarifs",
  "landing.navFaq": "FAQ",
  "landing.navAbout": "À propos",
  "landing.navContact": "Contact",
  "landing.getStarted": "Commencer",
  "landing.startCreatingFree": "Créer gratuitement",
  "landing.exploreStudios": "Voir les studios",
};

const DICTIONARIES: Record<LangCode, Dict> = { en, hi, es, fr };

interface LanguageContextValue {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => en[key] ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("geenie_lang") as LangCode | null;
    if (saved && DICTIONARIES[saved]) setLangState(saved);
  }, []);

  function setLang(l: LangCode) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("geenie_lang", l);
  }

  function t(key: string): string {
    return DICTIONARIES[lang]?.[key] ?? en[key] ?? key;
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
