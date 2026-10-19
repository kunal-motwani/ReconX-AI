"""
Records a live Full HD (1920x1080) native WebM video of ReconX-AI using
Playwright's built-in video recorder with live DOM cinema lower-third HUD overlays.
"""
import os
import shutil
from playwright.sync_api import sync_playwright

WIDTH = 1920
HEIGHT = 1080

WEBM_PROJECT_PATH = r"C:\Users\DELL\.gemini\antigravity\scratch\ReconX-AI-repo\ReconX_AI_Complete_Feature_Showcase.webm"
WEBM_ARTIFACT_PATH = r"C:\Users\DELL\.gemini\antigravity\brain\8d3e6822-53ec-48a9-9476-54fbcbf7fce9\ReconX_AI_Complete_Feature_Showcase.webm"
WEBM_PUBLIC_PATH = r"C:\Users\DELL\.gemini\antigravity\scratch\ReconX-AI-repo\frontend\public\ReconX_AI_Complete_Feature_Showcase.webm"
TEMP_VID_DIR = r"C:\Users\DELL\.gemini\antigravity\scratch\ReconX-AI-repo\temp_video_rec"


def inject_hud(page, step: int, total: int, badge: str, title: str, subtitle: str):
    pct = round((step / total) * 100)
    js = f"""
    (() => {{
      let el = document.getElementById('reconx-cinema-hud');
      if (!el) {{
        el = document.createElement('div');
        el.id = 'reconx-cinema-hud';
        document.body.appendChild(el);
      }}
      el.style.cssText = 'position:fixed;left:48px;right:48px;bottom:52px;z-index:999999;background:rgba(10,10,10,0.94);border:2px solid #f97316;border-radius:10px;padding:16px 24px;font-family:monospace;box-shadow:0 20px 50px rgba(0,0,0,0.9);pointer-events:none;';
      el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="background:rgba(249,115,22,0.2);border:1px solid #f97316;color:#f97316;font-size:12px;font-weight:800;padding:2px 10px;border-radius:4px;letter-spacing:1px;">
            {badge}
          </span>
          <span style="color:#facc15;font-size:12px;font-weight:800;">
            SCENE {step:02d} / {total:02d} ({pct}%)
          </span>
        </div>
        <div style="color:#facc15;font-size:22px;font-weight:900;letter-spacing:0.5px;margin-bottom:4px;">
          {title}
        </div>
        <div style="color:#e5e5e5;font-size:14px;font-family:sans-serif;">
          {subtitle}
        </div>
        <div style="margin-top:10px;height:4px;background:#262626;border-radius:2px;overflow:hidden;">
          <div style="width:{pct}%;height:100%;background:linear-gradient(90deg,#f97316,#facc15);"></div>
        </div>
      `;
    }})();
    """
    try:
        page.evaluate(js)
    except Exception:
        pass


