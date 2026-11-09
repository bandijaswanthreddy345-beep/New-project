import zipfile
import re
import os
import json
import shutil

zip_path = r"C:\Users\B Keerthi\Downloads\JNTUA_R23_CSE_Subject_PDFs_by_Semester.zip"
target_upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "uploads"))
os.makedirs(target_upload_dir, exist_ok=True)

sem_folder_to_standard = {
    "iii-ii": "3-2",
    "iii-i": "3-1",
    "iv-ii": "4-2",
    "iv-i": "4-1",
}

def clean_title_and_category(stem):
    # Remove leading serial numbers: "01_", "02_", "00_", "12.", "15-", etc.
    cleaned = re.sub(r'^[0-9]+[\s_.-]+', '', stem)
    category = "Core Course"

    # Category extraction from suffixes
    if re.search(r'[_ ]PE-I$', cleaned):
        cleaned = re.sub(r'[_ ]PE-I$', '', cleaned)
        category = "Professional Elective-I"
    elif re.search(r'[_ ]PE-II$', cleaned):
        cleaned = re.sub(r'[_ ]PE-II$', '', cleaned)
        category = "Professional Elective-II"
    elif re.search(r'[_ ]PE-III$', cleaned):
        cleaned = re.sub(r'[_ ]PE-III$', '', cleaned)
        category = "Professional Elective-III"
    elif re.search(r'[_ ]PE-IV$', cleaned):
        cleaned = re.sub(r'[_ ]PE-IV$', '', cleaned)
        category = "Professional Elective-IV"
    elif re.search(r'[_ ]PE-V$', cleaned):
        cleaned = re.sub(r'[_ ]PE-V$', '', cleaned)
        category = "Professional Elective-V"
    elif re.search(r'[_ ]OE-I$', cleaned):
        cleaned = re.sub(r'[_ ]OE-I$', '', cleaned)
        category = "Open Elective-I"
    elif re.search(r'[_ ]OE-II$', cleaned):
        cleaned = re.sub(r'[_ ]OE-II$', '', cleaned)
        category = "Open Elective-II"
    elif re.search(r'[_ ]OE-III$', cleaned):
        cleaned = re.sub(r'[_ ]OE-III$', '', cleaned)
        category = "Open Elective-III"
    elif re.search(r'[_ ]OE-IV$', cleaned):
        cleaned = re.sub(r'[_ ]OE-IV$', '', cleaned)
        category = "Open Elective-IV"
    elif re.search(r'[_ ]SEC$', cleaned):
        cleaned = re.sub(r'[_ ]SEC$', '', cleaned)
        category = "Skill Enhancement Course"
    elif re.search(r'[_ ]MgmtII$', cleaned):
        cleaned = re.sub(r'[_ ]MgmtII$', '', cleaned)
        category = "Management Course-II"

    title = cleaned.replace('_', ' ').strip()
    return title, category

syllabus_items = []
extracted_count = 0

with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if not name.endswith('.pdf'):
            continue
        parts = [p for p in name.split('/') if p]

        sem_code = "3-1"
        for p in parts:
            p_lower = p.lower()
            if "iii-ii" in p_lower:
                sem_code = "3-2"
                break
            elif "iii-i" in p_lower:
                sem_code = "3-1"
                break
            elif "iv-ii" in p_lower:
                sem_code = "4-2"
                break
            elif "iv-i" in p_lower:
                sem_code = "4-1"
                break

        filename = parts[-1]
        stem = filename[:-4]

        title, category = clean_title_and_category(stem)

        out_filepath = os.path.join(target_upload_dir, filename)
        with z.open(name) as src, open(out_filepath, 'wb') as dst:
            shutil.copyfileobj(src, dst)
        extracted_count += 1

        syllabus_items.append({
            "title": title,
            "branch": "Computer Science and Engineering",
            "semester": sem_code,
            "description": f"JNTUA R23 Computer Science and Engineering - {category}",
            "pdfUrl": f"/uploads/{filename}",
            "regulation": "R23",
            "subject": title,
            "subjectCode": "",
            "views": 0,
            "likes": 0,
            "downloads": 0
        })

output_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "scripts", "cse_fixed_syllabus_items.json"))
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(syllabus_items, f, indent=2)

print(f"Extraction successful!")
from collections import Counter
counts = Counter(i['semester'] for i in syllabus_items)
for s, c in sorted(counts.items()):
    print(f"Semester {s}: {c} subjects")
