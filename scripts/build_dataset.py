#!/usr/bin/env python3
"""Build a two-city transparent directory snapshot (for hackathon demo, not medical use).
Coordinates manually selected approximate neighborhood anchors, NOT geocoded doors.
PBTA directory is a historical list; current licence/operations never assumed.
No patient records, blood stock, blood-group inventory or actual camp information.
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PBTA='https://pbta.punjab.gov.pk/licensed_blood_banks'
CHILD='https://chich.edu.pk/hematologyoncology'
FATIMID='https://fatimid.org/contact-us/'
SUNDAS='https://sundas.org/centers/lahore'
PIMS='https://www.pims.gov.pk/department-thalassemia.php'
PATHWEL='https://pathwel.org.pk/contact-us/'
SUNDASISB='https://legacy.sundas.org/Master/Islamabad'
# id, name, city, type, lon, lat, area, address, sourceURL, note, public phone (if confirmed)
ROWS=[
('l-sundas','Sundas Foundation — Lahore','lahore','thalassemia',74.3200,31.5486,'Shadman','880 Shadman-1, near Crescent Girls School, Lahore',SUNDAS,'Dedicated thalassaemia and blood-support services','+924237422131'),
('l-fatimid','Fatimid Foundation — Lahore','lahore','thalassemia',74.2620,31.4590,'Johar Town','72-A, Block D2, off Khayaban-e-Firdousi, Johar Town, Lahore',FATIMID,'Publicly listed hematology and blood support','+924235210834'),
('l-children','Children’s Hospital — Thalassaemia Clinic','lahore','thalassemia',74.3260,31.4762,'Ferozepur Road','The Children’s Hospital, Ferozepur Road, Lahore',CHILD,'Official thalassaemia clinic and transfusion service; contact for appointment',''),
('l-noor','Noor Thalassemia Foundation','lahore','thalassemia',74.3200,31.5064,'Garden Town','74-A, Garden Block, Garden Town, Lahore','https://www.google.com/maps/search/?api=1&query=Noor+Thalassemia+Foundation+Lahore','Publicly listed thalassaemia patient support; current services require confirmation','+924237429047'),
('l-rmt','Riaz Mansoor Trust','lahore','thalassemia',74.2760,31.5465,'Gulshan-e-Ravi','239, H Block, Gulshan-e-Ravi, Lahore','https://www.google.com/maps/search/?api=1&query=Riaz+Mansoor+Trust+Lahore','Publicly listed thalassaemia care organisation',''),
('l-gangar','Sir Ganga Ram Hospital Blood Bank','lahore','hospital',74.3150,31.5670,'Queen’s Road','Sir Ganga Ram Hospital, Queen’s Road, Lahore',PBTA,'Hospital blood bank; verify current services',''),
('l-mayo','Mayo Hospital Blood Bank','lahore','hospital',74.3119,31.5798,'Old Anarkali','Mayo Hospital, Hospital Road, Lahore',PBTA,'Hospital blood bank; verify current services',''),
('l-jinnah','Jinnah Hospital Blood Bank','lahore','hospital',74.2717,31.4758,'Faisal Town','Jinnah Hospital, Maulana Shaukat Ali Road, Lahore',PBTA,'Hospital blood bank; verify current services',''),
('l-lg','Lahore General Hospital Blood Bank','lahore','hospital',74.3422,31.4745,'Ferozepur Road','Lahore General Hospital, Ferozepur Road, Lahore',PBTA,'Hospital blood bank; verify current services',''),
('l-fmh','Fatima Memorial Hospital Blood Bank','lahore','hospital',74.3247,31.5480,'Shadman','Fatima Memorial Hospital, Shadman, Lahore',PBTA,'Hospital blood bank; verify current services',''),
('l-pic','Punjab Institute of Cardiology Blood Bank','lahore','hospital',74.3283,31.5515,'Jail Road','Punjab Institute of Cardiology, Jail Road, Lahore',PBTA,'Hospital blood bank; verify current services',''),
('l-sheikh','Sheikh Zayed Hospital Blood Bank','lahore','hospital',74.2871,31.5069,'New Muslim Town','Sheikh Zayed Hospital, Lahore',PBTA,'Hospital blood bank; verify current services',''),
('l-midcity','Mid City Hospital Blood Bank','lahore','bloodbank',74.3241,31.5500,'Shadman II','3-A, Shadman II, Jail Road, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-farooq','Farooq Hospital Blood Bank','lahore','bloodbank',74.2875,31.5137,'Iqbal Town','2-3 Asif Block, Allama Iqbal Town, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-alkhidmat','Al-Khidmat Blood Bank — Surayya Azeem Hospital','lahore','bloodbank',74.2987,31.5436,'Chauburji','Surayya Azeem Teaching Hospital, 40 Multan Road, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-hameed','Hameed Latif Hospital Blood Bank','lahore','hospital',74.3176,31.5024,'Garden Town','14 Abu Bakar Block, New Garden Town, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-doctors','Doctors Hospital & Medical Centre Blood Bank','lahore','hospital',74.2562,31.4597,'Johar Town','151 G-1, Johar Town, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-shalimar','Shalimar Hospital Blood Bank','lahore','hospital',74.3637,31.5746,'Mughalpura','Shalimar Link Road, Mughalpura, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-omer','Omer Hospital Blood Bank','lahore','bloodbank',74.3275,31.5514,'Shadman','5 Shadman II, Jail Road, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-chughtai','Chughtai Lab Blood Bank — Jail Road','lahore','bloodbank',74.3265,31.5441,'Jail Road','10 Jail Road, Lahore',PBTA,'Historical directory listing; confirm current operation',''),
('l-shaukat','Shaukat Khanum Hospital Blood Bank','lahore','hospital',74.2604,31.4504,'Johar Town','7-A, Block R-III, Johar Town, Lahore',PBTA,'Hospital blood bank; patient access rules need confirmation',''),
('i-pims','PIMS Thalassaemia & Haemophilia Center','islamabad','thalassemia',73.0485,33.7088,'G-8/3','Children’s Hospital, PIMS Complex, G-8/3, Islamabad',PIMS,'Official dedicated thalassaemia clinic and blood product transfusion',''),
('i-sundas','Sundas Foundation — Islamabad','islamabad','thalassemia',73.0207,33.7098,'F-9 Park','Fatima Jinnah Park, Mehran Gate, F-9, Islamabad',SUNDASISB,'Thalassaemia care and donation support; contact before travel','+92512324241'),
('i-aziz','Abdul Aziz Thalassemia Center','islamabad','thalassemia',73.0476,33.6972,'G-9/3','Al Fateh Market, Street 3, near Hockey Ground, G-9/3, Islamabad','https://abdulazizthalassemia.org/contact-new/','Public thalassaemia support center','+92512284400'),
('i-shifa','Shifa International Hospital Blood Bank','islamabad','hospital',73.0643,33.6864,'H-8/4','Pitras Bukhari Road, H-8/4, Islamabad','https://www.google.com/maps/search/?api=1&query=Shifa+International+Hospital+Blood+Bank','Hospital blood transfusion support; access restrictions may apply',''),
('i-rbc','Islamabad Regional Blood Center','islamabad','bloodbank',73.1496,33.6851,'Chak Shahzad','Park Road, Chak Shahzad, Islamabad','https://www.google.com/maps/search/?api=1&query=Regional+Blood+Center+Islamabad','Regional blood processing facility; may not issue units to walk-in patients','+92518434306'),
('i-pathwel','PATHWEL Thalassaemia Centre','islamabad','thalassemia',73.0698,33.6026,'Rawalpindi · Tipu Road','Opposite Rawalpindi Medical University, Tipu Road, Rawalpindi',PATHWEL,'Dedicated thalassaemia treatment and in-house blood bank','+92515706515'),
('i-jsf','Jamila Sultana Foundation','islamabad','thalassemia',73.0754,33.5792,'Rawalpindi · Chaklala III','Street 12, Chaklala Scheme III, Rawalpindi','https://pbta.punjab.gov.pk/licensed_blood_banks','Thalassaemia-focused foundation; location is in Rawalpindi','+92515153335'),
('i-holy','Holy Family Hospital Blood Unit','islamabad','hospital',73.0747,33.6525,'Rawalpindi · Satellite Town','Holy Family Hospital, Satellite Town, Rawalpindi',PBTA,'Hospital blood unit; verify current services',''),
('i-afit','AFIT Transfusion Services','islamabad','bloodbank',73.0330,33.5925,'Rawalpindi Cantt','Convoy Road, Rawalpindi Cantt','https://www.google.com/maps/search/?api=1&query=AFIT+Blood+Bank+Rawalpindi','Transfusion institute; public access needs prior confirmation',''),
('i-redcrescent','Pakistan Red Crescent — National HQ','islamabad','bloodbank',73.0515,33.6828,'H-8/2','Ashfaq Ahmed Road, H-8/2, Islamabad','https://www.google.com/maps/search/?api=1&query=Pakistan+Red+Crescent+Society+H8+Islamabad','Humanitarian center; confirm donation and blood-issue services',''),
]
features=[]
for rid,name,city,kind,lon,lat,area,address,source,note,phone in ROWS:
    features.append({'type':'Feature','geometry':{'type':'Point','coordinates':[lon,lat]},'properties':{
       'id':rid,'name':name,'city':city,'category':kind,'area':area,'address':address,
       'sourceUrl':source,'note':note,'phone':phone,'stockStatus':'not available',
       'coordinateAccuracy':'approximate illustrative neighborhood anchor — not verified entrance coordinates',
       'sourceStatus':'Directory/provider listing; not a live license or service verification'
    }})
fc={'type':'FeatureCollection','name':'BloodBridge PK — Lahore + Islamabad/Rawalpindi directory snapshot',
    'metadata':{'checkedOn':'2026-11-01','sources':[PBTA,CHILD,FATIMID,SUNDAS,PIMS,PATHWEL,SUNDASISB],
      'note':'Historical regulatory directory and provider public listings, combined with illustrative neighborhood-level pins. Validate with each provider. No blood inventory, donor availability, patient data or actual camps.',
      'method':'Hand curated, not a complete census. No claim that all listed blood banks currently have stock.'},
    'features':features}
folder=ROOT/'app'/'data';folder.mkdir(exist_ok=True)
(folder/'centers.geojson').write_text(json.dumps(fc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(folder/'centers.js').write_text('window.BLOODBRIDGE_GEOJSON = '+json.dumps(fc,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Created {len(features)} curated location records for two metros')
