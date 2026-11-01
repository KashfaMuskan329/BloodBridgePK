# BloodBridge PK 🩸

**Every drop matters. Every journey, too.** A patient-centered interactive geospatial map prototype for thalassaemia families and blood donation outreach planners in Pakistan. Built for **AWS Builder Center — Weekend Challenge: Map It (Oct 30–Nov 2, 2026)**.

**Status:** Working client-side implementation + curated geospatial dataset. **NOT yet deployed** from this package. You must configure your own AWS resource access, publish and verify the live link. Do **not** claim Amazon Location map/routing is operational until it has actually been tested with an authorized API key.

## What is implemented

- Premium, responsive storytelling UI and friendly CSS-drawn patient character (not depicting a real person).
- Lahore default (21 curated facilities), switch to Islamabad / Rawalpindi (10 curated facilities).
- Six fictional patient journeys (three in each metropolitan area).
- Filter by thalassaemia services, hospital blood bank or other blood-bank listing.
- Select a listed center to see its **straight-line distance** and public source link.
- When configured: **Amazon Location Service Maps v2** basemap and **Routes v2** point-to-point car route with genuine route length/travel duration returned by AWS.
- Before AWS is configured: OpenStreetMap basemap preview, dashed straight line, **no invented journey time**.
- Hypothetical donation-outreach camp simulator with mean nearest-point distances across 12 **fictional sample neighborhood locations**. There is no actual donation camp, donation inventory, patient-location data or real coverage claim.
- Medical disclaimer and source transparency on page.

## Where the real data comes from

