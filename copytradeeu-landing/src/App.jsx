import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
// SETUP: Replace "copytradeeu" with your Buttondown username
// 1. Go to buttondown.com → create free account
// 2. Your username is in Settings → Basics → Username
// 3. Paste it below
// ═══════════════════════════════════════════════════════
const BUTTONDOWN_USERNAME = "copytradeeu";

const SAMPLE_TRADES = [
  { politician: "Nancy Pelosi", party: "D", action: "BUY", ticker: "NVDA", size: "$250K–$500K", gap: 10, conflict: false, degiro: true },
  { politician: "Kevin Hern", party: "R", action: "SELL", ticker: "UNH", size: "$250K–$500K", gap: 22, conflict: true, degiro: true },
  { politician: "Nancy Pelosi", party: "D", action: "SELL", ticker: "AAPL", size: "$5M–$25M", gap: 33, conflict: false, degiro: true },
  { politician: "Nancy Pelosi", party: "D", action: "BUY", ticker: "GOOGL", size: "$500K–$1M", gap: 10, conflict: false, degiro: true },
  { politician: "Markwayne Mullin", party: "R", action: "BUY", ticker: "MELI", size: "$15K–$50K", gap: 14, conflict: false, degiro: true },
  { politician: "Nancy Pelosi", party: "D", action: "BUY", ticker: "TEM", size: "$50K–$100K", gap: 10, conflict: false, degiro: false },
];

