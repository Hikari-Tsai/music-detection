import base64
import io
import json
import subprocess
import unittest
from pathlib import Path

import mido
from backend.tempo import tempo_midi_bytes, estimate_tempo

ROOT = Path(__file__).resolve().parents[2]


class VocalMidiTests(unittest.TestCase):
    def exports(self, tempo, duration, notes):
        native = tempo_midi_bytes(tempo, duration, notes)
        script = """import {tempoMidi} from './frontend/inference/tempo.js';
        let input=''; for await(const c of process.stdin) input+=c;
        const {tempo,duration,notes}=JSON.parse(input);
        console.log(Buffer.from(tempoMidi(tempo,duration,notes)).toString('base64'));"""
        browser = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT,
                                 input=json.dumps(dict(tempo=tempo, duration=duration, notes=notes)),
                                 text=True, capture_output=True, check=True)
        outputs = [mido.MidiFile(file=io.BytesIO(b)) for b in (native, base64.b64decode(browser.stdout))]
        # Compare parsed events, not serializer-specific running-status encoding.
        self.assertEqual([[m.dict() for m in t] for t in outputs[0].tracks],
                         [[m.dict() for m in t] for t in outputs[1].tracks])
        return outputs

    def assert_notes(self, midi, expected):
        self.assertEqual(midi.type, 1)
        self.assertEqual(len(midi.tracks), 2)
        self.assertEqual(midi.tracks[0].name, 'Tempo')
        self.assertEqual(midi.tracks[1].name, 'Lead Vocal')
        now, events = 0, []
        for msg in midi:
            now += msg.time
            if msg.type in ('note_on', 'note_off'):
                events.append((now, msg.note, msg.type))
        expected = sorted(expected, key=lambda x: (x[0], x[2] == 'note_on', x[1]))
        self.assertEqual(len(events), len(expected))
        for got, want in zip(events, expected):
            self.assertAlmostEqual(got[0], want[0], delta=.002)
            self.assertEqual(got[1:], want[1:])

    def test_constant_and_average_preserve_note_timing_and_round_pitch(self):
        notes = [dict(start_seconds=.1, end_seconds=.8, midi=60.5),
                 dict(start_seconds=.8, end_seconds=1.2, midi=61)]
        beats = [i*.5 for i in range(17)]
        for downs in [[], beats[::4]]:
            tempo = estimate_tempo(beats, downs)
            for midi in self.exports(tempo, 8, notes):
                self.assert_notes(midi, [(.1,61,'note_on'),(.8,61,'note_off'),(.8,61,'note_on'),(1.2,61,'note_off')])
                self.assertAlmostEqual(midi.length, 8, delta=.001)

    def test_variable_tempo_notes_cross_changes_and_preserve_intro_tail(self):
        tempo = estimate_tempo([.23,.73,1.23,1.88,2.63,3.23], [])
        self.assertEqual(tempo['tempo_mode'], 'variable')
        notes = [dict(start_seconds=a, end_seconds=b, midi=p) for a,b,p in [(.1,.95,60),(.9,1.95,65.2),(3.4,4,69)]]
        for midi in self.exports(tempo, 4.2, notes):
            self.assert_notes(midi, [(.1,60,'note_on'),(.95,60,'note_off'),(.9,65,'note_on'),(1.95,65,'note_off'),(3.4,69,'note_on'),(4,69,'note_off')])
            self.assertGreater(sum(m.type=='set_tempo' for m in midi.tracks[0]),1)
            self.assertAlmostEqual(midi.length,4.2,delta=.002)

    def test_empty_pitch_preserves_tempo_only_fallback(self):
        tempo=estimate_tempo([0,.5,1], [])
        for notes in [[], [dict(start_seconds=3,end_seconds=4,midi=60)], [dict(start_seconds=.1,end_seconds=.2,midi=128)]]:
            for midi in self.exports(tempo,2,notes):
                self.assertEqual(midi.type,0)
                self.assertEqual(len(midi.tracks),1)
                self.assertFalse(any(m.type=='note_on' for m in midi.tracks[0]))

    def test_notes_end_at_selection_boundary(self):
        tempo=estimate_tempo([0,.5,1], [])
        notes=[dict(start_seconds=.25,end_seconds=3,midi=0)]
        for midi in self.exports(tempo,2,notes):
            self.assert_notes(midi,[(.25,0,'note_on'),(2,0,'note_off')])
            self.assertAlmostEqual(midi.length,2,delta=.001)