- [Punjab Blood Transfusion Authority licensed blood bank directory](https://pbta.punjab.gov.pk/licensed_blood_banks) — contains **historical license-list entries**. The app does not attest that any listing's license remains current.
- [Sundas Foundation, Lahore](https://sundas.org/centers/lahore) and [Islamabad](https://legacy.sundas.org/Master/Islamabad) — public provider details.
- [Fatimid Foundation branches](https://fatimid.org/contact-us/).
- [Children's Hospital Lahore hematology/thalassaemia](https://chich.edu.pk/hematologyoncology).
- [PIMS Thalassaemia Center](https://www.pims.gov.pk/department-thalassemia.php).
- [Pakistan Thalassaemia Welfare Society (PATHWEL)](https://pathwel.org.pk/contact-us/).
- Other entries are public business-directory search listings with links where official sources were not located.

**Data integrity warning:** All location pin coordinates are approximate, manually selected neighborhood anchor points and are **not verified geocodes of facility entrances**. All blood-stock data is unknown, regardless of selected blood group. The dataset is **not exhaustive, not suitable for emergency guidance**, and was manually curated for a hackathon prototype. No private patient/donor information used. Check centers with official staff before travelling.

## Run locally

In the project root:

```bash
python scripts/build_dataset.py
python -m http.server 8000 --directory app
```

Open `http://localhost:8000`. With an internet connection, MapLibre GL JS loads from CDN and the OpenStreetMap preview loads tiles. Your browser needs internet access.

## Hook up Amazon Location Service **before publishing**

1. Open AWS Console -> **Amazon Location Service** -> **API keys** -> Create API key in **ap-south-1** (or change `awsRegion` in `app/config.js`).
2. Authorize the minimal required **Maps GetTile**, and if you want AWS route distance and time, **Routes CalculateRoutes**. Maps v2 style descriptor resources are requested by the MapLibre integration. In the console, check the right v2 Actions and permissions for your region/key.
3. Put the **public restricted API key** (`v1.public...`) in `app/config.js`. **NEVER paste IAM access key IDs, secret access keys, root credentials or session tokens.** Browser public keys still need strict referrer restrictions and limited actions.
4. Allow your local origin for testing (`http://localhost:8000/*`) and your exact Amplify URL (`https://main.XXXX.amplifyapp.com/*` or actual deployed domain), then remove localhost if not needed. Set key expiration and usage monitoring.
5. Reload and confirm the map's caption reads **Amazon Location Service**. Click a support point to confirm **AWS calculated route** with distance and minutes. If API denied, the UI explicitly falls back to an unverified direct line and does not make travel-time claims.
6. Consider AWS Budgets alerts, CloudWatch/usage dashboards and least privilege. Maps and routes calls **may incur charges** depending on account limits/usage.

Official AWS references:
- [Amazon Location API keys](https://docs.aws.amazon.com/location/latest/developerguide/using-apikeys.html)
- [Maps v2 + MapLibre](https://docs.aws.amazon.com/location/latest/developerguide/using-apikeys.html)
- [Routes v2](https://docs.aws.amazon.com/location/latest/developerguide/calculate-routes-origin-destination-waypoints.html)

## Use Amazon S3 in the dataset build pipeline

This is an **optional second AWS data service** in addition to Amazon Location. With AWS CLI configured (in PowerShell from the project root):

```powershell
.\scripts\publish_s3.ps1 -Bucket YOUR-GLOBALLY-UNIQUE-BUCKET -Region ap-south-1
```

This creates/uses a **private** S3 bucket, uploads `centers.geojson` with SSE-S3, downloads it to the build, and re-embeds the copy into `app/data/centers.js`. The map uses the bundled data so the S3 bucket does not need any public read permission or CORS config. Do not claim this S3 pipeline was used unless you actually run it successfully.

Alternatively manually copy the dataset with:

```bash
aws s3 cp app/data/centers.geojson s3://YOUR-BUCKET/bloodbridge/centers.geojson --sse AES256 --region ap-south-1
aws s3 cp s3://YOUR-BUCKET/bloodbridge/centers.geojson app/data/centers.geojson --region ap-south-1
python scripts/embed_dataset.py
```

## Publish the frontend to AWS Amplify

- Download/use `BloodBridgePK_Amplify_Deploy.zip` included separately. First update `app/config.js` with the authorized Amazon Location public key, then **rebuild** the frontend zip so it includes your settings; or deploy the zip for OpenStreetMap preview while setting up AWS.
- Console: **AWS Amplify -> Create new app -> Deploy without Git**. Upload a zip containing `index.html`, `style.css`, `app.js`, `config.js`, and the `data/` folder **at the ZIP root** (no extra `app/` parent folder).
- Test the URL in an incognito window, switch cities, click a location, verify the Amazon map actually loaded, test AWS route and simulation.
- The live app is only publicly reachable after *you* deploy it. This package cannot create AWS resources on your behalf without your AWS session.

## Test and verify

```bash
python -m unittest discover -s tests -v
node --check app/app.js
```

These confirm dataset integrity and JS syntax. Browser interactions have also been smoke-tested in a simulated map runtime; **real AWS calls and actual publicly hosted browser behavior remain unverified** until you deploy and test them.

## Safety / privacy

This is not an emergency hotline or clinical decision system. Do not use any figures or labels to claim live blood inventory, compatibility, blood-group matching, donor eligibility, verified center opening hours, verified current licensure, or outcomes for real people. Never enter real patient names, contact info or addresses into a public demo.

## Files

```text
app/
  index.html          main UI + story design
  style.css           design system + mobile layout
  app.js              map, patients, filters, routes and simulator
  config.js           insert public restricted Amazon Location API key here
  data/centers.geojson  public-directory location data
  data/centers.js       static browser data generated from GeoJSON
scripts/
  build_dataset.py   rebuild curated directory snapshot
  embed_dataset.py   embed S3/local GeoJSON in frontend
  publish_s3.ps1     optional private S3 dataset roundtrip
submission/
  PROJECT_WRITEUP.md  draft AWS Builder Center write-up
  DEMO_SCRIPT.md      under-3-minute storyboard
  CHECKLIST.md        last-step checklist
assets/
  architecture.svg    editable architecture diagram
tests/
  test_dataset.py    offline structure/safety tests
```

## Licensing and attribution

Code: MIT License. Facility listing sources remain the property of their respective publishers. Map tiles: OpenStreetMap contributors in preview, Amazon Location maps when configured. The map must preserve on-screen attribution. No claims of endorsement by the listed centers or AWS.
