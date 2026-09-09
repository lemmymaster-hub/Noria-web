"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Image from "next/image";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { useHydrated, useLanguage, useReducedMotion } from "./preferences";
import type { Language } from "./preferences";

type City = {
  name: string;
  country: string;
  coordinates: [number, number];
  label: [number, number];
  tier?: "primary" | "secondary";
};

const VIEWBOX = { width: 700, height: 700 };

const projection = geoMercator()
  .center([19.05, 43.55])
  .scale(2875)
  .translate([VIEWBOX.width / 2, VIEWBOX.height / 2]);

const countryIds = new Set(["008", "070", "191", "499", "688", "705", "807"]);

const cities: City[] = [
  { name: "Sarajevo", country: "BiH", coordinates: [18.4131, 43.8563], label: [13, -13], tier: "primary" },
  { name: "Banja Luka", country: "BiH", coordinates: [17.191, 44.7722], label: [-14, -11], tier: "primary" },
  { name: "Mostar", country: "BiH", coordinates: [17.8078, 43.3438], label: [-12, 18], tier: "primary" },
  { name: "Tuzla", country: "BiH", coordinates: [18.6706, 44.5375], label: [11, -10], tier: "secondary" },
  { name: "Beograd", country: "Srbija", coordinates: [20.4489, 44.7866], label: [12, -13], tier: "primary" },
  { name: "Novi Sad", country: "Srbija", coordinates: [19.8335, 45.2671], label: [11, -12], tier: "primary" },
  { name: "Niš", country: "Srbija", coordinates: [21.8958, 43.3209], label: [12, 4], tier: "primary" },
  { name: "Zagreb", country: "Hrvatska", coordinates: [15.9819, 45.815], label: [-13, -12], tier: "primary" },
  { name: "Split", country: "Hrvatska", coordinates: [16.4402, 43.5081], label: [-12, 18], tier: "primary" },
  { name: "Rijeka", country: "Hrvatska", coordinates: [14.4422, 45.3271], label: [-12, -10], tier: "secondary" },
  { name: "Podgorica", country: "Crna Gora", coordinates: [19.2629, 42.4304], label: [12, -8], tier: "primary" },
  { name: "Bar", country: "Crna Gora", coordinates: [19.1003, 42.0931], label: [-10, 18], tier: "secondary" },
  { name: "Priština", country: "Kosovo", coordinates: [21.1655, 42.6629], label: [12, -8], tier: "primary" },
  { name: "Prizren", country: "Kosovo", coordinates: [20.7397, 42.2139], label: [12, 15], tier: "secondary" },
  { name: "Skoplje", country: "S. Makedonija", coordinates: [21.4316, 41.9981], label: [12, -9], tier: "primary" },
  { name: "Ohrid", country: "S. Makedonija", coordinates: [20.8016, 41.1231], label: [-10, 18], tier: "secondary" },
  { name: "Tirana", country: "Albanija", coordinates: [19.8187, 41.3275], label: [-12, 18], tier: "primary" },
  { name: "Drač", country: "Albanija", coordinates: [19.4565, 41.3231], label: [-11, -11], tier: "secondary" },
];

