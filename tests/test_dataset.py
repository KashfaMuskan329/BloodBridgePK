import json, unittest
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'app/data/centers.geojson').read_text(encoding='utf-8'))
class TestDataset(unittest.TestCase):
    def test_geojson_shape(self):
        self.assertEqual(data['type'],'FeatureCollection')
        self.assertGreaterEqual(len(data['features']),20)
    def test_data_integrity(self):
        seen=set()
        for feature in data['features']:
            p=feature['properties'];v=feature['geometry']['coordinates']
            self.assertNotIn(p['id'],seen);seen.add(p['id'])
            self.assertIn(p['category'],('thalassemia','hospital','bloodbank'))
            self.assertIn(p['city'],('lahore','islamabad'))
            self.assertTrue(24 < v[1] < 38 and 60 < v[0] < 79)
            self.assertTrue(p['sourceUrl'].startswith('https://'))
            self.assertEqual(p['stockStatus'],'not available')
            self.assertIn('approximate',p['coordinateAccuracy'])
    def test_city_breakdown(self):
        self.assertEqual(sum(f['properties']['city']=='lahore' for f in data['features']),21)
        self.assertEqual(sum(f['properties']['city']=='islamabad' for f in data['features']),10)
if __name__ == '__main__':unittest.main()
