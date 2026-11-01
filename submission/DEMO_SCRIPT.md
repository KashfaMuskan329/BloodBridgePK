# BloodBridge PK — ~2m35s Demo Script + Screen Actions

**Deliver this as a screen recording from the actual live AWS Amplify URL after configuring Amazon Location and confirming it really works.** Below is a sample voiceover for ElevenLabs or your own voice. Aim for ~145–160 words/min. If AWS route fails, omit the AWS-route success line and describe the labelled straight-line preview instead.

**00:00–00:18 | Screen: Hero and fictional child character**

> “In Pakistan, thalassaemia is more than a diagnosis. For families who need repeated transfusions, every visit comes with a question: where can we find the right place to ask for help? I built BloodBridge PK to make the geography of that journey visible.”

**00:18–00:45 | Screen: Lahore city map and public markers**

> “Here is Lahore. These pins represent public-listed thalassaemia support centers, blood banks and hospital blood services. Each one comes from a linked public source. The map is built from a small, manually curated GeoJSON dataset. Coordinates are approximate, and blood availability is never assumed.”

**00:45–01:20 | Screen: Choose Areeba, change patient, select a center and route**

> “Meet Areeba, a fictional eight-year-old. Her family begins from this illustrative neighborhood. Choose a support category and click a center. BloodBridge shows contact information and distance. When Amazon Location routing is enabled, it calculates the real road route between the map coordinates — helping the family understand which services to call before setting out.”

**01:20–01:40 | Screen: Switch Islamabad / Rawalpindi, choose different patient**

> “The experience also covers Islamabad and Rawalpindi, with different patient journeys. Instead of placing private patients on a public map, every story uses fictional people and fictional starting points.”

**01:40–02:15 | Screen: Donation camp simulator, choose G-11 or Lahore Shahdara**

> “Now the interesting question: what if we created one more donation outreach point? Pick a hypothetical camp location. The app recomputes the average straight-line distance to a mapped contact point across sample neighborhoods. It's a transparent scenario, not a prediction of actual blood supply — but it helps us ask better geographic planning questions.”

**02:15–02:35 | Screen: Architecture / sources / ending**

> “BloodBridge PK combines public geographic data with AWS-powered mapping and hosting. The next step would be to work directly with verified providers. Because behind every pin, there is a person — and every journey matters.”

## Shooting notes

- Record **the real working map**, not a screenshot of a mock; keep text legible and cursor movements slow.
- Best flow: choose Areeba → nearest support → AWS route (if working) → switch Islamabad → G-11 camp simulation → show data source links.
- Do not expose API keys in the screen recording or AWS console.
- Render 1080p, horizontal 16:9, less than 3 minutes; upload as **public or unlisted if accepted publicly accessible** (verify direct unauthenticated access; public is safest).
- Challenge requires a **publicly viewable** video on the supported video hosting platform.
