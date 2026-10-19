"""
Generates a Full HD (1920x1080) MP4 product showcase video of the live ReconX-AI
application using Playwright + Pillow + OpenCV, complete with cinema lower-third
subtitles, smooth cross-fades, and live UI interaction captures across all 10 modules.
"""
import os
import shutil
import time
from io import BytesIO
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

WIDTH = 1920
HEIGHT = 1080
FPS = 15

PROJECT_VIDEO_PATH = r"C:\Users\DELL\.gemini\antigravity\scratch\ReconX-AI-repo\ReconX_AI_Complete_Feature_Showcase.mp4"
ARTIFACT_VIDEO_PATH = r"C:\Users\DELL\.gemini\antigravity\brain\8d3e6822-53ec-48a9-9476-54fbcbf7fce9\ReconX_AI_Complete_Feature_Showcase.mp4"


def get_font(size: int, bold: bool = True):
    candidates = [
        r"C:\Windows\Fonts\consolab.ttf" if bold else r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def add_cinema_overlay(
    pil_img: Image.Image,
    scene_num: int,
    total_scenes: int,
    badge_text: str,
    title_text: str,
    subtitle_text: str,
    progress_ratio: float,
) -> np.ndarray:
    """Renders a sleek Bloomberg/HyperBloom cinema HUD overlay onto a 1920x1080 frame."""
    img = pil_img.convert("RGBA").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Top-right Recording & Scene Badge
    draw.rounded_rectangle(
        [(WIDTH - 390, 22), (WIDTH - 28, 72)],
        radius=8,
        fill=(10, 10, 10, 225),
        outline=(249, 115, 22, 230),
        width=2,
    )
    draw.ellipse([(WIDTH - 370, 39), (WIDTH - 354, 55)], fill=(249, 115, 22, 255))
    f_badge = get_font(17, bold=True)
    draw.text(
        (WIDTH - 342, 36),
        f"RECONX-AI // SCENE {scene_num:02d}/{total_scenes:02d}",
        font=f_badge,
        fill=(250, 204, 21, 255),
    )

    # Bottom Cinema Lower-Third Bar
    bar_top = HEIGHT - 158
    bar_bottom = HEIGHT - 48
    draw.rounded_rectangle(
        [(48, bar_top), (WIDTH - 48, bar_bottom)],
        radius=10,
        fill=(12, 12, 12, 238),
        outline=(249, 115, 22, 220),
        width=2,
    )

    # Orange Accent Pillar on Left of Lower-Third
    draw.rounded_rectangle(
        [(48, bar_top), (60, bar_bottom)],
        radius=4,
        fill=(249, 115, 22, 255),
    )

    # Pill tag inside lower-third
    f_tag = get_font(15, bold=True)
    f_title = get_font(26, bold=True)
    f_sub = get_font(18, bold=False)

    draw.rounded_rectangle(
        [(80, bar_top + 14), (480, bar_top + 40)],
        radius=4,
        fill=(249, 115, 22, 45),
        outline=(249, 115, 22, 180),
        width=1,
    )
    draw.text((92, bar_top + 18), badge_text, font=f_tag, fill=(249, 115, 22, 255))

    draw.text((80, bar_top + 46), title_text, font=f_title, fill=(250, 204, 21, 255))
    draw.text((80, bar_top + 80), subtitle_text, font=f_sub, fill=(225, 225, 225, 240))

    # Bottom Progress Line
    prog_w = int((WIDTH - 96) * max(0.02, min(1.0, progress_ratio)))
    draw.rectangle(
        [(48, bar_bottom - 4), (48 + prog_w, bar_bottom)],
        fill=(249, 115, 22, 255),
    )

    combined = Image.alpha_composite(img, overlay).convert("RGB")
    arr = np.array(combined)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def make_title_card(title: str, subtitle: str, tag: str, is_outro: bool = False) -> Image.Image:
    """Creates a high-impact 1920x1080 intro/outro card."""
    img = Image.new("RGB", (WIDTH, HEIGHT), (10, 10, 10))
    draw = ImageDraw.Draw(img)

    # Subtle tactical grid dots
    for x in range(40, WIDTH, 48):
        for y in range(40, HEIGHT, 48):
            draw.ellipse([(x, y), (x + 2, y + 2)], fill=(55, 35, 15))

    # Outer frame border
    draw.rounded_rectangle(
        [(80, 80), (WIDTH - 80, HEIGHT - 80)],
        radius=16,
        fill=(18, 18, 18),
        outline=(249, 115, 22),
        width=3,
    )

    f_tag = get_font(22, bold=True)
    f_main = get_font(58, bold=True)
    f_sub = get_font(26, bold=False)
    f_pills = get_font(20, bold=True)

    draw.rounded_rectangle(
        [(160, 220), (880, 268)],
        radius=6,
        fill=(45, 20, 8),
        outline=(249, 115, 22),
        width=2,
    )
    draw.text((180, 232), tag, font=f_tag, fill=(249, 115, 22))

    draw.text((160, 310), title, font=f_main, fill=(250, 204, 21))
    draw.text((160, 400), subtitle, font=f_sub, fill=(230, 230, 230))

    features = [
        "[F1] COMMAND TERMINAL & LIVE TICKER",
        "[F2] 1-CLICK AI OCR DOCUMENT VAULT",
        "[F4] 5-FACTOR VECTOR & X-RAY MATCHER",
        "[F5/F6] ANOMALY & RAG ROOT-CAUSE",
        "[F7/F8] HUMAN SIGN-OFF & GL MAPPING",
        "[A11Y] COLORBLIND, PAPER & DYSLEXIA HUD",
    ]
    for idx, feat in enumerate(features):
        col = idx % 2
        row = idx // 2
        bx = 160 + col * 800
        by = 500 + row * 95
        draw.rounded_rectangle(
            [(bx, by), (bx + 740, by + 68)],
            radius=8,
            fill=(10, 10, 10),
            outline=(60, 60, 60),
            width=2,
        )
        draw.text((bx + 24, by + 22), f"⚡ {feat}", font=f_pills, fill=(250, 204, 21))

    if is_outro:
        draw.text(
            (160, 840),
            "14 DAYS OF SPREADSHEET CHAOS -> 30 SECONDS OF TACTILE CLARITY // THANK YOU!",
            font=f_tag,
            fill=(249, 115, 22),
        )
    else:
        draw.text(
            (160, 840),
            "FULL 14-SCENE INTERACTIVE FEATURE WALKTHROUGH // NODE.JS + NEXT.JS 14 + FASTAPI SWARM",
            font=f_tag,
            fill=(249, 115, 22),
        )

    return img


def main():
    print("Starting ReconX-AI Full HD Video Capture...")
    captured_scenes = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT})
        page = context.new_page()

        def snap(badge: str, title: str, subtitle: str, hold_sec: float = 3.2):
            raw = page.screenshot(type="png")
            pil_img = Image.open(BytesIO(raw))
            captured_scenes.append(
                {
                    "img": pil_img,
                    "badge": badge,
                    "title": title,
                    "subtitle": subtitle,
                    "hold_sec": hold_sec,
                }
            )
            print(f"Captured Scene {len(captured_scenes)}: {title}")

        # Intro Title Card
        captured_scenes.append(
            {
                "img": make_title_card(
                    "RECONX-AI // FINOPS TERMINAL",
                    "Autonomous Multi-Agent Financial Reconciliation, 5-Factor Vector Matching & Inclusive UX",
                    "HYPERBLOOM OCTOBER // COMPLETE PRODUCT WALKTHROUGH",
                    is_outro=False,
                ),
                "badge": "00 // EXECUTIVE OVERVIEW",
                "title": "RECONX-AI: AUTONOMOUS FINANCIAL RECONCILIATION PLATFORM",
                "subtitle": "Replacing 14 days of manual spreadsheet matching with a 30-second tactile 6-agent AI terminal.",
                "hold_sec": 3.5,
            }
        )

        # 1. Experience Showcase Hero (/)
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(800)
        snap(
            "01 // HYPERBLOOM EXPERIENCE PORTAL",
            "TACTILE NEO-BRUTALIST FINANCIAL EXPERIENCE & UX COMPARATOR",
            "1-Click auto-login portal with live Before/After spreadsheet vs terminal cognitive load comparison.",
            3.5,
        )

        # 2. Scroll to 5-Factor Vector Radar Sandbox on Showcase
        page.evaluate("window.scrollTo(0, 620)")
        page.wait_for_timeout(600)
        snap(
            "02 // USP #1: 5-FACTOR VECTOR CONSTELLATION",
            "INTERACTIVE 5-AXIS VECTOR RADAR & WHAT-IF SENSITIVITY LAB",
            "Real-time SVG radar polygon evaluating Vendor (35%), Amount (35%), Ref (15%), Date (10%) & Narration (5%).",
            3.5,
        )

        # 3. Scroll to X-Ray Laser Diff & Accessibility Engine on Showcase
        page.evaluate("window.scrollTo(0, 1280)")
        page.wait_for_timeout(600)
        snap(
            "03 // USP #2: X-RAY LASER DIFF & A11Y ENGINE",
            "CROSS-LEDGER LASER FIELD LINKAGE & INCLUSIVE ERGONOMICS",
            "Animated SVG Bezier beams link Invoice fields to Bank UTRs + Okabe-Ito Colorblind & Swiss Paper modes.",
            3.5,
        )

        # 4. Login Terminal (/login)
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_timeout(600)
        snap(
            "04 // SYSTEM AUTHENTICATION & RBAC",
            "1-CLICK ROLE PERSONA ACCESS (ADMIN / MANAGER / ANALYST)",
            "Role-based access control with instant zero-latency authentication and colorblind spectrum toggle.",
            3.0,
        )

        # 5. Command Center Dashboard [F1] (/dashboard)
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        page.wait_for_timeout(900)
        snap(
            "05 // MODULE [F1]: COMMAND CENTER",
            "EXECUTIVE COMMAND TERMINAL, LIVE INGESTION TICKER & KPIS",
            "Real-time streaming transaction ticker, reconciliation rate telemetry, and interactive 5-Factor Vector Radar.",
            3.5,
        )

        # 6. AI Reasoning Trace Modal ([AI TRACE])
        try:
            page.get_by_text("AI TRACE").first.click()
            page.wait_for_timeout(700)
            snap(
                "06 // EXPLAINABLE AI (XAI) ENGINE",
                "LIVE 6-AGENT EXECUTION GRAPH & CHAIN-OF-THOUGHT TELEMETRY",
                "Full JSON inspection across DocExtractAgent, WeightedMatcher, AnomalyGuard, Investigation, GL & Audit agents.",
                3.5,
            )
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
        except Exception as e:
            print("AI Trace modal skip:", e)

        # 7. SOX 404 Compliance Certificate Modal ([SOX CERT])
        try:
            page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
            page.wait_for_timeout(500)
            page.get_by_text("SOX CERT").first.click()
            page.wait_for_timeout(700)
            snap(
                "07 // CRYPTOGRAPHIC SOX 404 GOVERNANCE",
                "PRINTABLE SOX 404 / SOC 2 STATUTORY COMPLIANCE CERTIFICATE",
                "Every approved reconciliation pair is stamped with an immutable SHA-256 cryptographic signature.",
                3.5,
            )
        except Exception as e:
            print("SOX Cert modal skip:", e)

        # 8. Document Vault & 1-Click Inbuilt Dataset Lab [F2] (/documents)
        page.goto("http://localhost:3000/documents", wait_until="networkidle")
        page.wait_for_timeout(700)
        # Click the first inbuilt dataset card to trigger live extraction banner
        try:
            page.get_by_text("AWS Cloud India Invoice").first.click()
            page.wait_for_timeout(1200)
        except Exception:
            pass
        snap(
            "08 // MODULE [F2]: DOCUMENT VAULT & OCR",
            "1-CLICK INBUILT JUDGE DATASET LAB & LIVE 3-STAGE OCR",
            "PyMuPDF + Tesseract OCR extracts Vendor, GSTIN, Subtotal (₹1,25,000) + 18% GST (₹22,500) = ₹1,47,500.",
            3.5,
        )

        # 9. General Ledger Feed [F3] (/transactions)
        page.goto("http://localhost:3000/transactions", wait_until="networkidle")
        page.wait_for_timeout(700)
        snap(
            "09 // MODULE [F3]: GENERAL LEDGER FEED",
            "UNIFIED MULTI-SOURCE TRANSACTION LEDGER & BULK APPROVALS",
            "Normalized feed combining Invoices, HDFC Bank Statements, Receipts, and POs with GL confidence badges.",
            3.0,
        )

        # 10. Smart Matcher Engine [F4] (/reconciliation)
        page.goto("http://localhost:3000/reconciliation", wait_until="networkidle")
        page.wait_for_timeout(800)
        snap(
            "10 // MODULE [F4]: SMART MATCHER ENGINE",
            "X-RAY LASER DIFF WORKBENCH & SPLIT-SCREEN COMPARISONS",
            "Side-by-side comparison of Source Invoices vs Counterparty Bank Debits with 1-click Approve/Reject.",
            3.5,
        )

        # 11. Anomaly Control Center [F5] (/anomalies)
        page.goto("http://localhost:3000/anomalies", wait_until="networkidle")
        page.wait_for_timeout(700)
        snap(
            "11 // MODULE [F5]: ANOMALY GUARD",
            "SECTION 194Q TDS TAX VARIANCES & DUPLICATE PAYMENT GUARD",
            "Intercepts ₹300 Microsoft TDS withholding variances and blocks ₹36,000 duplicate Slack corporate card charges.",
            3.2,
        )

        # 12. AI Root-Cause Investigations [F6] (/investigations)
        page.goto("http://localhost:3000/investigations", wait_until="networkidle")
        page.wait_for_timeout(700)
        snap(
            "12 // MODULE [F6]: AI INVESTIGATIONS",
            "CHROMADB RAG POLICY RETRIEVAL & ROOT-CAUSE DOSSIERS",
            "Autonomous investigation timelines cross-referencing bank UTRs against corporate tax and accounting policies.",
            3.2,
        )

        # 13. Human Approvals Queue [F7] (/review) & Chart of Accounts [F8] (/gl-codes)
        page.goto("http://localhost:3000/review", wait_until="networkidle")
        page.wait_for_timeout(700)
        snap(
            "13 // MODULE [F7]: HUMAN-IN-THE-LOOP QUEUE",
            "UNIFIED EXCEPTION SIGN-OFF & MANAGER APPROVAL PIPELINE",
            "Low-confidence and high-severity anomalies route to authorized Finance Managers for 1-click sign-off.",
            3.0,
        )

        page.goto("http://localhost:3000/gl-codes", wait_until="networkidle")
        page.wait_for_timeout(700)
        snap(
            "14 // MODULE [F8]: CHART OF ACCOUNTS (GL)",
            "6-STAGE DETERMINISTIC-FIRST GENERAL LEDGER MAPPING",
            "Historical exact match -> RAG policy -> Vendor dictionary -> Keyword rules -> Bounded LLM classification.",
            3.0,
        )

        # 15. Financial Reports [F9] (/reports) & Audit Logs [F10] (/audit-logs)
        page.goto("http://localhost:3000/reports", wait_until="networkidle")
        page.wait_for_timeout(700)
        snap(
            "15 // MODULE [F9]: FINANCIAL ANALYTICS",
            "EXECUTIVE RECONCILIATION METRICS & INSTANT CSV EXPORT",
            "Live reconciliation accuracy, anomaly breakdown, and GL allocation reports with 1-click CSV export.",
            3.0,
        )

        page.goto("http://localhost:3000/audit-logs", wait_until="networkidle")
        page.wait_for_timeout(700)
        snap(
            "16 // MODULE [F10]: IMMUTABLE AUDIT TRAIL",
            "TAMPER-PROOF CRYPTOGRAPHIC EVENT LEDGER",
            "Every AI extraction, vector match, and manager sign-off is logged with operator identity and timestamp.",
            3.0,
        )

        # 16. Inclusive Colorblind-Safe & Omni-Command Showcase
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        page.wait_for_timeout(500)
        page.evaluate("document.documentElement.setAttribute('data-reconx-theme', 'COLORBLIND_SAFE')")
        page.keyboard.press("Control+k")
        page.wait_for_timeout(600)
        snap(
            "17 // ACCESSIBILITY & OMNI-COMMAND [CTRL+K]",
            "OKABE-ITO COLORBLIND-SAFE SPECTRUM & OMNI-COMMAND PALETTE",
            "Instant keyboard navigation (F1-F10 / 1-0 / Ctrl+K), Dyslexia typography, and multi-sensory audio cues.",
            3.5,
        )

        # Outro Card
        captured_scenes.append(
            {
                "img": make_title_card(
                    "RECONX-AI // READY FOR PRODUCTION",
                    "10 Modules • 6 AI Agents • 5-Factor Vector Radar • X-Ray Diff Loupe • AAA Inclusive UX",
                    "HYPERBLOOM OCTOBER // BUILT TO WIN",
                    is_outro=True,
                ),
                "badge": "18 // SUMMARY",
                "title": "RECONX-AI: 2 WEEKS OF MANUAL CLOSE -> 30 SECONDS",
                "subtitle": "Live at http://localhost:3000 & https://renox-ai-one.vercel.app",
                "hold_sec": 3.5,
            }
        )

        browser.close()

    # Encode MP4 video using OpenCV
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(PROJECT_VIDEO_PATH, fourcc, FPS, (WIDTH, HEIGHT))

    total = len(captured_scenes)
    rendered_frames = []

    for idx, sc in enumerate(captured_scenes):
        frame_bgr = add_cinema_overlay(
            sc["img"],
            scene_num=idx + 1,
            total_scenes=total,
            badge_text=sc["badge"],
            title_text=sc["title"],
            subtitle_text=sc["subtitle"],
            progress_ratio=(idx + 1) / total,
        )
        rendered_frames.append((frame_bgr, sc["hold_sec"]))

    for idx, (frame_bgr, hold_sec) in enumerate(rendered_frames):
        num_hold_frames = int(hold_sec * FPS)
        for f_i in range(num_hold_frames):
            # Subtle slow zoom-in effect (1.0 -> 1.018) for dynamic motion
            scale = 1.0 + 0.018 * (f_i / max(1, num_hold_frames))
            cw = int(WIDTH / scale)
            ch = int(HEIGHT / scale)
            x0 = (WIDTH - cw) // 2
            y0 = (HEIGHT - ch) // 2
            cropped = frame_bgr[y0 : y0 + ch, x0 : x0 + cw]
            zoomed = cv2.resize(cropped, (WIDTH, HEIGHT), interpolation=cv2.INTER_LINEAR)
            writer.write(zoomed)

        # 6-frame smooth cross-fade transition to next scene
        if idx < len(rendered_frames) - 1:
            next_frame = rendered_frames[idx + 1][0]
            fade_steps = 6
            for step in range(1, fade_steps + 1):
                alpha = step / (fade_steps + 1)
                blended = cv2.addWeighted(frame_bgr, 1.0 - alpha, next_frame, alpha, 0)
                writer.write(blended)

    writer.release()
    shutil.copyfile(PROJECT_VIDEO_PATH, ARTIFACT_VIDEO_PATH)
    size_mb = os.path.getsize(PROJECT_VIDEO_PATH) / (1024 * 1024)
    print(f"SUCCESS: Generated {PROJECT_VIDEO_PATH} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
