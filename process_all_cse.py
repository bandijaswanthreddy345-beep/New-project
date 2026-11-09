import zipfile
import re
import os
import json
import shutil
from collections import Counter

zip1_path = r"C:\Users\B Keerthi\Downloads\cse.zip"
zip2_path = r"C:\Users\B Keerthi\Downloads\JNTUA_R23_CSE_Subject_PDFs_by_Semester.zip"
target_upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "uploads"))
os.makedirs(target_upload_dir, exist_ok=True)

all_items = []

def clean_title_and_category(stem):
    cleaned = re.sub(r'^[0-9]+[\s_.-]+', '', stem)
    category = "Core Course"

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

# 1. Process cse.zip (Years 1 and 2: 1-1, 1-2, 2-1, 2-2)
if os.path.exists(zip1_path):
    with zipfile.ZipFile(zip1_path, 'r') as z:
        for name in z.namelist():
            if not name.endswith('.pdf'):
                continue
            parts = [p for p in name.split('/') if p]
            filename = parts[-1]
            stem = filename[:-4]

            # Parse code and title
            match = re.match(r'^([0-9]{2}[A-Za-z0-9]+)_(.*)$', stem)
            if match:
                code = match.group(1)
                raw_title = match.group(2).replace('_', ' ')
            else:
                code = ""
                raw_title = stem.replace('_', ' ')

            # Accurate JNTUA R23 semester detection based on course code
            # 23A1xxxx -> 1-1
            # 23A2xxxx -> 1-2
            # 23A3xxxx -> 2-1
            # 23A4xxxx -> 2-2
            if code.startswith("23A1"):
                sem_code = "1-1"
            elif code.startswith("23A2"):
                sem_code = "1-2"
            elif code.startswith("23A3"):
                sem_code = "2-1"
            elif code.startswith("23A4"):
                sem_code = "2-2"
            else:
                # check folder name
                folder_str = "/".join(parts[:-1]).lower()
                if "ii-year_ii-sem" in folder_str or "2-2" in folder_str:
                    sem_code = "2-2"
                elif "ii-year_i-sem" in folder_str or "2-1" in folder_str:
                    sem_code = "2-1"
                elif "i-year_ii-sem" in folder_str or "1-2" in folder_str:
                    sem_code = "1-2"
                else:
                    sem_code = "1-1"

            # Copy PDF to uploads
            out_filepath = os.path.join(target_upload_dir, filename)
            with z.open(name) as src, open(out_filepath, 'wb') as dst:
                shutil.copyfileobj(src, dst)

            all_items.append({
                "title": raw_title.strip(),
                "branch": "Computer Science and Engineering",
                "semester": sem_code,
                "description": f"JNTUA R23 Computer Science and Engineering - Core Course",
                "pdfUrl": f"/uploads/{filename}",
                "regulation": "R23",
                "subject": raw_title.strip(),
                "subjectCode": code.strip(),
                "views": 0,
                "likes": 0,
                "downloads": 0
            })

# 2. Process JNTUA_R23_CSE_Subject_PDFs_by_Semester.zip (Years 3 and 4: 3-1, 3-2, 4-1, 4-2)
if os.path.exists(zip2_path):
    with zipfile.ZipFile(zip2_path, 'r') as z:
        for name in z.namelist():
            if not name.endswith('.pdf'):
                continue
            parts = [p for p in name.split('/') if p]
            filename = parts[-1]
            stem = filename[:-4]

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

            title, category = clean_title_and_category(stem)

            # Copy PDF to uploads
            out_filepath = os.path.join(target_upload_dir, filename)
            with z.open(name) as src, open(out_filepath, 'wb') as dst:
                shutil.copyfileobj(src, dst)

            all_items.append({
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

output_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "scripts", "cse_all_semesters.json"))
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(all_items, f, indent=2)

print(f"Processed total {len(all_items)} CSE syllabus items across ALL semesters!")
counts = Counter(i['semester'] for i in all_items)
for s, c in sorted(counts.items()):
    print(f"Semester {s}: {c} subjects")
