import sys,json
from faster_whisper import WhisperModel
m=WhisperModel("small.en",device="cpu",compute_type="int8")
for f in sys.argv[1:]:
    segs,_=m.transcribe(f,word_timestamps=True,language="en",beam_size=5)
    words=[]
    for s in segs:
        for w in s.words: words.append({"w":w.word.strip(),"t0":round(w.start,3),"t1":round(w.end,3),"p":round(w.probability,3)})
    json.dump(words,open(f.rsplit('.',1)[0]+'.words.json','w'),indent=0)
    print(f, len(words), ' '.join(x['w'] for x in words))
    print('lowprob:',[ (x['w'],x['t0']) for x in words if x['p']<0.5])