function AnimatedNumber({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        tick();
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: "#e5e5e5", lineHeight: 1.4, paddingRight: 20 }}>{q}</span>
        <span style={{
          fontSize: 20, color: "#63d297", flexShrink: 0, transition: "transform 0.25s ease",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.35s ease",
      }}>
        <p style={{ fontSize: 14, color: "#999", lineHeight: 1.7, paddingBottom: 20, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [hoveredTrade, setHoveredTrade] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [subCount, setSubCount] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch live subscriber count from Buttondown (public endpoint)
  useEffect(() => {
    fetch(`https://api.buttondown.com/v1/newsletters/${BUTTONDOWN_USERNAME}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.subscriber_count) setSubCount(data.subscriber_count); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = email.trim();

    // Basic validation
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        `https://api.buttondown.com/v1/subscribers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email_address: trimmed,
            type: "regular",
            tags: ["landing-page"],
            newsletter: BUTTONDOWN_USERNAME,
          }),
        }
      );

      if (res.ok || res.status === 201) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => null);
        if (res.status === 409 || (data && JSON.stringify(data).toLowerCase().includes("already"))) {
          // Already subscribed — treat as success with different message
          setStatus("success");
          setErrorMsg("already");
        } else {
          setStatus("error");
          setErrorMsg(data?.detail || data?.email_address?.[0] || "Something went wrong. Try again?");
        }
      }
    } catch (err) {
      // Network error — fall back to Buttondown's form endpoint (works without CORS)
      try {
        const formData = new FormData();
        formData.append("email", trimmed);
        await fetch(`https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`, {
          method: "POST",
          body: formData,
          mode: "no-cors", // This won't give us a readable response but WILL subscribe them
        });
        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMsg("Network error — check your connection and try again.");
      }
    }
  };

  return (
    <div style={{ fontFamily: "'Sora', -apple-system, system-ui, sans-serif", background: "#08090e", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .fade-up { animation: fadeUp 0.8s ease-out both; }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.25s; }
        .fade-up-3 { animation-delay: 0.4s; }
        .fade-up-4 { animation-delay: 0.55s; }
        .cta-btn { transition: all 0.2s ease; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,210,151,0.35) !important; }
        .trade-row { transition: all 0.15s ease; }
        .trade-row:hover { background: rgba(99,210,151,0.04) !important; }
        input::placeholder { color: #555; }
        .ticker-track { animation: tickerScroll 30s linear infinite; }
      `}</style>

      {/* ════════ NAV ════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 60 ? "rgba(8,9,14,0.92)" : "transparent",
        backdropFilter: scrollY > 60 ? "blur(20px)" : "none",
        borderBottom: scrollY > 60 ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "linear-gradient(135deg, #63d297, #3ecf8e)", borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            boxShadow: "0 2px 12px rgba(99,210,151,0.25)",
          }}>✈</div>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Copy<span style={{ color: "#63d297" }}>Trade</span>EU</span>
        </div>
        <button onClick={() => document.getElementById("signup").scrollIntoView({ behavior: "smooth" })}
          style={{
            background: "rgba(99,210,151,0.12)", border: "1px solid rgba(99,210,151,0.25)", borderRadius: 8,
            padding: "8px 18px", color: "#63d297", fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,210,151,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,210,151,0.12)"; }}
        >Get free access →</button>
      </nav>

      {/* ════════ HERO ════════ */}
      <section style={{
        position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", textAlign: "center",
        padding: "120px 24px 80px", overflow: "hidden",
      }}>
        {/* BG effects */}
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,210,151,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(180deg, transparent 0%, rgba(8,9,14,0) 40%, #08090e 100%)",
          pointerEvents: "none",
        }} />
        {/* Grid overlay */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          {/* Badge */}
          <div className="fade-up fade-up-1" style={{
            display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,210,151,0.08)",
            border: "1px solid rgba(99,210,151,0.18)", borderRadius: 100, padding: "6px 16px 6px 8px",
            marginBottom: 28,
          }}>
            <span style={{
              background: "#63d297", color: "#08090e", fontSize: 10, fontWeight: 700,
              padding: "2px 8px", borderRadius: 100, letterSpacing: 0.5,
              fontFamily: "'JetBrains Mono', monospace",
            }}>FREE</span>
            <span style={{ fontSize: 13, color: "#999" }}>Built for European investors</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up fade-up-2" style={{
            fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.08,
            letterSpacing: "-0.03em", marginBottom: 20,
          }}>
            Politicians trade stocks.<br />
            <span style={{
              background: "linear-gradient(90deg, #63d297 0%, #3ecf8e 40%, #63d297 80%)",
              backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 4s linear infinite",
            }}>You get the email.</span>
          </h1>

          {/* Sub */}
          <p className="fade-up fade-up-3" style={{
            fontSize: "clamp(16px, 2vw, 19px)", color: "#888", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 36px",
          }}>
            Every morning: what Congress just bought and sold, which trades you can copy on <strong style={{ color: "#ccc" }}>DeGiro</strong> & <strong style={{ color: "#ccc" }}>IBKR</strong>, and which ones smell like insider trading. No fluff, no paywalls.
          </p>

          {/* CTA */}
          <div className="fade-up fade-up-4" id="signup" style={{ maxWidth: 440, margin: "0 auto" }}>
            {status === "success" ? (
              <div style={{
                background: "rgba(99,210,151,0.08)", border: "1px solid rgba(99,210,151,0.25)",
                borderRadius: 12, padding: "20px 24px", textAlign: "center",
                animation: "fadeUp 0.4s ease-out",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: "#63d297", marginBottom: 4 }}>
                  {errorMsg === "already" ? "You're already in!" : "You're in."}
                </div>
                <div style={{ fontSize: 14, color: "#888" }}>
                  {errorMsg === "already"
                    ? "Looks like you've already subscribed. Check your inbox!"
                    : "First briefing hits your inbox tomorrow morning. Check spam if you don't see it."
                  }
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: "flex", gap: 0, background: "rgba(255,255,255,0.04)",
                  border: status === "error" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, padding: 4,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                  transition: "border-color 0.2s ease",
                }}>
                  <input type="email" placeholder="your@email.com" value={email}
                    onChange={e => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    disabled={status === "loading"}
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      padding: "14px 16px", color: "#fff", fontSize: 15,
                      fontFamily: "'Sora', sans-serif",
                      opacity: status === "loading" ? 0.5 : 1,
                    }}
                  />
                  <button className="cta-btn" onClick={handleSubmit}
                    disabled={status === "loading"}
                    style={{
                      background: status === "loading"
                        ? "linear-gradient(135deg, #4a9e72 0%, #3a8e68 100%)"
                        : "linear-gradient(135deg, #63d297 0%, #3ecf8e 100%)",
                      border: "none", borderRadius: 9, padding: "14px 28px",
                      color: "#08090e", fontSize: 15, fontWeight: 700,
                      cursor: status === "loading" ? "wait" : "pointer",
                      boxShadow: "0 4px 20px rgba(99,210,151,0.25)",
                      whiteSpace: "nowrap", minWidth: 160,
                      transition: "all 0.2s",
                    }}>
                    {status === "loading" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span> Subscribing...
                      </span>
                    ) : "Get free access"}
                  </button>
                </div>
                {status === "error" && errorMsg && (
                  <p style={{
                    fontSize: 13, color: "#f87171", marginTop: 10, textAlign: "center",
                    animation: "fadeUp 0.3s ease-out",
                  }}>{errorMsg}</p>
                )}
              </>
            )}
            <p style={{ fontSize: 12, color: "#555", marginTop: 12, textAlign: "center" }}>
              {subCount ? (
                <span>Join <strong style={{ color: "#63d297" }}>{subCount.toLocaleString()}</strong> subscribers · </span>
              ) : null}
              Free forever · No spam · Unsubscribe anytime · GDPR compliant
            </p>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)",
          animation: "float 2.5s ease-in-out infinite",
        }}>
          <div style={{ fontSize: 12, color: "#444", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
            ↓ see a sample
          </div>
        </div>
      </section>

      {/* ════════ TICKER BAR ════════ */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "12px 0", overflow: "hidden", background: "rgba(255,255,255,0.01)",
      }}>
        <div className="ticker-track" style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}>
          {[...Array(2)].map((_, rep) => (
            <div key={rep} style={{ display: "flex", gap: 40, paddingRight: 40 }}>
              {["NVDA", "AAPL", "GOOGL", "AMZN", "TSLA", "META", "MSFT", "UNH", "JPM", "V", "MELI", "PYPL", "TEM", "FCN", "BA", "LMT"].map((t, i) => (
                <span key={`${rep}-${i}`} style={{
                  fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                  color: "rgba(255,255,255,0.15)", letterSpacing: 1,
                }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ════════ SAMPLE TRADES ════════ */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#63d297", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Sample Briefing</p>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            This is what lands in your inbox
          </h2>
        </div>

        {/* Sample intro */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: "24px 26px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>☕</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Today's Briefing</span>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto" }}>Feb 12, 2026</span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: "#bbb" }}>
            Pelosi went shopping again — and this time she brought a big bag. We're talking <strong style={{ color: "#fff" }}>$69 million</strong> worth of repositioning across Big Tech.
            She loaded up on NVDA, GOOGL, and AMZN while dumping Apple and PayPal.{" "}
            <span style={{ color: "#888" }}>Is she betting the AI boom has more room to run? You tell us.</span>
          </p>
        </div>

        {/* Sample trades table */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 72px 80px 100px 60px",
            padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#555",
            textTransform: "uppercase", letterSpacing: 1.2,
          }}>
            <span>Trade</span><span>Action</span><span>Size</span><span>Gap</span><span>DeGiro</span>
          </div>
          {/* Rows */}
          {SAMPLE_TRADES.map((t, i) => (
            <div className="trade-row" key={i}
              onMouseEnter={() => setHoveredTrade(i)}
              onMouseLeave={() => setHoveredTrade(null)}
              style={{
                display: "grid", gridTemplateColumns: "1fr 72px 80px 100px 60px",
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < SAMPLE_TRADES.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                borderLeft: t.conflict ? "3px solid #ef4444" : "3px solid transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 30, height: 30, borderRadius: "50%", fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: t.party === "D" ? "rgba(37,99,235,0.15)" : "rgba(220,38,38,0.15)",
                  color: t.party === "D" ? "#60a5fa" : "#f87171",
                }}>{t.politician.split(" ").map(n => n[0]).join("")}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.ticker}</span>
                    {t.conflict && <span style={{ fontSize: 9, background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "1px 6px", borderRadius: 3 }}>CONFLICT</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#666" }}>{t.politician}</div>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                color: t.action === "BUY" ? "#4ade80" : "#f87171",
              }}>{t.action}</span>
              <span style={{ fontSize: 12, color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>{t.size.split("–")[0]}</span>
              <span style={{ fontSize: 12, color: t.gap > 20 ? "#fbbf24" : "#888", fontFamily: "'JetBrains Mono', monospace" }}>
                {t.gap}d {t.gap > 20 && "⚠"}
              </span>
              <span style={{ fontSize: 14 }}>{t.degiro ? "✅" : "❌"}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#444", textAlign: "center", marginTop: 16 }}>
          ↑ Real trades from STOCK Act filings, Jan–Feb 2026
        </p>
      </section>

      {/* ════════ VALUE PROPS ════════ */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16,
        }}>
          {[
            {
              icon: "🇪🇺", title: "Built for Europe",
              desc: "Every trade tagged with DeGiro and IBKR availability. ETF alternatives when a stock isn't listed. No more Googling ISINs.",
            },
            {
              icon: "🏛️", title: "Conflict detection",
              desc: "We flag when politicians trade stocks in sectors their committees regulate. The trades that matter most — highlighted automatically.",
            },
            {
              icon: "☕", title: "Human-written briefings",
              desc: "Not a data dump. Every morning you get a short, opinionated summary of what happened and why it's interesting. Like a smart friend who reads the filings.",
            },
            {
              icon: "⏱", title: "Filing gap warnings",
              desc: "Politicians can wait up to 45 days to disclose trades. We show you exactly how stale the info is — so you know what's priced in.",
            },
            {
              icon: "📰", title: "Context, not just tickers",
              desc: "2–3 relevant news articles per trade. Know what was happening when they bought — earnings, regulation, insider buzz.",
            },
            {
              icon: "🔒", title: "No tracking, no ads",
              desc: "No affiliate links, no sponsored trades, no data selling. GDPR-compliant. Just the newsletter. We're building a product, not a monetisation engine.",
            },
          ].map((p, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: "28px 24px",
              transition: "all 0.2s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(99,210,151,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              <span style={{ fontSize: 28, display: "block", marginBottom: 14 }}>{p.icon}</span>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.01)",
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto", padding: "56px 24px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center",
        }}>
          {[
            { value: 4700, suffix: "+", label: "Trades tracked yearly" },
            { value: 535, suffix: "", label: "Members of Congress" },
            { value: 45, suffix: " days", label: "Max filing delay" },
            { value: 0, suffix: "", label: "Cost (forever)", display: "€0" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
                <span style={{ color: "#63d297" }}>
                  {s.display || <><AnimatedNumber target={s.value} />{s.suffix}</>}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#63d297", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>3 Steps</p>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            From filing to your broker in minutes
          </h2>
        </div>

        {[
          { step: "01", title: "We scan the filings", desc: "Every day, we pull new STOCK Act disclosures — the same ones buried on SEC.gov. We parse them, verify them, and find the ones that actually matter." },
          { step: "02", title: "You get the briefing", desc: "A short, opinionated email lands in your inbox. No 50-page PDF. No Bloomberg terminal needed. Just: who traded what, and why it's interesting." },
          { step: "03", title: "You decide", desc: "Every trade has a Research button (Yahoo Finance), a DeGiro link, and an IBKR link. Two clicks from email to broker. Or just read it for the gossip — we won't judge." },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", gap: 20, marginBottom: i < 2 ? 36 : 0, alignItems: "flex-start",
          }}>
            <div style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: 10,
              background: "rgba(99,210,151,0.08)", border: "1px solid rgba(99,210,151,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#63d297",
            }}>{s.step}</div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ════════ FAQ ════════ */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Questions
          </h2>
        </div>
        <FaqItem q="Is this legal?" a="Absolutely. All data comes from public STOCK Act filings — politicians are legally required to disclose their trades. We just make them easier to read." />
        <FaqItem q="Is this financial advice?" a="No. We provide information about publicly filed trades for educational and informational purposes only. We're not regulated financial advisors. What you do with the information is entirely your decision. Always do your own research." />
        <FaqItem q="Why is there a delay between the trade and the filing?" a="Under the STOCK Act, politicians have up to 45 days to report trades. That means by the time you see a trade, the stock price may have already moved. We always show the exact gap so you can judge for yourself." />
        <FaqItem q="Can I actually buy these stocks on DeGiro?" a="Most large US stocks (NVDA, AAPL, GOOGL, etc.) are available on DeGiro via NASDAQ or NYSE. For smaller or newer stocks that aren't listed, we suggest ETF alternatives that give you similar exposure." />
        <FaqItem q="Will this always be free?" a="The daily email is free — and will stay free. Down the road we may add a premium tier with extras like portfolio tracking or tax-optimised trade signals, but the core product will always be free." />
        <FaqItem q="How do you handle my data?" a="We store your email address to send the newsletter. That's it. No tracking pixels, no third-party data sharing, no analytics beyond open rates. We're GDPR compliant and based in the EU." />
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section style={{
        position: "relative", padding: "80px 24px", textAlign: "center", overflow: "hidden",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,210,151,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
            Congress trades.<br /><span style={{ color: "#63d297" }}>You should probably know.</span>
          </h2>
          <p style={{ color: "#666", fontSize: 16, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
            Free, daily, no BS. Join the Europeans who actually track this.
          </p>
          <button className="cta-btn" onClick={() => document.getElementById("signup").scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "linear-gradient(135deg, #63d297 0%, #3ecf8e 100%)",
              border: "none", borderRadius: 12, padding: "16px 40px",
              color: "#08090e", fontSize: 17, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(99,210,151,0.25)",
            }}>Get free access →</button>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.04)", padding: "40px 24px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 22, height: 22, background: "linear-gradient(135deg, #63d297, #3ecf8e)", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
          }}>✈</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#555" }}>Copy<span style={{ color: "#666" }}>Trade</span>EU</span>
        </div>
        <p style={{ fontSize: 11, color: "#444", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
          Not financial advice. Data sourced from public STOCK Act filings via Capitol Trades. Past performance does not indicate future results. Always do your own research. © 2026 CopyTradeEU. GDPR compliant.
        </p>
      </footer>
    </div>
  );
}
