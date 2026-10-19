"""
Builds a 100% frame-accurately synchronized Full HD (1920x1080) H.264 + AAC showcase video.
Every scene's visual hold duration is dynamically driven by its exact spoken voiceover WAV
length, so the narration and the screen transitions match to the exact millisecond.
"""
import os
import shutil
import subprocess
import wave
from io import BytesIO
import numpy as np
import cv2
from PIL import Image
from playwright.sync_api import sync_playwright
from generate_showcase_video import (
    WIDTH,
    HEIGHT,
    FPS,
    add_cinema_overlay,
    make_title_card,
)

PROJECT_DIR = r"C:\Users\DELL\.gemini\antigravity\scratch\ReconX-AI-repo"
ARTIFACT_DIR = r"C:\Users\DELL\.gemini\antigravity\brain\8d3e6822-53ec-48a9-9476-54fbcbf7fce9"
PUBLIC_DIR = os.path.join(PROJECT_DIR, "frontend", "public")
TEMP_AUDIO_DIR = os.path.join(PROJECT_DIR, "temp_scene_audio")

TEMP_SILENT_MP4 = os.path.join(PROJECT_DIR, "temp_synced_silent.mp4")
MASTER_WAV = os.path.join(PROJECT_DIR, "master_synced_soundtrack.wav")

FINAL_MP4_MAIN = os.path.join(PROJECT_DIR, "ReconX_AI_Complete_Feature_Showcase.mp4")
FINAL_MP4_AUDIO = os.path.join(PROJECT_DIR, "ReconX_AI_Showcase_With_Commentary_And_Music.mp4")
ARTIFACT_MP4_MAIN = os.path.join(ARTIFACT_DIR, "ReconX_AI_Complete_Feature_Showcase.mp4")
ARTIFACT_MP4_AUDIO = os.path.join(ARTIFACT_DIR, "ReconX_AI_Showcase_With_Commentary_And_Music.mp4")
PUBLIC_MP4_AUDIO = os.path.join(PUBLIC_DIR, "ReconX_AI_Showcase_With_Commentary_And_Music.mp4")


