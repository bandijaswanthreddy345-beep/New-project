import zipfile
import re
import os
import json
import shutil

zip_path = r"C:\Users\B Keerthi\Downloads\civil engineering.zip"
target_upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "uploads", "civil"))
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
}

extracted_count = 0
syllabus_items = []

with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if not name.endswith('.pdf'):
            continue
        parts = name.split('/')
        sem_folder = parts[1]
        raw_category = parts[2] if len(parts) > 3 else "Core Course"
        category = raw_category.replace('_', ' ')
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
            
        sem_code = sem_folder_to_standard.get(sem_folder, sem_folder)
        
        # Extract file directly to target_upload_dir
        out_filepath = os.path.join(target_upload_dir, filename)
        with z.open(name) as src, open(out_filepath, 'wb') as dst:
            shutil.copyfileobj(src, dst)
        extracted_count += 1
        
        syllabus_items.append({
            "title": raw_title.strip(),
            "branch": "Civil Engineering",
            "semester": sem_code,
            "description": f"JNTUA R23 Civil Engineering - {category}",
            "pdfUrl": f"/uploads/civil/{filename}",
            "regulation": "R23",
            "subject": raw_title.strip(),
            "subjectCode": code.strip(),
            "views": 0,
            "likes": 0,
            "downloads": 0
        })

output_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "scripts", "civil_syllabus_items.json"))
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(syllabus_items, f, indent=2)

print(f"Extraction successful!")
print(f"Extracted {extracted_count} PDFs to {target_upload_dir}")
print(f"Generated {len(syllabus_items)} syllabus records in {output_json}")
