# Final checklist — AWS Weekend Map It

- [ ] Run `python -m unittest discover -s tests -v` and `node --check app/app.js`.
- [ ] Create/restrict Amazon Location public API key in `ap-south-1`, allowing map tiles and route calculations as required; keep IAM keys secret.
- [ ] Put the restricted `v1.public` key in `app/config.js`. Test the actual AWS map and route distance. No 401/403 errors.
- [ ] Optional: run `scripts/publish_s3.ps1` to use private AWS S3 as a real dataset build pipeline. Do not claim it happened if not executed.
- [ ] Create a fresh frontend ZIP **from inside the `app` folder** after updating config (files at archive root).
- [ ] Deploy to **AWS Amplify**, verify all interactive features in a private browser window.
- [ ] Double-check public facility links and mark any unverifiable location clearly as illustrative. No false live stock.
- [ ] Create and upload a public 16:9 demo under **three minutes**.
- [ ] Include real dataset origin, transformation method, AWS services used, live link and demo video in Builder Center write-up.
- [ ] Repository is optional. If shared, include MIT or another OSI-approved licence.
- [ ] Keep all patient examples fictional, avoid personal/sensitive data.
- [ ] Submit **before Monday 2 Nov, 1 PM Pacific standard time = Tuesday 3 Nov, 2 AM Pakistan Standard Time**. Aim well before deadline to allow retries. Note DST: Nov 2 Pacific is PST.
- [ ] Preserve Git history and working screenshots; do not claim other independent projects are copies without evidence.
- [ ] Once the challenge is done, set/verify API-key expiration and delete unused AWS resources to avoid charges.
