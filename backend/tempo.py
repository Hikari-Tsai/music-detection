"""Convert Beat This! output to fixed, variable or estimated MIDI tempo.

Detected beats are interpreted as quarter notes. This does not resolve
half/double-time ambiguity or infer the notated denominator.
"""

import argparse
import io
import json
import math
from bisect import bisect_right
from pathlib import Path

import mido
import numpy as np


def constant_tempo(beats, downbeats, tolerance_seconds=0.03):
    """Require one uniform grid (within tolerance) and >=2 identical full bars."""
    beats = np.asarray(beats, dtype=float)
    downbeats = np.asarray(downbeats, dtype=float)
    if beats.ndim != 1 or downbeats.ndim != 1:
        return -1
    if len(beats) < 5 or len(downbeats) < 3:
        return -1
    if not np.isfinite(beats).all() or not np.isfinite(downbeats).all():
        return -1
    if beats[0] < 0 or not (np.diff(beats) > 0).all() or not (np.diff(downbeats) > 0).all():
        return -1
    indices = np.searchsorted(beats, downbeats)
    if (indices >= len(beats)).any() or not np.allclose(beats[indices], downbeats, atol=1e-6, rtol=0):
        return -1
    bar_lengths = np.diff(indices)
    numerator = int(bar_lengths[0])
    if not 1 <= numerator <= 255 or not (bar_lengths == numerator).all():
        return -1

    # Fit all beats to a single tempo instead of confusing 20 ms quantization
    # with real tempo changes. A local tempo change also creates global drift.
    beat_numbers = np.arange(len(beats))
    period, offset = np.polyfit(beat_numbers, beats, 1)
    if np.max(np.abs(beats - (offset + period * beat_numbers))) > tolerance_seconds:
        return -1
    tempo_us = round(float(period) * 1_000_000)
    if not 1 <= tempo_us <= 0xFFFFFF:
        return -1
    return {"bpm": round(60_000_000 / tempo_us, 3), "signature_beats": numerator,
            "tempo_us": tempo_us}


def estimate_tempo(beats, downbeats, tolerance_seconds=0.03):
    """Display average BPM for variable timing, retaining beats for MIDI export."""
    fixed = constant_tempo(beats, downbeats, tolerance_seconds)
    if fixed != -1:
        return {**fixed, "tempo_mode": "constant"}
    beats = np.asarray(beats, dtype=float)
    if (beats.ndim != 1 or len(beats) < 2 or not np.isfinite(beats).all()
            or beats[0] < 0 or not (np.diff(beats) > 0).all()):
        return -1
    # Equal beat-count weighting: total elapsed time / number of beat gaps.
    # Averaging instantaneous BPM would over-weight the faster passages.
    period = float((beats[-1] - beats[0]) / (len(beats) - 1))
    tempo_us = round(period * 1_000_000)
    if not 1 <= tempo_us <= 0xFFFFFF:
        return -1
    numerator = None
    downbeats = np.asarray(downbeats, dtype=float)
    if downbeats.ndim == 1 and len(downbeats) >= 3 and np.isfinite(downbeats).all() and (np.diff(downbeats) > 0).all():
        indices = np.searchsorted(beats, downbeats)
        if (indices < len(beats)).all() and np.allclose(beats[indices], downbeats, atol=1e-6, rtol=0):
            bar_lengths = np.diff(indices)
            if (bar_lengths == bar_lengths[0]).all() and 1 <= bar_lengths[0] <= 255:
                numerator = int(bar_lengths[0])
    result = {"bpm": round(60_000_000 / tempo_us, 3), "signature_beats": numerator,
              "tempo_us": tempo_us, "tempo_mode": "average"}
    # Missing/ambiguous meter alone is not evidence of a tempo change.
    if len(beats) >= 5:
        numbers = np.arange(len(beats))
        slope, offset = np.polyfit(numbers, beats, 1)
        if np.max(np.abs(beats - (offset + slope * numbers))) > tolerance_seconds:
            intervals_us = np.rint(np.diff(beats) * 1_000_000)
            if ((intervals_us < 1) | (intervals_us > 0xFFFFFF)).any():
                return -1
            result.update(tempo_mode="variable", beat_times=beats.tolist())
    return result


