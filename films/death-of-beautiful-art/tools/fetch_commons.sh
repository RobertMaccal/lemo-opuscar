#!/bin/sh
# Patient Wikimedia fetcher: one request at a time, long backoff on 429. Usage: sh tools/fetch_commons.sh
UA="lemo-film/1.0 (https://github.com/RobertMaccal/lemo-opuscar) curl/8"
cd "$(dirname "$0")/../assets/raw"
want(){ # out url
  [ -s "$1" ] && file -b "$1" | grep -q JPEG && return 0
  for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    code=$(curl -s --max-time 300 -A "$UA" -o "$1.part" -w "%{http_code}" "$2")
    if [ "$code" = 200 ] && file -b "$1.part" | grep -qE 'JPEG|PNG'; then mv "$1.part" "$1"; echo "ok $1"; sleep 20; return 0; fi
    echo "retry $1 ($code)"; rm -f "$1.part"; sleep $((60 + i * 30))
  done; echo "FAILED $1"
}
api(){ # out query-string
  [ -s "$1" ] && return 0
  for i in 1 2 3 4 5 6 7 8; do
    curl -s --max-time 60 -A "$UA" -o "$1.part" "https://commons.wikimedia.org/w/api.php?$2"
    if python3 -c "import json,sys;json.load(open(sys.argv[1]))" "$1.part" 2>/dev/null; then mv "$1.part" "$1"; echo "ok $1"; sleep 20; return 0; fi
    echo "retry $1"; rm -f "$1.part"; sleep $((60 + i * 30))
  done; echo "FAILED $1"
}
F="Marcel_Duchamp%2C_1917%2C_Fountain%2C_photograph_by_Alfred_Stieglitz.jpg"
want fountain_stieglitz.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/$F/1280px-$F"
B="The_Richard_Mutt_Case%2C_The_Blind_Man%2C_No._2%2C_New_York%2C_1917.jpg"
want blindman_mutt.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/$B/960px-$B"
api met_search.json "action=query&format=json&list=search&srnamespace=6&srlimit=20&srsearch=blind%20man%20MET%20b1120124"
api banana_info.json "action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&titles=File:Banana-Single.jpg|File:Bananas%20white%20background%20DS.jpg"

# the grocery banana: only if its licence is public domain / CC0 (checked in banana_info.json first)
if python3 -c "import json,sys;d=json.load(open('banana_info.json'));p=[v for v in d['query']['pages'].values() if v['title']=='File:Banana-Single.jpg'][0];l=p['imageinfo'][0]['extmetadata']['LicenseShortName']['value'];print(l);sys.exit(0 if ('Public domain' in l or 'CC0' in l) else 1)"; then
  want banana_single.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/960px-Banana-Single.jpg"
fi
echo ALLDONE
