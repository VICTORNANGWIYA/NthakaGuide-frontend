import { createContext, useContext, useState } from "react";

type Lang = "en" | "ny";

const en = {
  nav: {
    home: "Home", analyze: "Analyze", rainfall: "Rainfall",
    history: "History", help: "Help", about: "About",
    profile: "Profile", signIn: "Sign In", signOut: "Sign Out",
  },
  hero: {
    badge: "Smart Soil Analysis for Malawi",
    title: "Smarter Farming",
    titleSpan: "with Soil Intelligence",
    subtitle: "Machine learning crop recommendations and fertilizer predictions tailored to your soil properties and Malawi's rainfall patterns.",
    start: "Start Analysis",
    about: "About",
  },
  stats: {
    f1: "Crop Model F1-Score",
    crops: "Crop Classes",
    fertilizers: "Fertilizer Types",
    districts: "Malawi Districts",
  },
  features: {
    heading: "How NthakaGuide Helps",
    sub: "Empowering Malawian farmers with data-driven agricultural decisions — no expensive sensors required.",
  },
  cta: {
    heading: "Ready to Optimize Your Farm?",
    sub: "Enter your soil data and get personalized crop and fertilizer recommendations in seconds.",
    btn: "Get Started",
  },
  footer: { help: "Help" },
  auth: {
    welcomeBack: "Welcome Back",
    welcomeSub: "Sign in to access your soil analysis tools",
    createAccount: "Create Account",
    createSub: "Join NthakaGuide and start optimising your farm",
    resetPassword: "Reset Password",
    resetSub: "We'll send a verification code to your email",
    email: "Email", password: "Password",
    login: "Sign In", forgotPassword: "Forgot password?",
    noAccount: "Don't have an account? Create one",
    hasAccount: "Already have an account? Sign in",
    fullName: "Full Name", phone: "Your Phone",
    district: "Your District", optional: "(optional)",
    accountType: "Account Type", createBtn: "Create Account",
    signingIn: "Signing in…", creating: "Creating account…",
  },
  forgot: {
    backToLogin: "Back to sign in",
    emailLabel: "Your Email",
    sendCode: "Send Reset Code", sending: "Sending…",
    codeSent: "Code sent", codeSentDesc: "A 6-digit code was sent to",
    verifyLabel: "Verification Code",
    verify: "Verify Code", verifying: "Verifying…",
    resend: "Resend code", resending: "Resending…",
    newPassword: "New Password", confirmPassword: "Confirm Password",
    setPassword: "Set New Password", saving: "Saving…",
    successTitle: "Password updated!",
    successMsg: "Your password has been reset. You can now sign in with your new password.",
    goSignIn: "Go to Sign In",
    enterEmail: "Enter the email address linked to your account and we'll send you a reset code.",
    sentTo: "We sent a 6-digit code to",
    expires: "It expires in 10 minutes.",
    choosePwd: "Choose a strong new password. It must be different from your previous password.",
    codeSentMsg: "Check your inbox for a new code.",
  },
  recommend: {
    title: "Soil Analyzer", results: "Your Recommendations",
    subtitle: "Enter your soil data to get crop and fertilizer recommendations",
    resultsFor: "Results for",
    labTab: "Lab Data", fieldTab: "Field Data",
    district: "District", selectDistrict: "Select your district...",
    running: "Running ML analysis...",
    mlNote: "Random Forest · NASA Rainfall · Climate Zone Filter",
    newAnalysis: "New Analysis", downloadPdf: "Download PDF Report",
    downloadFull: "Download Full Report (PDF)",
    mlPrediction: "ML Model Prediction",
    algorithm: "Algorithm",
    topCrop: "Top Crop Recommendations",
    soilAlerts: "Soil Health Alerts",
    soilAssessment: "Soil Assessment",
    rainfallForecast: "Rainfall Forecast",
    rotationTip: "Crop Rotation Tip",
    rotationWarning: "Rotation Warning",
    goodRotation: "Good Rotation",
    rotationInfo: "Rotation Info",
    fertPlan: "Fertilizer Plan for",
    topPick: "Top Pick",
    getStarted: "🌱 Get Recommendations",
  },
  field: {
    beforeStart: "Before we start",
    beforeStartSub: "Tell us about your farming goals so we can tailor the recommendations.",
    wantToGrow: "What do you want to grow?",
    lastSeason: "What did you grow last season?",
    startBtn: "Start Field Assessment →",
    step: "Step", of: "of", complete: "% complete",
    back: "← Back", next: "Next →",
    filterNote: "Filters recommendations to crops matching your farming goal.",
    rotationNote: "Used for crop rotation advice only — your choice is never restricted.",
  },
  about: {
    mission: "Our Mission",
    missionText: "Agriculture is the backbone of Malawi's economy, yet many smallholder farmers lack access to timely, location-specific guidance. NthakaGuide bridges that gap — putting data-driven recommendations, satellite rainfall intelligence, and fertilizer planning directly in the hands of farmers and extension workers, accessible from any device, completely free.",
    features: "What NthakaGuide Can Do",
    howTo: "How to Use NthakaGuide",
    developers: "Developers",
    covering: "Covering all 28 districts of Malawi",
    contact: "Contact nthakaguide@gmail.com",
    dataNote: "Rainfall data: NASA POWER · Live forecast: Open-Meteo · ML: scikit-learn",
  },
  tour: {
    gettingStarted: "Getting started",
    allDone: "All done",
    stepOf: "Step",
    of: "of",
    begin: "Begin Tour",
    next: "Next",
    back: "Back",
    startFarming: "Start Farming",
    skip: "Skip tour",
  },
  common: {
    loading: "Loading...",
    northern: "Northern Region", central: "Central Region", southern: "Southern Region",
  },
};

