import zipfile
import re
import os
import json
import shutil

zip_path = r"C:\Users\B Keerthi\Downloads\cse.zip"
target_upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "uploads"))
os.makedirs(target_upload_dir, exist_ok=True)

sem_folder_to_standard = {
    "i-year_i-sem": "1-1",
    "i-year_ii-sem": "1-2",
    "ii-year_i-sem": "2-1",
    "ii-year_ii-sem": "2-2",
    "iii-year_i-sem": "3-1",
    "iii-year_ii-sem": "3-2",
    "iv-year_i-sem": "4-1",
    "iv-year_ii-sem": "4-2",
    "1-1": "1-1",
    "1-2": "1-2",
    "2-1": "2-1",
    "2-2": "2-2",
    "3-1": "3-1",
    "3-2": "3-2",
    "4-1": "4-1",
    "4-2": "4-2",
    "sem-1": "1-1",
    "sem-2": "1-2",
    "sem-3": "2-1",
    "sem-4": "2-2",
    "sem-5": "3-1",
    "sem-6": "3-2",
    "sem-7": "4-1",
    "sem-8": "4-2",
    "sem1": "1-1",
    "sem2": "1-2",
    "sem3": "2-1",
    "sem4": "2-2",
    "sem5": "3-1",
    "sem6": "3-2",
    "sem7": "4-1",
    "sem8": "4-2",
}

extracted_count = 0
syllabus_items = []

if not os.path.exists(zip_path):
    print(f"Error: Zip file not found at {zip_path}")
    exit(1)

with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if not name.endswith('.pdf'):
            continue
        parts = [p for p in name.split('/') if p]

        sem_code = "1-1"
        category = "Core Course"

        for p in parts:
            p_lower = p.lower()
            for k, v in sem_folder_to_standard.items():
                if k in p_lower:
                    sem_code = v
                    break
            if "elective" in p_lower or "management" in p_lower or "humanities" in p_lower or "skill" in p_lower:
                category = p.replace('_', ' ')

        filename = parts[-1]
        stem = filename[:-4]

        # parse code and title
        match = re.match(r'^([0-9]{2}[A-Za-z0-9]+)_(.*)$', stem)
        if match:
            code = match.group(1)
            raw_title = match.group(2).replace('_', ' ')
        else:
            code = ""
            raw_title = stem.replace('_', ' ')

        # Extract file directly to target_upload_dir
        out_filepath = os.path.join(target_upload_dir, filename)
        with z.open(name) as src, open(out_filepath, 'wb') as dst:
            shutil.copyfileobj(src, dst)
        extracted_count += 1

        syllabus_items.append({
            "title": raw_title.strip(),
            "branch": "Computer Science and Engineering",
            "semester": sem_code,
            "description": f"JNTUA R23 Computer Science and Engineering - {category}",
            "pdfUrl": f"/uploads/{filename}",
            "regulation": "R23",
            "subject": raw_title.strip(),
            "subjectCode": code.strip(),
            "views": 0,
            "likes": 0,
            "downloads": 0
        })

output_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "scripts", "cse_syllabus_items.json"))
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(syllabus_items, f, indent=2)

print(f"Extraction successful!")
print(f"Extracted {extracted_count} CSE PDFs directly to uploads/")
print(f"Generated {len(syllabus_items)} syllabus records in {output_json}")