const copy = {
  bhs: {
    enter: "POKRENI NORIA MREŽU",
    enterHint: "KLIKNI LOGO ZA ULAZ",
    skipIntro: "Preskoči uvod",
    introTitle: "Dobro došli u Noria Technologies",
    initializing: "POKRETANJE NORIA MREŽE",
    introLabel: "SOFTWARE ZA PAMETNE GRADOVE I BIZNISE",
    network: "MREŽA URBANE MOBILNOSTI",
    hub: "SARAJEVO · CENTRALNI HUB",
    connected: "POVEZANI GRADOVI",
    heroEyebrow: "NORIA TECHNOLOGIES · SARAJEVO",
    heroTitleA: "Povezujemo gradove.",
    heroTitleB: "Pojednostavljujemo kretanje.",
    heroText:
      "Gradimo modularne softverske proizvode koji povezuju urbanu mobilnost, gradske servise i ljude u jedno digitalno iskustvo.",
    status: "SISTEM U IZGRADNJI",
    statusTitle: "Mreža je aktivna. Platforma se gradi.",
    statusText:
      "Naš puni web doživljaj uskoro stiže online. Do tada, ovo je prvi signal iz Noria mreže.",
    productsLabel: "PROIZVODI U RAZVOJU",
    products: [
      {
        code: "BSL",
        title: "BSL Mobility",
        text: "Jedna modularna platforma za parking, EV punjenje, javni prevoz i digitalna plaćanja.",
      },
      {
        code: "P",
        title: "Parkiraj.ba",
        text: "Pametno pronalaženje parkinga, navigacija i buduće integrisano plaćanje.",
      },
      {
        code: "MESH",
        title: "BSL Mesh",
        text: "Otporna offline komunikacija za gradove, terenske i službe zaštite i spašavanja.",
      },
    ],
    company:
      "Mobilne i web aplikacije · AI · GIS · IoT · Smart City sistemi · Poslovni softver",
    soundOn: "ZVUK UKLJUČEN",
    soundOff: "ZVUK ISKLJUČEN",
    language: "JEZIK",
    footer: "Iz Sarajeva gradimo digitalnu infrastrukturu za povezaniji Zapadni Balkan.",
    comingSoon: "PUNI WEB · USKORO",
  },
  en: {
    enter: "START THE NORIA NETWORK",
    enterHint: "CLICK THE LOGO TO ENTER",
    skipIntro: "Skip intro",
    introTitle: "Welcome to Noria Technologies",
    initializing: "INITIALIZING NORIA NETWORK",
    introLabel: "SOFTWARE FOR SMART CITIES & BUSINESSES",
    network: "URBAN MOBILITY NETWORK",
    hub: "SARAJEVO · CENTRAL HUB",
    connected: "CONNECTED CITIES",
    heroEyebrow: "NORIA TECHNOLOGIES · SARAJEVO",
    heroTitleA: "Connecting cities.",
    heroTitleB: "Simplifying movement.",
    heroText:
      "We build modular software products that bring urban mobility, city services and people into one connected digital experience.",
    status: "SYSTEM UNDER CONSTRUCTION",
    statusTitle: "The network is live. The platform is being built.",
    statusText:
      "Our complete web experience is coming online soon. Until then, this is the first signal from the Noria network.",
    productsLabel: "PRODUCTS IN DEVELOPMENT",
    products: [
      {
        code: "BSL",
        title: "BSL Mobility",
        text: "One modular platform for parking, EV charging, public transport and digital payments.",
      },
      {
        code: "P",
        title: "Parkiraj.ba",
        text: "Smart parking discovery, navigation and future integrated payment.",
      },
      {
        code: "MESH",
        title: "BSL Mesh",
        text: "Resilient offline communication for cities, field teams and emergency services.",
      },
    ],
    company:
      "Mobile and web apps · AI · GIS · IoT · Smart City systems · Business software",
    soundOn: "SOUND ON",
    soundOff: "SOUND OFF",
    language: "LANGUAGE",
    footer: "From Sarajevo, we are building digital infrastructure for a connected Western Balkans.",
    comingSoon: "FULL WEBSITE · COMING SOON",
  },
} as const;

