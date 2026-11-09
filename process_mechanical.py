import zipfile
import re
import os
import json
import shutil

zip_path = r"C:\Users\B Keerthi\Downloads\mechanical engineering.zip"
target_upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "uploads"))
os.makedirs(target_upload_dir, exist_ok=True)

sem_folder_to_standard = {
    "I-Year_I-Sem": "1-1",
    "I-Year_II-Sem": "1-2",
    "II-Year_I-Sem": "2-1",
    "II-Year_II-Sem": "2-2",
    "III-Year_I-Sem": "3-1",
    "III-Year_II-Sem": "3-2",
    "IV-Year_I-Sem": "4-1",
    "IV-Year_II-Sem": "4-2",
    # Alternative naming conventions in case they appear
    "1-1": "1-1",
    "1-2": "1-2",
    "2-1": "2-1",
    "2-2": "2-2",
    "3-1": "3-1",
    "3-2": "3-2",
    "4-1": "4-1",
    "4-2": "4-2",
    "Sem-1": "1-1",
    "Sem-2": "1-2",
    "Sem-3": "2-1",
    "Sem-4": "2-2",
    "Sem-5": "3-1",
    "Sem-6": "3-2",
    "Sem-7": "4-1",
    "Sem-8": "4-2",
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
        
        # Determine semester folder
        sem_folder = ""
        category = "Core Course"
        for p in parts:
            for k in sem_folder_to_standard.keys():
                if k.lower() in p.lower():
                    sem_folder = k
                    break
            if "elective" in p.lower() or "management" in p.lower() or "humanities" in p.lower():
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

        sem_code = sem_folder_to_standard.get(sem_folder, "1-1")

        # Extract file directly to target_upload_dir
        out_filepath = os.path.join(target_upload_dir, filename)
        with z.open(name) as src, open(out_filepath, 'wb') as dst:
            shutil.copyfileobj(src, dst)
        extracted_count += 1

        syllabus_items.append({
            "title": raw_title.strip(),
            "branch": "Mechanical Engineering",
            "semester": sem_code,
            "description": f"JNTUA R23 Mechanical Engineering - {category}",
            "pdfUrl": f"/uploads/{filename}",
            "regulation": "R23",
            "subject": raw_title.strip(),
            "subjectCode": code.strip(),
            "views": 0,
            "likes": 0,
            "downloads": 0
        })

output_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "scripts", "mechanical_syllabus_items.json"))
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(syllabus_items, f, indent=2)

print(f"Extraction successful!")
print(f"Extracted {extracted_count} PDFs directly to uploads/")
print(f"Generated {len(syllabus_items)} syllabus records in {output_json}")