const ny: typeof en = {
  nav: {
    home: "Kunyumba", analyze: "Santhula", rainfall: "Mvula",
    history: "Mbiri", help: "Thandizo", about: "Za Ife",
    profile: "Mbiri Yanu", signIn: "Lowani", signOut: "Tulukani",
  },
  hero: {
    badge: "Kusanthula Nthaka Mwa Njira Yanzeru ku Malawi",
    title: "Ulimi Wanzeru",
    titleSpan: "ndi Chidziwitso cha Nthaka",
    subtitle: "Malangizo a mbewu ndi feteleza pogwiritsa ntchito makina ophunzira, otengera nthaka yanu ndi mvula ya Malawi.",
    start: "Yambani Kusanthula",
    about: "Za Ife",
  },
  stats: {
    f1: "Kutsimikizika kwa Mbewu",
    crops: "Mitundu ya Mbewu",
    fertilizers: "Mitundu ya Feteleza",
    districts: "Madera a Malawi",
  },
  features: {
    heading: "Momwe NthakaGuide Imathandizira",
    sub: "Kulimbikitsa alimi aku Malawi ndi zisankho za ulimi zodalira deta — popanda zida zachitengo.",
  },
  cta: {
    heading: "Muli Okonzeka Kupanga Munda Wanu?",
    sub: "Lowetsani chidziwitso cha nthaka ndi kulandira malangizo a mbewu ndi feteleza mwamsanga.",
    btn: "Yambani Tsopano",
  },
  footer: { help: "Thandizo" },
  auth: {
    welcomeBack: "Takulandirani",
    welcomeSub: "Lowani kuti mugwiritse ntchito zida zanu za kusanthula nthaka",
    createAccount: "Pangani Akaunti",
    createSub: "Lowani ku NthakaGuide ndi kuyamba kukonzekera munda wanu",
    resetPassword: "Sintha Chinsinsi",
    resetSub: "Tidzatumiza nambala yachisindikizo ku imelo yanu",
    email: "Imelo", password: "Chinsinsi",
    login: "Lowani", forgotPassword: "Mwaiwala chinsinsi?",
    noAccount: "Mulibe akaunti? Pangani imodzi",
    hasAccount: "Muli ndi akaunti kale? Lowani",
    fullName: "Dzina Lonse", phone: "Nambala ya Foni",
    district: "Boma Lanu", optional: "(osayenera)",
    accountType: "Mtundu wa Akaunti", createBtn: "Pangani Akaunti",
    signingIn: "Kulowa…", creating: "Kupanga akaunti…",
  },
  forgot: {
    backToLogin: "Bwerani kulowa",
    emailLabel: "Imelo Yanu",
    sendCode: "Tumizani Nambala", sending: "Kutumiza…",
    codeSent: "Nambala yatumizidwa", codeSentDesc: "Nambala ya manambala 6 yatumizidwa ku",
    verifyLabel: "Nambala Yachisindikizo",
    verify: "Tsimikizani Nambala", verifying: "Kutsimikiza…",
    resend: "Tumizani nambala yatsopano", resending: "Kutumiza…",
    newPassword: "Chinsinsi Chatsopano", confirmPassword: "Tsimikizani Chinsinsi",
    setPassword: "Sinthani Chinsinsi", saving: "Kusungiratu…",
    successTitle: "Chinsinsi chasinthidwa!",
    successMsg: "Chinsinsi chanu chasinthidwa. Tsopano mungathe kulowa ndi chinsinsi chanu chatsopano.",
    goSignIn: "Pitani Kulowa",
    enterEmail: "Lowetsani imelo yokhudzana ndi akaunti yanu ndipo tidzakutumizani nambala yosintha.",
    sentTo: "Tidatumiza nambala ya manambala 6 ku",
    expires: "Imatha patapita mphindi 10.",
    choosePwd: "Sankhani chinsinsi chosinthasintha. Chiyenera kukhala chosiyana ndi chinsinsi chakale.",
    codeSentMsg: "Onani imelo yanu kwa nambala yatsopano.",
  },
  recommend: {
    title: "Kusanthula Nthaka", results: "Malangizo Anu",
    subtitle: "Lowetsani chidziwitso cha nthaka yanu kuti mulandire malangizo a mbewu ndi feteleza",
    resultsFor: "Zotsatira za",
    labTab: "Deta ya Laboratori", fieldTab: "Deta ya Munda",
    district: "Boma", selectDistrict: "Sankhani boma lanu...",
    running: "Kuyang'ana ndi makina...",
    mlNote: "Random Forest · NASA Mvula · Chigawo cha Nyengo",
    newAnalysis: "Santhula Zatsopano", downloadPdf: "Tsitsani Lipoti la PDF",
    downloadFull: "Tsitsani Lipoti Lonse (PDF)",
    mlPrediction: "Kuganizira kwa Makina",
    algorithm: "Kachitidwe",
    topCrop: "Mbewu Zopambana Poyamba",
    soilAlerts: "Zodziwitsa za Thanzi la Nthaka",
    soilAssessment: "Kuyeza Nthaka",
    rainfallForecast: "Kanema wa Mvula",
    rotationTip: "Uphungu wa Kusintha Mbewu",
    rotationWarning: "Chenjezo la Kusintha",
    goodRotation: "Kusintha Kwabwino",
    rotationInfo: "Chidziwitso cha Kusintha",
    fertPlan: "Dongosolo la Feteleza la",
    topPick: "Yopambana",
    getStarted: "🌱 Pezani Malangizo",
  },
  field: {
    beforeStart: "Tisanayambe",
    beforeStartSub: "Tiuzeni za zolinga zanu za ulimi kuti titsindikize malangizo.",
    wantToGrow: "Mukufuna kukura chiyani?",
    lastSeason: "Munakura chiyani nyengo yapitayi?",
    startBtn: "Yambani Kuyeza Munda →",
    step: "Ndime", of: "ya", complete: "% yathera",
    back: "← Bwerani", next: "Pitani →",
    filterNote: "Itsindikiza malangizo pa mbewu zomwe zimakhudzana ndi cholinga chanu.",
    rotationNote: "Kwa uphungu wa kusintha mbewu kokha — kusankha kwanu sikudzazolezedwa.",
  },
  about: {
    mission: "Cholinga Chathu",
    missionText: "Ulimi ndi mutu wa chuma cha Malawi, komabe alimi ambiri aang'ono alibe mwayi wolandira malangizo okhudza malo awo. NthakaGuide imatsekemera mpata umenewu — kuika malangizo ozikidwa pa deta, chidziwitso cha mvula, ndi dongosolo la feteleza m'manja mwa alimi ndi ogwira ntchito pa ulimi, pogwiritsa ntchito chipangizo chilichonse, kwaulere.",
    features: "Chimene NthakaGuide Ingachite",
    howTo: "Momwe Mugwiritsire Ntchito NthakaGuide",
    developers: "Opanga",
    covering: "Ikuphimba madera onse 28 a Malawi",
    contact: "Lumikizanani nthakaguide@gmail.com",
    dataNote: "Deta ya mvula: NASA POWER · Kanema wamoyo: Open-Meteo · ML: scikit-learn",
  },
  tour: {
    gettingStarted: "Kuyamba",
    allDone: "Zathera zonse",
    stepOf: "Ndime",
    of: "ya",
    begin: "Yambani Ulendo",
    next: "Pitani",
    back: "Bwerani",
    startFarming: "Yambani Ulimi",
    skip: "Sinthani phunziro",
  },
  common: {
    loading: "Kukhoza...",
    northern: "Dera la Kumpoto", central: "Dera la Pakati", southern: "Dera la Kumwera",
  },
};

interface LangCtx {
  lang: Lang;
  t: (key: string) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem("nthakaguide_lang") as Lang) ?? "en"
  );

  const toggleLang = () =>
    setLang(prev => {
      const next = prev === "en" ? "ny" : "en";
      localStorage.setItem("nthakaguide_lang", next);
      return next;
    });

  const t = (key: string): string => {
    const parts = key.split(".");
    let node: any = lang === "en" ? en : ny;
    for (const p of parts) node = node?.[p];
    return typeof node === "string" ? node : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
}