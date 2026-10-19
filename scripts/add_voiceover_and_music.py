"""
Generates a professional Spoken Voiceover Commentary (via Windows SpeechSynthesizer)
+ Synthesized Stereo Ambient FinTech Background Music Track (via NumPy), mixes them,
and muxes the master audio into the Full HD ReconX-AI Showcase MP4 & WebM videos.
"""
import os
import shutil
import subprocess
import wave
import numpy as np
import cv2

PROJECT_DIR = r"C:\Users\DELL\.gemini\antigravity\scratch\ReconX-AI-repo"
ARTIFACT_DIR = r"C:\Users\DELL\.gemini\antigravity\brain\8d3e6822-53ec-48a9-9476-54fbcbf7fce9"
PUBLIC_DIR = os.path.join(PROJECT_DIR, "frontend", "public")

RAW_MP4 = os.path.join(PROJECT_DIR, "ReconX_AI_Complete_Feature_Showcase.mp4")
VOICE_WAV = os.path.join(PROJECT_DIR, "voiceover_track.wav")
MIXED_WAV = os.path.join(PROJECT_DIR, "master_soundtrack.wav")
FINAL_MP4 = os.path.join(PROJECT_DIR, "ReconX_AI_Showcase_With_Commentary_And_Music.mp4")
ARTIFACT_MP4 = os.path.join(ARTIFACT_DIR, "ReconX_AI_Showcase_With_Commentary_And_Music.mp4")
PUBLIC_MP4 = os.path.join(PUBLIC_DIR, "ReconX_AI_Showcase_With_Commentary_And_Music.mp4")

VOICEOVER_SCRIPT = (
    "Welcome to ReconX A I, HyperBloom Edition. "
    "Enterprise finance teams spend fourteen days every month manually matching bank statements to vendor invoices in spreadsheets. "
    "ReconX A I transforms this into a thirty-second, tactile, multi-agent financial terminal. "
    "First, our interactive five-factor Vector Constellation evaluates Vendor Similarity, Exact Amount, Reference I D, Date Decay, and Narration context in real time. "
    "Second, our X-Ray Laser Diff Workbench visually connects Source Invoice fields directly to Counterparty Bank U T R narrations. "
    "Third, our Inclusive Accessibility Engine provides one-click Colorblind-Safe Cyan mode, Swiss Daylight Paper mode, Dyslexia-friendly typography, and tactile audio feedback. "
    "Inside the F 1 Command Center, operators monitor live streaming transactions, inspect the six-agent reasoning graph in A I Trace, "
    "and generate printable S H A 256 cryptographic SOX 404 compliance certificates. "
    "In the F 2 Document Vault, one-click inbuilt datasets trigger three-stage O C R extraction and mathematical tax sanity checks. "
    "In F 4 Smart Matcher and F 5 Anomaly Guard, the system automatically flags Section 194 Q T D S tax variances and blocks duplicate payments. "
    "Finally, F 6 Investigations, F 7 Human Approvals, F 8 General Ledger Mapping, F 9 Analytics, and F 10 Audit Trail complete the autonomous financial close. "
    "ReconX A I: Precision, transparency, and inclusive financial design."
)


def get_video_duration(mp4_path: str) -> float:
    cap = cv2.VideoCapture(mp4_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 900
    cap.release()
    return float(frames / fps)


def generate_voiceover_wav(wav_path: str):
    print("Synthesizing spoken voiceover commentary via Windows SAPI5...")
    ps_script = f"""
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.Rate = 1
    $synth.Volume = 100
    $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(44100, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $synth.SetOutputToWaveFile('{wav_path}', $format)
    $synth.Speak('{VOICEOVER_SCRIPT}')
    $synth.Dispose()
    """
    subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], check=True)