function buildRoute(start: [number, number], end: [number, number], index: number) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const direction = index % 2 === 0 ? 1 : -1;
  const bend = Math.min(36, distance * 0.12) * direction;
  const middleX = (start[0] + end[0]) / 2 + (-dy / distance) * bend;
  const middleY = (start[1] + end[1]) / 2 + (dx / distance) * bend;

  return `M ${start[0].toFixed(2)} ${start[1].toFixed(2)} Q ${middleX.toFixed(
    2,
  )} ${middleY.toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
}

function LogoSequence({ stage }: { stage: number }) {
  const letters = [
    {
      letter: "N",
      stage: 1,
      paths: [
        "M 501 727 L 501 480 Q 502 461 518 460 Q 529 460 538 470 L 730 676 L 730 383 Q 730 364 748 364",
      ],
    },
    {
      letter: "O",
      stage: 2,
      paths: [
        "M 909 528 C 862 533 833 569 833 620 C 833 668 864 701 909 707",
        "M 932 710 C 980 703 1009 668 1009 620 C 1009 569 977 532 928 527",
      ],
    },
    {
      letter: "R",
      stage: 3,
      paths: [
        "M 468 1118 L 468 857 L 585 857 C 638 857 667 879 667 914 C 667 950 639 969 592 969 L 512 969 L 640 1116 L 730 1116",
      ],
    },
    {
      letter: "A",
      stage: 5,
      paths: [
        "M 787 1118 L 947 860 Q 954 849 962 861 L 1110 1111",
        "M 899 1038 L 1007 1038 L 951 947",
      ],
    },
  ];

  return (
    <div className={`logo-sequence ${stage >= 6 ? "logo-complete" : ""}`}>
      <Image
        alt=""
        className="logo-layer logo-base"
        fill
        priority
        sizes="(max-width: 640px) 76vw, 500px"
        src="/noria-logo-intro.png"
      />
      <svg
        aria-hidden="true"
        className="logo-letter-overlay"
        viewBox="0 0 1536 1536"
      >
        <defs>
          <filter
            height="260%"
            id="letterNeon"
            width="260%"
            x="-80%"
            y="-80%"
          >
            <feGaussianBlur in="SourceGraphic" result="softGlow" stdDeviation="9" />
            <feGaussianBlur in="SourceGraphic" result="wideGlow" stdDeviation="21" />
            <feMerge>
              <feMergeNode in="wideGlow" />
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {letters.map((item) => (
          <g
            className={`logo-letter letter-${item.letter.toLowerCase()} ${
              stage >= item.stage ? "is-lit" : ""
            }`}
            data-letter={item.letter}
            key={item.letter}
          >
            {item.paths.map((path) => (
              <path
                className="logo-letter-stroke"
                d={path}
                key={path}
                pathLength="1"
              />
            ))}
          </g>
        ))}
        <g className={`logo-center-line ${stage >= 4 ? "is-lit" : ""}`}>
          <path
            className="logo-center-line-halo"
            d="M 783 834 L 783 1120"
            pathLength="1"
          />
          <path
            className="logo-center-line-core"
            d="M 783 834 L 783 1120"
            pathLength="1"
          />
        </g>
      </svg>
    </div>
  );
}

function NetworkMap({ language, reducedMotion }: { language: Language; reducedMotion: boolean }) {
  const [selectedCity, setSelectedCity] = useState("Sarajevo");
  const [activeCountry, setActiveCountry] = useState("");

  const map = useMemo(() => {
    const topology = worldAtlas as unknown as Topology;
    const collection = feature(
      topology,
      topology.objects.countries,
    ) as unknown as FeatureCollection;
    const path = geoPath(projection);
    const countries = collection.features
      .filter((country) =>
        countryIds.has(String(country.id ?? "").padStart(3, "0")),
      )
      .map((country) => ({
        id: String(country.id),
        name: String(country.properties?.name ?? ""),
        path: path(country as Feature) ?? "",
      }));

    const points = cities.map((city) => ({
      ...city,
      point: projection(city.coordinates) as [number, number],
    }));
    const sarajevo = points.find((city) => city.name === "Sarajevo")!;
    const routes = points
      .filter((city) => city.name !== "Sarajevo")
      .map((city, index) => ({
        city,
        id: `route-${index}`,
        path: buildRoute(sarajevo.point, city.point, index),
        duration: 3.8 + (index % 5) * 0.55,
        delay: (index * 0.42) % 6,
      }));

    return { countries, points, routes };
  }, []);

  const selected = map.points.find((city) => city.name === selectedCity);

  return (
    <div className="map-stage">
      <div className="map-head">
        <div>
          <span className="section-kicker">{copy[language].network}</span>
          <strong>{copy[language].hub}</strong>
        </div>
        <div className="map-count">
          <span>18</span>
          {copy[language].connected}
        </div>
      </div>

      <svg
        aria-label={
          language === "bhs"
            ? "Mapa mreže urbane mobilnosti Zapadnog Balkana"
            : "Western Balkans urban mobility network map"
        }
        className="network-map"
        role="group"
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      >
        <defs>
          <filter id="cyanGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="countryFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#0b5b78" stopOpacity=".82" />
            <stop offset=".52" stopColor="#082e52" stopOpacity=".94" />
            <stop offset="1" stopColor="#06152f" />
          </linearGradient>
          <linearGradient id="routeGradient" x1="0" x2="1">
            <stop offset="0" stopColor="#2af5ff" stopOpacity=".72" />
            <stop offset=".42" stopColor="#64ffe3" />
            <stop offset=".74" stopColor="#39a8ff" />
            <stop offset="1" stopColor="#a66cff" stopOpacity=".9" />
          </linearGradient>
          <radialGradient id="hubGradient">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".22" stopColor="#bfffff" />
            <stop offset=".58" stopColor="#16e6ff" />
            <stop offset="1" stopColor="#1068ff" />
          </radialGradient>
        </defs>

        <g className="map-countries">
          {map.countries.map((country) => (
            <path
              aria-label={country.name}
              aria-pressed={activeCountry === country.name}
              className={activeCountry === country.name ? "is-active" : ""}
              d={country.path}
              key={country.id}
              onClick={() => setActiveCountry(country.name)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.currentTarget.dispatchEvent(
                    new MouseEvent("click", { bubbles: true }),
                  );
                }
              }}
              role="button"
              tabIndex={0}
            />
          ))}
        </g>

        <g className="network-routes">
          {map.routes.map((route, index) => (
            <g key={route.id}>
              <path className="route-shadow" d={route.path} />
              <path
                className="route-live"
                d={route.path}
                style={{ animationDelay: `${route.delay}s` }}
              />
              {!reducedMotion && (
                <circle className="route-packet" r="3.2">
                  <animateMotion
                    begin={`${route.delay}s`}
                    dur={`${route.duration}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                  >
                    <mpath href={`#${route.id}`} />
                  </animateMotion>
                </circle>
              )}
              <path d={route.path} fill="none" id={route.id} stroke="none" />
              {!reducedMotion && index % 4 === 0 && (
                <circle className="route-packet route-packet-secondary" r="2">
                  <animateMotion
                    begin={`${route.delay + 1.8}s`}
                    dur={`${route.duration + 1.4}s`}
                    repeatCount="indefinite"
                  >
                    <mpath href={`#${route.id}`} />
                  </animateMotion>
                </circle>
              )}
            </g>
          ))}
        </g>

        <g className="city-nodes">
          {map.points.map((city) => {
            const isHub = city.name === "Sarajevo";
            const isActive = city.name === selectedCity;
            return (
              <g
                aria-label={`${city.name}, ${city.country}`}
                aria-pressed={isActive}
                className={`city-node ${isHub ? "is-hub" : ""} ${isActive ? "is-active" : ""}`}
                key={city.name}
                onClick={() => setSelectedCity(city.name)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.currentTarget.dispatchEvent(
                      new MouseEvent("click", { bubbles: true }),
                    );
                  }
                }}
                role="button"
                tabIndex={0}
                transform={`translate(${city.point[0]} ${city.point[1]})`}
              >
                {isHub && (
                  <>
                    <circle className="hub-wave hub-wave-a" r="13" />
                    <circle className="hub-wave hub-wave-b" r="13" />
                  </>
                )}
                <circle className="node-halo" r={isHub ? 12 : 7} />
                <circle className="node-core" r={isHub ? 5.5 : 3.2} />
                <text
                  className={`city-label ${city.tier === "secondary" ? "secondary" : ""}`}
                  dominantBaseline="middle"
                  textAnchor={city.label[0] < 0 ? "end" : "start"}
                  x={city.label[0]}
                  y={city.label[1]}
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="map-readout" aria-live="polite">
        <span className="readout-signal" />
        <div>
          <small>{selectedCity === "Sarajevo" ? copy[language].hub : "NETWORK LINK"}</small>
          <strong>
            Sarajevo <span>→</span> {selected?.name ?? "Sarajevo"}
          </strong>
        </div>
        <span className="readout-country">{selected?.country}</span>
      </div>
    </div>
  );
}