SCENES_CONFIG = [
    {
        "id": "01_intro",
        "badge": "01 // EXECUTIVE OVERVIEW",
        "title": "RECONX-AI: AUTONOMOUS FINANCIAL RECONCILIATION PLATFORM",
        "subtitle": "Replacing 14 days of manual spreadsheet matching with a 30-second tactile 6-agent AI terminal.",
        "narration": "Welcome to ReconX A I. We replace fourteen days of painful manual spreadsheet matching with a thirty-second, six-agent financial terminal.",
    },
    {
        "id": "02_portal",
        "badge": "02 // HYPERBLOOM EXPERIENCE PORTAL",
        "title": "TACTILE NEO-BRUTALIST FINANCIAL EXPERIENCE & UX COMPARATOR",
        "subtitle": "1-Click auto-login portal with live Before and After spreadsheet vs terminal cognitive load comparison.",
        "narration": "On the HyperBloom Experience Portal, judges can compare legacy spreadsheet chaos against our tactile terminal and launch the live workspace in one click.",
    },
    {
        "id": "03_radar",
        "badge": "03 // USP #1: 5-FACTOR VECTOR CONSTELLATION",
        "title": "INTERACTIVE 5-AXIS VECTOR RADAR & WHAT-IF SENSITIVITY LAB",
        "subtitle": "Real-time SVG radar polygon evaluating Vendor (35%), Amount (35%), Ref (15%), Date (10%) & Narration (5%).",
        "narration": "Our interactive five-factor Vector Constellation lets you drag sensitivity sliders for vendor typos, tax variances, and date lag while watching the radar polygon morph live.",
    },
    {
        "id": "04_xray",
        "badge": "04 // USP #2: X-RAY LASER DIFF & A11Y ENGINE",
        "title": "CROSS-LEDGER LASER FIELD LINKAGE & INCLUSIVE ERGONOMICS",
        "subtitle": "Animated SVG Bezier beams link Invoice fields to Bank UTRs + Okabe-Ito Colorblind & Swiss Paper modes.",
        "narration": "Below that, the X-Ray Laser Diff Loupe connects source invoice fields directly to bank U T R narrations, paired with Colorblind, Daylight Paper, and Dyslexia accessibility modes.",
    },
    {
        "id": "05_login",
        "badge": "05 // SYSTEM AUTHENTICATION & RBAC",
        "title": "1-CLICK ROLE PERSONA ACCESS (ADMIN / MANAGER / ANALYST)",
        "subtitle": "Role-based access control with instant zero-latency authentication and colorblind spectrum toggle.",
        "narration": "On the authentication terminal, operators can switch instantly between Admin, Finance Manager, and Analyst personas with one click.",
    },
    {
        "id": "06_f1_dashboard",
        "badge": "06 // MODULE [F1]: COMMAND CENTER",
        "title": "EXECUTIVE COMMAND TERMINAL, LIVE INGESTION TICKER & KPIS",
        "subtitle": "Real-time streaming transaction ticker, reconciliation rate telemetry, and interactive 5-Factor Vector Radar.",
        "narration": "Pressing F 1 opens the Command Center Dashboard, featuring a live streaming bank ingestion ticker, real-time reconciliation KPIs, and General Ledger allocation charts.",
    },
    {
        "id": "07_ai_trace",
        "badge": "07 // EXPLAINABLE AI (XAI) ENGINE",
        "title": "LIVE 6-AGENT EXECUTION GRAPH & CHAIN-OF-THOUGHT TELEMETRY",
        "subtitle": "Full JSON inspection across DocExtractAgent, WeightedMatcher, AnomalyGuard, Investigation, GL & Audit agents.",
        "narration": "Clicking A I Trace opens our Explainable A I execution graph, exposing the exact JSON reasoning and millisecond latency across all six autonomous agents.",
    },
    {
        "id": "08_sox_cert",
        "badge": "08 // CRYPTOGRAPHIC SOX 404 GOVERNANCE",
        "title": "PRINTABLE SOX 404 / SOC 2 STATUTORY COMPLIANCE CERTIFICATE",
        "subtitle": "Every approved reconciliation pair is stamped with an immutable SHA-256 cryptographic signature.",
        "narration": "Clicking SOX Cert generates a printable SOX 404 compliance certificate stamped with tamper-proof S H A 256 cryptographic signatures for external auditors.",
    },
    {
        "id": "09_f2_docs",
        "badge": "09 // MODULE [F2]: DOCUMENT VAULT & OCR",
        "title": "1-CLICK INBUILT JUDGE DATASET LAB & LIVE 3-STAGE OCR",
        "subtitle": "PyMuPDF + Tesseract OCR extracts Vendor, GSTIN, Subtotal (₹1,25,000) + 18% GST (₹22,500) = ₹1,47,500.",
        "narration": "Pressing F 2 opens the Document Vault, where clicking any inbuilt judge dataset runs a three-stage O C R extraction and verifies that subtotal plus G S T equals the exact invoice total.",
    },
    {
        "id": "10_f3_ledger",
        "badge": "10 // MODULE [F3]: GENERAL LEDGER FEED",
        "title": "UNIFIED MULTI-SOURCE TRANSACTION LEDGER & BULK APPROVALS",
        "subtitle": "Normalized feed combining Invoices, HDFC Bank Statements, Receipts, and POs with GL confidence badges.",
        "narration": "Pressing F 3 opens the unified General Ledger Feed, normalizing invoices, receipts, purchase orders, and H D F C bank debits into a single searchable table.",
    },
    {
        "id": "11_f4_matcher",
        "badge": "11 // MODULE [F4]: SMART MATCHER ENGINE",
        "title": "X-RAY LASER DIFF WORKBENCH & SPLIT-SCREEN COMPARISONS",
        "subtitle": "Side-by-side comparison of Source Invoices vs Counterparty Bank Debits with 1-click Approve/Reject.",
        "narration": "Pressing F 4 launches the Smart Matcher Engine, displaying side-by-side split cards comparing vendor invoices against bank statement debits with one-click approval.",
    },
    {
        "id": "12_f5_anomalies",
        "badge": "12 // MODULE [F5]: ANOMALY GUARD",
        "title": "SECTION 194Q TDS TAX VARIANCES & DUPLICATE PAYMENT GUARD",
        "subtitle": "Intercepts ₹300 Microsoft TDS withholding variances and blocks ₹36,000 duplicate Slack corporate card charges.",
        "narration": "Pressing F 5 opens the Anomaly Guard, which automatically flags a three-hundred-rupee Section 194 Q T D S tax variance on Microsoft Azure and intercepts a duplicate Slack payment.",
    },
    {
        "id": "13_f6_investigations",
        "badge": "13 // MODULE [F6]: AI INVESTIGATIONS",
        "title": "CHROMADB RAG POLICY RETRIEVAL & ROOT-CAUSE DOSSIERS",
        "subtitle": "Autonomous investigation timelines cross-referencing bank UTRs against corporate tax and accounting policies.",
        "narration": "Pressing F 6 opens A I Root-Cause Investigations, where our Chroma D B vector store retrieves corporate tax policy clauses and builds a step-by-step evidence timeline.",
    },
    {
        "id": "14_f7_review",
        "badge": "14 // MODULE [F7]: HUMAN-IN-THE-LOOP QUEUE",
        "title": "UNIFIED EXCEPTION SIGN-OFF & MANAGER APPROVAL PIPELINE",
        "subtitle": "Low-confidence and high-severity anomalies route to authorized Finance Managers for 1-click sign-off.",
        "narration": "Pressing F 7 routes exceptions to the Human Approvals Queue, giving finance managers full control to sign off or reject flagged discrepancies.",
    },
    {
        "id": "15_f8_gl",
        "badge": "15 // MODULE [F8]: CHART OF ACCOUNTS (GL)",
        "title": "6-STAGE DETERMINISTIC-FIRST GENERAL LEDGER MAPPING",
        "subtitle": "Historical exact match -> RAG policy -> Vendor dictionary -> Keyword rules -> Bounded LLM classification.",
        "narration": "Pressing F 8 displays the Chart of Accounts, powered by our six-stage deterministic-first General Ledger classifier that eliminates manual bookkeeping.",
    },
    {
        "id": "16_f9_reports",
        "badge": "16 // MODULE [F9]: FINANCIAL ANALYTICS",
        "title": "EXECUTIVE RECONCILIATION METRICS & INSTANT CSV EXPORT",
        "subtitle": "Live reconciliation accuracy, anomaly breakdown, and GL allocation reports with 1-click CSV export.",
        "narration": "Pressing F 9 opens Financial Analytics and Reports, providing executive reconciliation metrics and instant one-click C S V spreadsheet downloads.",
    },
    {
        "id": "17_f10_audit",
        "badge": "17 // MODULE [F10]: IMMUTABLE AUDIT TRAIL",
        "title": "TAMPER-PROOF CRYPTOGRAPHIC EVENT LEDGER",
        "subtitle": "Every AI extraction, vector match, and manager sign-off is logged with operator identity and timestamp.",
        "narration": "Pressing F 10 reveals the Immutable Audit Trail, recording every extraction, match, and human sign-off with operator identity and timestamp.",
    },
    {
        "id": "18_a11y_cmd",
        "badge": "18 // ACCESSIBILITY & OMNI-COMMAND [CTRL+K]",
        "title": "OKABE-ITO COLORBLIND-SAFE SPECTRUM & OMNI-COMMAND PALETTE",
        "subtitle": "Instant keyboard navigation (F1-F10 / 1-0 / Ctrl+K), Dyslexia typography, and multi-sensory audio cues.",
        "narration": "Finally, pressing Control K opens the Omni-Command Palette alongside our Okabe-Ito Colorblind-Safe spectrum mode. Thank you for experiencing ReconX A I.",
    },
]


