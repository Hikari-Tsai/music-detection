"""Compatibility entry point for JSON-to-MIDI conversion."""
from backend.tempo import constant_tempo, estimate_tempo, tempo_midi_bytes, main

if __name__ == "__main__":
    main()