function SiteControls({
  language,
  setLanguage,
  soundEnabled,
  toggleSound,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}) {
  const t = copy[language];
  return (
    <div className="top-actions">
      <button
        aria-label={soundEnabled ? t.soundOn : t.soundOff}
        aria-pressed={soundEnabled}
        className={`sound-toggle ${soundEnabled ? "is-on" : ""}`}
        data-ui-sound="off"
        onClick={toggleSound}
        type="button"
      >
        <span className="sound-bars" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span>{soundEnabled ? t.soundOn : t.soundOff}</span>
      </button>
      <div className="language-switch" role="group" aria-label={t.language}>
        <button
          aria-pressed={language === "bhs"}
          className={language === "bhs" ? "is-active" : ""}
          onClick={() => setLanguage("bhs")}
          type="button"
        >
          BHS
        </button>
        <span />
        <button
          aria-pressed={language === "en"}
          className={language === "en" ? "is-active" : ""}
          onClick={() => setLanguage("en")}
          type="button"
        >
          EN
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useLanguage();
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();
  const [introDismissed, setIntroDismissed] = useState(false);
  const showIntro = hydrated && !introDismissed;
  const [introClosing, setIntroClosing] = useState(false);
  const [stage, setStage] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timers = useRef<number[]>([]);
  const audioPool = useRef<HTMLAudioElement[]>([]);
  const audioIndex = useRef(0);
  const soundEnabledRef = useRef(true);
  const introDialog = useRef<HTMLDialogElement>(null);
  const contentHeading = useRef<HTMLHeadingElement>(null);

  const dismissIntro = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    audioPool.current.forEach((audio) => audio.pause());
    setIntroDismissed(true);
  }, []);

  useEffect(() => {
    const activeTimers = timers.current;
    audioPool.current = Array.from({ length: 7 }, () => {
      const audio = new Audio("/noria-ui-pop-echo.mp3");
      audio.preload = "auto";
      audio.volume = 0.42;
      return audio;
    });

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      audioPool.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "bhs" ? "bs" : "en";
  }, [language]);

  useEffect(() => {
    const dialog = introDialog.current;
    if (!showIntro || !dialog) return;
    const heading = contentHeading.current;

    dialog.showModal();

    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousOverscroll = root.style.overscrollBehavior;

    const syncIntroHeight = () => {
      const visibleHeight = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--intro-height", `${Math.round(visibleHeight)}px`);
    };

    syncIntroHeight();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    window.visualViewport?.addEventListener("resize", syncIntroHeight);
    window.addEventListener("orientationchange", syncIntroHeight);

    return () => {
      dialog.close();
      window.visualViewport?.removeEventListener("resize", syncIntroHeight);
      window.removeEventListener("orientationchange", syncIntroHeight);
      root.style.removeProperty("--intro-height");
      root.style.overflow = previousRootOverflow;
      root.style.overscrollBehavior = previousOverscroll;
      document.body.style.overflow = previousBodyOverflow;
      heading?.focus({ preventScroll: true });
    };
  }, [showIntro]);

  const playUiSound = useCallback((volume = 0.42, force = false) => {
    if (!force && !soundEnabledRef.current) return;

    if (audioPool.current.length === 0) {
      audioPool.current = Array.from({ length: 7 }, () => {
        const audio = new Audio("/noria-ui-pop-echo.mp3");
        audio.preload = "auto";
        return audio;
      });
    }

    const audio = audioPool.current[audioIndex.current % audioPool.current.length];
    audioIndex.current += 1;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => undefined);
    } catch {
      // Optional sound must never block entering or using the site.
    }
  }, []);

  const beginExperience = () => {
    if (stage > 0) return;
    if (reducedMotion) {
      dismissIntro();
      return;
    }

    setStage(1);
    playUiSound(0.5);

    [2, 3, 4, 5].forEach((nextStage, index) => {
      const timer = window.setTimeout(() => {
        setStage(nextStage);
        playUiSound(0.5);
      }, (index + 1) * 720);
      timers.current.push(timer);
    });
    timers.current.push(
      window.setTimeout(() => {
        setStage(6);
      }, 3720),
      window.setTimeout(() => setIntroClosing(true), 4420),
      window.setTimeout(dismissIntro, 4980),
    );
  };

  const toggleSound = () => {
    const nextValue = !soundEnabledRef.current;
    soundEnabledRef.current = nextValue;
    setSoundEnabled(nextValue);
    if (nextValue) {
      playUiSound(0.34, true);
    }
  };

  const handleUiClick = (event: ReactMouseEvent<HTMLElement>) => {
    const interactive = (event.target as Element).closest(
      "button, a, [role='button']",
    );
    if (!interactive || interactive.getAttribute("data-ui-sound") === "off") {
      return;
    }
    playUiSound(0.34);
  };

  const t = copy[language];

  return (
    <main className="site-shell" onClickCapture={handleUiClick}>
      {showIntro && (
        <dialog
          aria-label={t.introTitle}
          className={`intro-screen ${introClosing ? "is-closing" : ""}`}
          onCancel={(event) => {
            event.preventDefault();
            dismissIntro();
          }}
          ref={introDialog}
        >
          <div className="intro-controls">
            <button
              className="intro-skip"
              data-ui-sound="off"
              onClick={dismissIntro}
              type="button"
            >
              {t.skipIntro}
            </button>
            <SiteControls
              language={language}
              setLanguage={setLanguage}
              soundEnabled={soundEnabled}
              toggleSound={toggleSound}
            />
          </div>
          <div className="intro-grid" />
          <div className="intro-orbit intro-orbit-a" />
          <div className="intro-orbit intro-orbit-b" />
          <div className="intro-content">
            <span className="intro-label">{t.introLabel}</span>
            <button
              aria-label={t.enter}
              className="logo-trigger"
              data-ui-sound="off"
              disabled={stage > 0}
              onClick={beginExperience}
              type="button"
            >
              <LogoSequence stage={stage} />
            </button>
            {stage === 0 ? (
              <div className="logo-click-hint">
                <span aria-hidden="true">⌁</span>
                <strong>{t.enterHint}</strong>
              </div>
            ) : (
              <div className="boot-status">
                <span />
                <span />
                <span />
                <small>{t.initializing}</small>
              </div>
            )}
          </div>
        </dialog>
      )}

      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />
      <div className="ambient ambient-d" />
      <div className="page-grid" />

      <header className="topbar">
        <SiteControls
          language={language}
          setLanguage={setLanguage}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
        />
        <div className="site-brand">
          <Image
            alt=""
            className="site-brand-logo"
            height={1254}
            priority
            sizes="(max-width: 640px) 80px, 112px"
            src="/noria-logo-transparent.png"
            width={1254}
          />
          <span className="site-brand-name">Noria Technologies</span>
        </div>
      </header>

      <div className="hero-layout" id="top">
        <section className="map-column">
          <NetworkMap language={language} reducedMotion={reducedMotion} />
        </section>

        <section className="info-column">
          <div className="hero-copy">
            <span className="eyebrow">
              <i />
              {t.heroEyebrow}
            </span>
            <h1 ref={contentHeading} tabIndex={-1}>
              {t.heroTitleA}
              <span>{t.heroTitleB}</span>
            </h1>
            <p>{t.heroText}</p>
          </div>

          <aside className="build-card">
            <div className="build-card-head">
              <span className="live-dot" />
              <small>{t.status}</small>
              <strong>{t.comingSoon}</strong>
            </div>
            <h2>{t.statusTitle}</h2>
            <p>{t.statusText}</p>
            <div className="build-progress" aria-hidden="true">
              <span />
            </div>
          </aside>

          <div className="products">
            <div className="products-head">
              <span>{t.productsLabel}</span>
              <span>03</span>
            </div>
            <div className="product-list">
              {t.products.map((product, index) => (
                <article
                  className="product-card"
                  key={product.title}
                >
                  <div className="product-code">{product.code}</div>
                  <div>
                    <small>0{index + 1}</small>
                    <h3>{product.title}</h3>
                    <p>{product.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <p className="capabilities">{t.company}</p>
        </section>
      </div>

      <footer>
        <p>{t.footer}</p>
        <div>
          <span>43.8563° N</span>
          <span>18.4131° E</span>
          <span>© 2026 NORIA</span>
        </div>
      </footer>
    </main>
  );
}