def synthesize_ambient_music_and_mix(voice_wav_path: str, out_wav_path: str, target_duration: float):
    print(f"Synthesizing ambient FinTech background music & mixing ({target_duration:.1f}s)...")
    sr = 44100

    with wave.open(voice_wav_path, "rb") as wf:
        n_frames = wf.getnframes()
        raw_bytes = wf.readframes(n_frames)
        voice_samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    total_samples = int(max(target_duration * sr, len(voice_samples) + sr))
    t = np.arange(total_samples, dtype=np.float32) / sr

    # Pad voice track with a 0.8s intro offset
    voice_padded = np.zeros(total_samples, dtype=np.float32)
    start_offset = int(0.8 * sr)
    end_offset = min(total_samples, start_offset + len(voice_samples))
    voice_padded[start_offset:end_offset] = voice_samples[: end_offset - start_offset]

    # Ambient FinTech Synth Pad Chord Progression (Dm9 -> BbMaj7 -> Gm9 -> Asus4)
    # 4-second bars
    chords = [
        [146.83, 220.00, 261.63, 329.63, 440.00],  # Dm9
        [116.54, 174.61, 220.00, 293.66, 349.23],  # BbMaj7
        [98.00, 146.83, 174.61, 220.00, 293.66],   # Gm9
        [110.00, 164.81, 220.00, 293.66, 329.63],  # A7sus4
    ]

    bar_len = 4.0
    music_left = np.zeros(total_samples, dtype=np.float32)
    music_right = np.zeros(total_samples, dtype=np.float32)

    bar_samples = int(bar_len * sr)
    num_bars = int(np.ceil(total_samples / bar_samples))

    for b in range(num_bars):
        i0 = b * bar_samples
        i1 = min(total_samples, (b + 1) * bar_samples)
        seg_t = t[i0:i1] - t[i0]
        chord = chords[b % len(chords)]

        # Smooth envelope per bar
        env = np.sin(np.pi * seg_t / bar_len) ** 0.35

        pad_l = np.zeros_like(seg_t)
        pad_r = np.zeros_like(seg_t)
        for idx, freq in enumerate(chord):
            detune = 1.0015 if idx % 2 == 0 else 0.9985
            pad_l += np.sin(2 * np.pi * freq * seg_t) * (0.22 / len(chord))
            pad_r += np.sin(2 * np.pi * (freq * detune) * seg_t) * (0.22 / len(chord))

        # Subtle futuristic pulse arpeggio (8th notes at 120 BPM = 4 notes/sec)
        arp_idx = (np.floor(seg_t * 4.0).astype(int)) % len(chord)
        arp_freqs = np.array([chord[k] * 2.0 for k in arp_idx], dtype=np.float32)
        note_phase = (seg_t * 4.0) % 1.0
        arp_env = np.exp(-5.5 * note_phase)
        arp_wave = np.sin(2 * np.pi * arp_freqs * seg_t) * arp_env * 0.08

        music_left[i0:i1] = (pad_l + arp_wave) * env
        music_right[i0:i1] = (pad_r + arp_wave * 0.85) * env

    # Fade out last 2 seconds
    fade_samples = min(int(2.0 * sr), total_samples // 4)
    fade_curve = np.linspace(1.0, 0.0, fade_samples, dtype=np.float32)
    music_left[-fade_samples:] *= fade_curve
    music_right[-fade_samples:] *= fade_curve

    # Sidechain ducking: lower background music slightly when voice is speaking
    voice_activity = np.convolve(np.abs(voice_padded), np.ones(2200) / 2200, mode="same")
    duck_gain = np.where(voice_activity > 0.015, 0.42, 0.78).astype(np.float32)

    mix_l = np.clip(voice_padded * 0.95 + music_left * duck_gain, -0.98, 0.98)
    mix_r = np.clip(voice_padded * 0.95 + music_right * duck_gain, -0.98, 0.98)

    stereo_interleaved = np.empty(total_samples * 2, dtype=np.int16)
    stereo_interleaved[0::2] = (mix_l * 32767).astype(np.int16)
    stereo_interleaved[1::2] = (mix_r * 32767).astype(np.int16)

    with wave.open(out_wav_path, "wb") as out_wf:
        out_wf.setnchannels(2)
        out_wf.setsampwidth(2)
        out_wf.setframerate(sr)
        out_wf.writeframes(stereo_interleaved.tobytes())


def mux_video_and_audio():
    import imageio_ffmpeg

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print("Using full ffmpeg binary:", ffmpeg_exe)

    duration = get_video_duration(RAW_MP4)
    generate_voiceover_wav(VOICE_WAV)
    synthesize_ambient_music_and_mix(VOICE_WAV, MIXED_WAV, duration)

    os.makedirs(PUBLIC_DIR, exist_ok=True)

    # Encode universal H.264 + AAC MP4 with faststart for instant web & player playback
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i",
        RAW_MP4,
        "-i",
        MIXED_WAV,
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
        FINAL_MP4,
    ]
    subprocess.run(cmd, check=True)

    # Replace project/artifact/public MP4s with the H.264+Audio version!
    shutil.copyfile(FINAL_MP4, RAW_MP4)
    shutil.copyfile(FINAL_MP4, ARTIFACT_MP4)
    shutil.copyfile(FINAL_MP4, os.path.join(ARTIFACT_DIR, "ReconX_AI_Complete_Feature_Showcase.mp4"))
    shutil.copyfile(FINAL_MP4, PUBLIC_MP4)

    size_mb = os.path.getsize(FINAL_MP4) / (1024 * 1024)
    print(f"SUCCESS: Generated H.264 + Voiceover + Ambient Music MP4 -> {FINAL_MP4} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    mux_video_and_audio()