def _vocal_track(notes, duration, events):
    seconds, starts, segments = 0., [], []
    for i, (tick, tempo) in enumerate(events):
        if i:
            seconds += mido.tick2second(tick - events[i-1][0], 480, events[i-1][1])
        starts.append(seconds)
        segments.append((tick, tempo))

    def to_tick(time):
        index = max(0, bisect_right(starts, time) - 1)
        tick, tempo = segments[index]
        return round(tick + mido.second2tick(time - starts[index], 480, tempo))

    messages = []
    for note in notes:
        start, end, pitch = (note[k] for k in ('start_seconds', 'end_seconds', 'midi'))
        if not all(math.isfinite(v) for v in (start, end, pitch)) or not 0 <= pitch <= 127:
            continue
        start, end = max(0, start), min(duration, end)
        if end <= start:
            continue
        on = to_tick(start)
        off = max(on + 1, to_tick(end))
        pitch = math.floor(pitch + .5)
        messages.extend([(on, 1, pitch), (off, 0, pitch)])
    if not messages:
        return None
    track = mido.MidiTrack([mido.MetaMessage('track_name', name='Lead Vocal'),
                            mido.Message('program_change', channel=0, program=0)])
    previous = 0
    for tick, on, pitch in sorted(messages):
        track.append(mido.Message('note_on' if on else 'note_off', channel=0,
                                  note=pitch, velocity=90 if on else 0, time=tick-previous))
        previous = tick
    track.append(mido.MetaMessage('end_of_track', time=max(0,to_tick(duration)-previous)))
    return track


def tempo_midi_bytes(result, duration, notes=None):
    """Build tempo plus optional Lead Vocal, preserving time relative to audio 0."""
    midi = mido.MidiFile(type=0, ticks_per_beat=480)
    track = mido.MidiTrack()
    midi.tracks.append(track)
    events = [(0, result["tempo_us"])]
    if result["tempo_mode"] == "variable":
        beats = result["beat_times"]
        tempos = [round(gap * 1_000_000) for gap in np.diff(beats)]
        # Keep the first detected beat's audio offset. Subsequent beats are
        # exactly one quarter note apart, with each gap supplying its tempo.
        first_tick = round(mido.second2tick(beats[0], 480, tempos[0]))
        events = [(0, tempos[0])]
        for i, tempo in enumerate(tempos[1:], start=1):
            if tempo != events[-1][1]:
                events.append((first_tick + i * 480, tempo))
    vocal = _vocal_track(notes or [], duration, events)
    if vocal is not None:
        midi.type = 1
        midi.tracks.append(vocal)
    track.append(mido.MetaMessage("set_tempo", tempo=events[0][1], time=0))
    if result["signature_beats"] is not None:
        track.append(mido.MetaMessage("time_signature", numerator=result["signature_beats"],
                                      denominator=4, time=0))
    if vocal is not None:
        track.append(mido.MetaMessage('track_name', name='Tempo', time=0))
    previous_tick, elapsed, current_tempo = 0, 0., events[0][1]
    for tick, tempo in events[1:]:
        delta = tick - previous_tick
        elapsed += mido.tick2second(delta, 480, current_tempo)
        track.append(mido.MetaMessage("set_tempo", tempo=tempo, time=delta))
        previous_tick, current_tempo = tick, tempo
    # The last observed interval's tempo continues through the audio tail.
    ticks = max(0, round(mido.second2tick(duration - elapsed, 480, current_tempo)))
    track.append(mido.MetaMessage("end_of_track", time=ticks))
    buffer = io.BytesIO()
    midi.save(file=buffer)
    return buffer.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSON saved by run_beat_this.py")
    parser.add_argument("--output", type=Path, help="MIDI output path")
    args = parser.parse_args()
    output = args.output or args.input.with_name(args.input.stem + "_tempo.mid")
    if output.suffix.lower() != ".mid":
        parser.error("--output must end in .mid")
    if output.with_suffix(".json").resolve() == args.input.resolve():
        parser.error("output JSON would overwrite input; choose another output name")
    data = json.loads(args.input.read_text())
    raw = data["raw_api_output"]
    result = estimate_tempo(raw["beats_seconds"], raw["downbeats_seconds"])
    output.parent.mkdir(parents=True, exist_ok=True)
    if result == -1:
        # A previous successful conversion must not survive a rejected rerun.
        output.unlink(missing_ok=True)
        summary = -1
    else:
        duration = float(data.get("duration_seconds", raw["beats_seconds"][-1]))
        output.write_bytes(tempo_midi_bytes(result, duration))
        summary = {"bpm": result["bpm"], "signature_beats": result["signature_beats"],
                   "tempo_mode": result["tempo_mode"]}
    encoded = json.dumps(summary, ensure_ascii=False)
    output.with_suffix(".json").write_text(encoded + "\n")
    print(encoded)


if __name__ == "__main__":
    main()