def synthesize_all_scene_wavs():
    os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)
    ps_lines = [
        "Add-Type -AssemblyName System.Speech",
        "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
        "$synth.Rate = 1",
        "$synth.Volume = 100",
        "$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(44100, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)",
    ]
    for idx, sc in enumerate(SCENES_CONFIG):
        wav_path = os.path.join(TEMP_AUDIO_DIR, f"scene_{idx:02d}.wav")
        sc["wav_path"] = wav_path
        safe_text = sc["narration"].replace("'", " ")
        ps_lines.append(f"$synth.SetOutputToWaveFile('{wav_path}', $format)")
        ps_lines.append(f"$synth.Speak('{safe_text}')")

    ps_lines.append("$synth.Dispose()")
    ps_cmd = "\n".join(ps_lines)
    print("Synthesizing 18 individual per-scene voiceover WAV files...")
    subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=True)

    for idx, sc in enumerate(SCENES_CONFIG):
        with wave.open(sc["wav_path"], "rb") as wf:
            n_frames = wf.getnframes()
            raw = wf.readframes(n_frames)
            samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
            sc["samples"] = samples
            sc["audio_sec"] = len(samples) / 44100.0
            # Hold visual scene for exact audio length + 0.35s breathing room
            sc["hold_sec"] = max(2.8, sc["audio_sec"] + 0.35)
            print(f"Scene {idx+1:02d} ({sc['id']}): voice={sc['audio_sec']:.2f}s -> visual_hold={sc['hold_sec']:.2f}s")


