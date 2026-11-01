#!/usr/bin/env python3
"""Rebuild the frontend's embedded, offline-friendly data from a GeoJSON file.
Recommended: download your private S3 source snapshot to app/data/centers.geojson first.
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
source=root/'app/data/centers.geojson'
raw=json.loads(source.read_text(encoding='utf-8'))
assert raw['type']=='FeatureCollection' and raw['features']
output=root/'app/data/centers.js'
output.write_text('window.BLOODBRIDGE_GEOJSON = '+json.dumps(raw,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Embedded {len(raw["features"])} features in {output}')
