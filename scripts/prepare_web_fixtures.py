"""Generate reproducible PCM, spectrogram, logits and MIDI fixtures from Python."""
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
import soundfile as sf
import torch
from beat_this.inference import Audio2Beats
from backend.tempo import estimate_tempo, tempo_midi_bytes
root=Path(__file__).resolve().parents[1]
out=root/'.cache'/'web-fixtures'
out.mkdir(parents=True,exist_ok=True)
torch.hub.set_dir(str(root/'.cache'/'torch'))
torch.set_num_threads(4)
model=Audio2Beats('final0',device='cpu',dbn=False)
audio,sr=sf.read(root/'samples'/'choice.ogg',dtype='float32')
for name,pcm in [('choice',audio),('long',np.tile(audio,3))]:
    spec=model.signal2spect(pcm,sr)
    beat,downbeat=model.spect2frames(spec)
    beats,downbeats=model.frames2beats(beat,downbeat)
    pcm.tofile(out/f'{name}.f32')
    sf.write(out/f'{name}.wav',pcm,sr,subtype='FLOAT')
    spec.numpy().tofile(out/f'{name}.spect.f32')
    (out/f'{name}.json').write_text(json.dumps({'frames':len(spec),'beats':beats.tolist(),'downbeats':downbeats.tolist(),
        'beat_logits':beat.tolist(),'downbeat_logits':downbeat.tolist(),'tempo':estimate_tempo(beats,downbeats)}))
# Known accelerating track with a leading offset tests MIDI timing independently of inference.
beats=1.237+np.r_[0,np.cumsum(np.linspace(.63,.35,48))]
tempo=estimate_tempo(beats,[])
(out/'tempo.json').write_text(json.dumps({'beats':beats.tolist(),'duration':30,'result':tempo}))
(out/'tempo.mid').write_bytes(tempo_midi_bytes(tempo,30))
sf.write(out/'silence.wav',np.zeros(22050*2),22050)
print(out)