def capture_all_scene_images():
    print("Capturing 18 Full HD scenes via Playwright...")
    images = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT})
        page = context.new_page()

        def grab():
            raw = page.screenshot(type="png")
            return Image.open(BytesIO(raw))

        # 01 Intro Card
        images.append(
            make_title_card(
                "RECONX-AI // FINOPS TERMINAL",
                "Autonomous Multi-Agent Financial Reconciliation, 5-Factor Vector Matching & Inclusive UX",
                "HYPERBLOOM OCTOBER // COMPLETE PRODUCT WALKTHROUGH",
                is_outro=False,
            )
        )

        # 02 Portal Hero
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 03 5-Factor Radar
        page.evaluate("window.scrollTo(0, 620)")
        page.wait_for_timeout(500)
        images.append(grab())

        # 04 X-Ray Diff & A11y
        page.evaluate("window.scrollTo(0, 1280)")
        page.wait_for_timeout(500)
        images.append(grab())

        # 05 Login
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_timeout(500)
        images.append(grab())

        # 06 Dashboard [F1]
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        page.wait_for_timeout(700)
        images.append(grab())

        # 07 AI Trace Modal
        try:
            page.get_by_text("AI TRACE").first.click()
            page.wait_for_timeout(600)
        except Exception:
            pass
        images.append(grab())
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
        except Exception:
            pass

        # 08 SOX Cert Modal
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        page.wait_for_timeout(400)
        try:
            page.get_by_text("SOX CERT").first.click()
            page.wait_for_timeout(600)
        except Exception:
            pass
        images.append(grab())

        # 09 Document Vault [F2]
        page.goto("http://localhost:3000/documents", wait_until="networkidle")
        page.wait_for_timeout(500)
        try:
            page.get_by_text("AWS Cloud India Invoice").first.click()
            page.wait_for_timeout(1100)
        except Exception:
            pass
        images.append(grab())

        # 10 General Ledger Feed [F3]
        page.goto("http://localhost:3000/transactions", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 11 Smart Matcher [F4]
        page.goto("http://localhost:3000/reconciliation", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 12 Anomalies [F5]
        page.goto("http://localhost:3000/anomalies", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 13 Investigations [F6]
        page.goto("http://localhost:3000/investigations", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 14 Human Approvals [F7]
        page.goto("http://localhost:3000/review", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 15 Chart of Accounts [F8]
        page.goto("http://localhost:3000/gl-codes", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 16 Financial Reports [F9]
        page.goto("http://localhost:3000/reports", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 17 Audit Trail [F10]
        page.goto("http://localhost:3000/audit-logs", wait_until="networkidle")
        page.wait_for_timeout(600)
        images.append(grab())

        # 18 Colorblind + Ctrl+K Omni-Command
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        page.wait_for_timeout(400)
        page.evaluate("document.documentElement.setAttribute('data-reconx-theme', 'COLORBLIND_SAFE')")
        page.keyboard.press("Control+k")
        page.wait_for_timeout(500)
        images.append(grab())

        browser.close()

    return images


def build_synced_video_and_audio(images):
    sr = 44100
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(TEMP_SILENT_MP4, fourcc, FPS, (WIDTH, HEIGHT))

    total_scenes = len(SCENES_CONFIG)
    rendered_bgr = []
    for idx, sc in enumerate(SCENES_CONFIG):
        bgr = add_cinema_overlay(
            images[idx],
            scene_num=idx + 1,
            total_scenes=total_scenes,
            badge_text=sc["badge"],
            title_text=sc["title"],
            subtitle_text=sc["subtitle"],
            progress_ratio=(idx + 1) / total_scenes,
        )
        rendered_bgr.append(bgr)

    fade_frames = 5
    current_video_frame = 0
    scene_start_frames = []

    print("Writing frame-synced video stream...")
    for idx, sc in enumerate(SCENES_CONFIG):
        scene_start_frames.append(current_video_frame)
        frame_bgr = rendered_bgr[idx]
        hold_frames = int(round(sc["hold_sec"] * FPS))

        for f_i in range(hold_frames):
            scale = 1.0 + 0.015 * (f_i / max(1, hold_frames))
            cw = int(WIDTH / scale)
            ch = int(HEIGHT / scale)
            x0 = (WIDTH - cw) // 2
            y0 = (HEIGHT - ch) // 2
            cropped = frame_bgr[y0 : y0 + ch, x0 : x0 + cw]
            zoomed = cv2.resize(cropped, (WIDTH, HEIGHT), interpolation=cv2.INTER_LINEAR)
            writer.write(zoomed)
            current_video_frame += 1

        if idx < total_scenes - 1:
            next_bgr = rendered_bgr[idx + 1]
            for step in range(1, fade_frames + 1):
                alpha = step / (fade_frames + 1)
                blended = cv2.addWeighted(frame_bgr, 1.0 - alpha, next_bgr, alpha, 0)
                writer.write(blended)
                current_video_frame += 1

    writer.release()

    total_video_sec = current_video_frame / FPS
    total_audio_samples = int(np.ceil(total_video_sec * sr)) + sr
    voice_master = np.zeros(total_audio_samples, dtype=np.float32)

    # Place each scene's voiceover at the exact millisecond its visual scene starts!
    for idx, sc in enumerate(SCENES_CONFIG):
        start_sec = (scene_start_frames[idx] / FPS) + 0.12
        start_sample = int(start_sec * sr)
        samples = sc["samples"]
        end_sample = min(total_audio_samples, start_sample + len(samples))
        voice_master[start_sample:end_sample] = samples[: end_sample - start_sample]

    # Synthesize stereo ambient FinTech music across total_audio_samples
    t = np.arange(total_audio_samples, dtype=np.float32) / sr
    chords = [
        [146.83, 220.00, 261.63, 329.63, 440.00],  # Dm9
        [116.54, 174.61, 220.00, 293.66, 349.23],  # BbMaj7
        [98.00, 146.83, 174.61, 220.00, 293.66],   # Gm9
        [110.00, 164.81, 220.00, 293.66, 329.63],  # A7sus4
    ]
    bar_len = 4.0
    bar_samples = int(bar_len * sr)
    num_bars = int(np.ceil(total_audio_samples / bar_samples))
    music_l = np.zeros(total_audio_samples, dtype=np.float32)
    music_r = np.zeros(total_audio_samples, dtype=np.float32)

    for b in range(num_bars):
        i0 = b * bar_samples
        i1 = min(total_audio_samples, (b + 1) * bar_samples)
        seg_t = t[i0:i1] - t[i0]
        chord = chords[b % len(chords)]
        env = np.sin(np.pi * seg_t / bar_len) ** 0.35

        pad_l = np.zeros_like(seg_t)
        pad_r = np.zeros_like(seg_t)
        for c_i, freq in enumerate(chord):
            detune = 1.0015 if c_i % 2 == 0 else 0.9985
            pad_l += np.sin(2 * np.pi * freq * seg_t) * (0.20 / len(chord))
            pad_r += np.sin(2 * np.pi * (freq * detune) * seg_t) * (0.20 / len(chord))

        arp_idx = (np.floor(seg_t * 4.0).astype(int)) % len(chord)
        arp_freqs = np.array([chord[k] * 2.0 for k in arp_idx], dtype=np.float32)
        note_phase = (seg_t * 4.0) % 1.0
        arp_env = np.exp(-5.5 * note_phase)
        arp_wave = np.sin(2 * np.pi * arp_freqs * seg_t) * arp_env * 0.07

        music_l[i0:i1] = (pad_l + arp_wave) * env
        music_r[i0:i1] = (pad_r + arp_wave * 0.85) * env

    # Sidechain ducking under voice
    voice_act = np.convolve(np.abs(voice_master), np.ones(2200) / 2200, mode="same")
    duck = np.where(voice_act > 0.012, 0.36, 0.72).astype(np.float32)

    mix_l = np.clip(voice_master * 0.96 + music_l * duck, -0.98, 0.98)
    mix_r = np.clip(voice_master * 0.96 + music_r * duck, -0.98, 0.98)

    exact_samples = int(total_video_sec * sr)
    stereo = np.empty(exact_samples * 2, dtype=np.int16)
    stereo[0::2] = (mix_l[:exact_samples] * 32767).astype(np.int16)
    stereo[1::2] = (mix_r[:exact_samples] * 32767).astype(np.int16)

    with wave.open(MASTER_WAV, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())

    import imageio_ffmpeg

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i",
        TEMP_SILENT_MP4,
        "-i",
        MASTER_WAV,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "21",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-movflags",
        "+faststart",
        FINAL_MP4_AUDIO,
    ]
    subprocess.run(cmd, check=True)

    os.makedirs(PUBLIC_DIR, exist_ok=True)
    shutil.copyfile(FINAL_MP4_AUDIO, FINAL_MP4_MAIN)
    shutil.copyfile(FINAL_MP4_AUDIO, ARTIFACT_MP4_MAIN)
    shutil.copyfile(FINAL_MP4_AUDIO, ARTIFACT_MP4_AUDIO)
    shutil.copyfile(FINAL_MP4_AUDIO, PUBLIC_MP4_AUDIO)

    size_mb = os.path.getsize(FINAL_MP4_AUDIO) / (1024 * 1024)
    print(f"SUCCESS: 100% Frame-Synced Video + Voiceover + Music -> {FINAL_MP4_AUDIO} ({total_video_sec:.1f}s, {size_mb:.2f} MB)")


if __name__ == "__main__":
    synthesize_all_scene_wavs()
    imgs = capture_all_scene_images()
    build_synced_video_and_audio(imgs)
