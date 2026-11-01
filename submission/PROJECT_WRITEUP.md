# BloodBridge PK — The distance between a family and blood support

**Category:** AWS Builder Center, Weekend Challenge: Map It

> “Every drop matters. Every journey, too.”

### The human problem

In Pakistan, many children and families affected by thalassaemia rely on recurring transfusion services. Access isn't just about how many blood banks appear on a map: families may need to understand where trusted treatment services are located, compare journeys, and contact an appropriate facility before travelling. This project explores *access to information and location*, not blood inventory or medical eligibility.

### The idea

BloodBridge PK turns a static facility directory into an explorable, human-centered experience. Select a fictional patient (with a friendly illustrated character), explore the real public-listed network in **Lahore** or **Islamabad/Rawalpindi**, filter types of support, and view distance and route information where authorized Amazon Location routing is available. Then try an interactive **“What if we place a donation-outreach camp here?”** mode to reveal how access-to-contact-point distances might change in a small, explicitly hypothetical model.

### Dataset and methodology

- **31 manually curated, public-listed facilities**: 21 in Lahore and 10 in Islamabad/Rawalpindi, categorized as thalassaemia support, blood banks or hospital-linked blood services. This is a selection, not a total count of centers in either metropolitan area.
- Sources include the Punjab Blood Transfusion Authority (historical license directory), Sundas Foundation, Fatimid Foundation, Children's Hospital Lahore, PIMS, PATHWEL and linked public listings. Each pin links to its source.
- Data model: GeoJSON FeatureCollection with coordinates, category, city, public contact/address where available, and source URL.
- **Important:** Facility positions are manually approximated neighborhood anchors, not verified entrance coordinates. Operating status, current licenses and all blood supplies are unverified. All patient stories and planned camps are fictional; **no private patient data**.

### How AWS helps

1. **Amazon Location Service Maps v2** is intended to render the interactive base map via a restricted public API key and MapLibre GL JS. [Only claim this after testing your AWS key and published live URL.]
2. **Amazon Location Service Routes v2** optionally calculates actual road distance, route shape and travel duration for a fictional patient origin and selected listed center. When unavailable, a dashed straight-line preview is labelled clearly; no road-time claim is made. [Only claim working routing when tested.]
3. **Amazon S3** can hold the private geospatial GeoJSON snapshot as a source of truth. A documented PowerShell AWS CLI pipeline downloads the dataset into the static website build. [Only claim S3 as used if the script was actually run.]
4. **AWS Amplify Hosting** deploys the public static app for judging. [Paste real live URL after deployment.]

### What the map reveals

Rather than treating healthcare access as a list of pins, the app asks: **Where does a family start, what service options can it find, and how might outreach location choices affect geographic access?** Each scenario is visual, interactive and re-runnable. The outreach model is a teaching tool, not a claim that a temporary camp provides transfusions or stocked blood.

### What I would improve next

Partner with local blood banks and thalassaemia organisations to verify exact entrance coordinates, current services, contact hours, and lawful data-sharing; connect verified event schedules; replace the hypothetical sample origins with privacy-preserving, aggregated accessibility metrics; support Urdu/English. No blood availability claims without signed, current provider integrations.

### Project links

- **Live map:** [ADD YOUR ACTUAL AMPLIFY URL]
- **Demo video under 3 minutes:** [ADD PUBLIC YOUTUBE/VIMEO/FACEBOOK URL]
- **Repository (optional):** [ADD YOUR GITHUB URL, MIT LICENCE]

### What to test before publishing

- Replace conditional AWS wording above once AWS key/route/S3 steps are actually verified.
- Confirm pins are based on documented public addresses; explain approximate positions.
- Be transparent about the historical 2018 directory and the need for real-time verification.
- Do not claim patient lives saved, clinical compatibility, live blood, donation camp activity or genuine patient locations.