def main():
    os.makedirs(TEMP_VID_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(WEBM_PUBLIC_PATH), exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            record_video_dir=TEMP_VID_DIR,
            record_video_size={"width": WIDTH, "height": HEIGHT},
        )
        page = context.new_page()
        total = 12

        # Scene 1: Showcase Hero
        page.goto("http://localhost:3000", wait_until="networkidle")
        inject_hud(
            page,
            1,
            total,
            "01 // HYPERBLOOM UX PORTAL",
            "RECONX-AI: FROM 14 DAYS OF SPREADSHEET CHAOS TO 30 SECONDS",
            "Tactile Neo-Brutalist financial experience with 1-Click Auto-Login & Before/After UX Comparator.",
        )
        page.wait_for_timeout(2600)

        # Scene 2: 5-Factor Vector Radar Sandbox
        page.evaluate("window.scrollTo({top: 620, behavior: 'smooth'})")
        inject_hud(
            page,
            2,
            total,
            "02 // USP #1: 5-FACTOR VECTOR CONSTELLATION",
            "INTERACTIVE 5-AXIS VECTOR RADAR & WHAT-IF TOLERANCE LAB",
            "Real-time SVG radar polygon evaluating Vendor (35%), Amount (35%), Ref (15%), Date (10%) & Narration (5%).",
        )
        page.wait_for_timeout(2600)

        # Scene 3: X-Ray Laser Diff & Inclusive Ergonomics
        page.evaluate("window.scrollTo({top: 1260, behavior: 'smooth'})")
        inject_hud(
            page,
            3,
            total,
            "03 // USP #2: X-RAY LASER DIFF & A11Y ENGINE",
            "CROSS-LEDGER LASER FIELD LINKAGE & INCLUSIVE ERGONOMICS",
            "Animated SVG Bezier beams link Invoice fields to Bank UTRs + Okabe-Ito Colorblind & Swiss Paper modes.",
        )
        page.wait_for_timeout(2600)

        # Scene 4: Login Terminal
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        inject_hud(
            page,
            4,
            total,
            "04 // SYSTEM AUTHENTICATION & RBAC",
            "1-CLICK ROLE PERSONA ACCESS (ADMIN / MANAGER / ANALYST)",
            "Role-based access control with instant zero-latency authentication and colorblind spectrum toggle.",
        )
        page.wait_for_timeout(2200)

        # Scene 5: Command Center [F1]
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        inject_hud(
            page,
            5,
            total,
            "05 // MODULE [F1]: COMMAND CENTER",
            "EXECUTIVE COMMAND TERMINAL, LIVE INGESTION TICKER & KPIS",
            "Real-time streaming transaction ticker, reconciliation rate telemetry, and interactive 5-Factor Vector Radar.",
        )
        page.wait_for_timeout(2600)

        # Scene 6: AI Reasoning Trace Modal
        try:
            page.get_by_text("AI TRACE").first.click()
            inject_hud(
                page,
                6,
                total,
                "06 // EXPLAINABLE AI (XAI) ENGINE",
                "LIVE 6-AGENT EXECUTION GRAPH & CHAIN-OF-THOUGHT TELEMETRY",
                "Full JSON inspection across DocExtractAgent, WeightedMatcher, AnomalyGuard, Investigation, GL & Audit agents.",
            )
            page.wait_for_timeout(2500)
            page.keyboard.press("Escape")
        except Exception:
            pass

        # Scene 7: SOX 404 Compliance Certificate Modal
        try:
            page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
            page.get_by_text("SOX CERT").first.click()
            inject_hud(
                page,
                7,
                total,
                "07 // CRYPTOGRAPHIC SOX 404 GOVERNANCE",
                "PRINTABLE SOX 404 / SOC 2 STATUTORY COMPLIANCE CERTIFICATE",
                "Every approved reconciliation pair is stamped with an immutable SHA-256 cryptographic signature.",
            )
            page.wait_for_timeout(2500)
        except Exception:
            pass

        # Scene 8: Document Vault & 1-Click Inbuilt Dataset Lab [F2]
        page.goto("http://localhost:3000/documents", wait_until="networkidle")
        try:
            page.get_by_text("AWS Cloud India Invoice").first.click()
        except Exception:
            pass
        inject_hud(
            page,
            8,
            total,
            "08 // MODULE [F2]: DOCUMENT VAULT & OCR",
            "1-CLICK INBUILT JUDGE DATASET LAB & LIVE 3-STAGE OCR",
            "PyMuPDF + Tesseract OCR extracts Vendor, GSTIN, Subtotal (₹1,25,000) + 18% GST (₹22,500) = ₹1,47,500.",
        )
        page.wait_for_timeout(2800)

        # Scene 9: Smart Matcher Engine [F4]
        page.goto("http://localhost:3000/reconciliation", wait_until="networkidle")
        inject_hud(
            page,
            9,
            total,
            "09 // MODULE [F4]: SMART MATCHER ENGINE",
            "X-RAY LASER DIFF WORKBENCH & SPLIT-SCREEN COMPARISONS",
            "Side-by-side comparison of Source Invoices vs Counterparty Bank Debits with 1-click Approve/Reject.",
        )
        page.wait_for_timeout(2600)

        # Scene 10: Anomaly Guard [F5] & Investigations [F6]
        page.goto("http://localhost:3000/anomalies", wait_until="networkidle")
        inject_hud(
            page,
            10,
            total,
            "10 // MODULES [F5 & F6]: ANOMALY & RAG ROOT-CAUSE",
            "SECTION 194Q TDS TAX VARIANCES & DUPLICATE PAYMENT GUARD",
            "Intercepts ₹300 Microsoft TDS withholding variances and blocks ₹36,000 duplicate Slack corporate card charges.",
        )
        page.wait_for_timeout(2500)

        # Scene 11: Human Approvals [F7] & Chart of Accounts [F8]
        page.goto("http://localhost:3000/gl-codes", wait_until="networkidle")
        inject_hud(
            page,
            11,
            total,
            "11 // MODULES [F7 & F8]: GL MAPPING & APPROVALS",
            "6-STAGE DETERMINISTIC-FIRST GENERAL LEDGER MAPPING",
            "Historical exact match -> RAG policy -> Vendor dictionary -> Keyword rules -> Bounded LLM classification.",
        )
        page.wait_for_timeout(2400)

        # Scene 12: Reports [F9], Audit Trail [F10] & Colorblind Omni-Command
        page.goto("http://localhost:3000/reports", wait_until="networkidle")
        page.evaluate("document.documentElement.setAttribute('data-reconx-theme', 'COLORBLIND_SAFE')")
        page.keyboard.press("Control+k")
        inject_hud(
            page,
            12,
            total,
            "12 // MODULES [F9 & F10] + ACCESSIBILITY HUD",
            "FINANCIAL ANALYTICS, AUDIT TRAIL & COLORBLIND-SAFE OMNI-COMMAND",
            "Full F1-F10 & 1-0 keyboard navigation, CSV exports, Okabe-Ito Colorblind mode, and SHA-256 audit logs.",
        )
        page.wait_for_timeout(2800)

        vid_path = page.video.path()
        context.close()
        browser.close()

    shutil.copyfile(vid_path, WEBM_PROJECT_PATH)
    shutil.copyfile(vid_path, WEBM_ARTIFACT_PATH)
    shutil.copyfile(vid_path, WEBM_PUBLIC_PATH)
    size_mb = os.path.getsize(WEBM_PROJECT_PATH) / (1024 * 1024)
    print(f"SUCCESS: Recorded native WebM video -> {WEBM_PROJECT_PATH} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
