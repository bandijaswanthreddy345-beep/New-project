import zipfile
import re
import os
import json
import shutil
from collections import Counter

target_upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "uploads"))
os.makedirs(target_upload_dir, exist_ok=True)

folder_to_sem = {
    "i-year_i-sem": "1-1",
    "i-year_ii-sem": "1-2",
    "ii-year_i-sem": "2-1",
    "ii-year_ii-sem": "2-2",
    "iii-year_i-sem": "3-1",
    "iii-year_ii-sem": "3-2",
    "iv-year_i-sem": "4-1",
    "iv-year_ii-sem": "4-2",
}

branches = [
    {
        "name": "Artificial Intelligence & Machine Learning",
        "zip": r"C:\Users\B Keerthi\Downloads\aiml.zip",
        "output": "aiml_fixed_syllabus_items.json"
    },
    {
        "name": "Electronics & Communication Engineering",
        "zip": r"C:\Users\B Keerthi\Downloads\ece.zip",
        "output": "ece_fixed_syllabus_items.json"
    },
    {
        "name": "Mechanical Engineering",
        "zip": r"C:\Users\B Keerthi\Downloads\mechanical engineering.zip",
        "output": "mechanical_fixed_syllabus_items.json"
    }
]

def clean_title(stem):
    # Remove leading serial numbers e.g. "01_", "02 ", "00-"
    cleaned = re.sub(r'^[0-9]+[\s_.-]+', '', stem)
    match = re.match(r'^([0-9]{2}[A-Za-z0-9]+)_(.*)$', stem)
    code = ""
    if match:
        code = match.group(1)
        cleaned = match.group(2)
    return code.strip(), cleaned.replace('_', ' ').strip()

for b in branches:
    zpath = b["zip"]
    if not os.path.exists(zpath):
        print(f"Skipping {b['name']}: not found at {zpath}")
        continue

    items = []
    with zipfile.ZipFile(zpath, 'r') as z:
        for name in z.namelist():
            if not name.endswith('.pdf'):
                continue
            parts = [p for p in name.split('/') if p]
            # Identify semester folder by exact match
            sem_code = "1-1"
            category = "Core Course"

            for p in parts:
                p_norm = p.lower()
                if p_norm in folder_to_sem:
                    sem_code = folder_to_sem[p_norm]
                if "elective" in p_norm or "management" in p_norm or "humanities" in p_norm or "skill" in p_norm:
                    category = p.replace('_', ' ')

            filename = parts[-1]
            stem = filename[:-4]
            code, title = clean_title(stem)

            # Copy PDF to uploads
            out_filepath = os.path.join(target_upload_dir, filename)
            with z.open(name) as src, open(out_filepath, 'wb') as dst:
                shutil.copyfileobj(src, dst)

            items.append({
                "title": title,
                "branch": b["name"],
                "semester": sem_code,
                "description": f"JNTUA R23 {b['name']} - {category}",
                "pdfUrl": f"/uploads/{filename}",
                "regulation": "R23",
                "subject": title,
                "subjectCode": code,
                "views": 0,
                "likes": 0,
                "downloads": 0
            })

    out_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "scripts", b["output"]))
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2)

    print(f"\nSuccessfully processed {b['name']}: {len(items)} items")
    counts = Counter(i['semester'] for i in items)
    for s, c in sorted(counts.items()):
        print(f"  Semester {s}: {c} subjects")
