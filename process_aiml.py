import zipfile
import re
import os
import json
import shutil

zip_path = r"C:\Users\B Keerthi\Downloads\aiml.zip"
folder_path = r"C:\Users\B Keerthi\Downloads\aiml.zip\JNTUA_R23_AI-ML_Subjects_By_Semester"
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
}

extracted_count = 0
syllabus_items = []

# Check if zip exists
if os.path.exists(zip_path) and zipfile.is_zipfile(zip_path):
    print(f"Reading from zip file: {zip_path}")
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
                "branch": "Artificial Intelligence & Machine Learning",
                "semester": sem_code,
                "description": f"JNTUA R23 Artificial Intelligence & Machine Learning - {category}",
                "pdfUrl": f"/uploads/{filename}",
                "regulation": "R23",
                "subject": raw_title.strip(),
                "subjectCode": code.strip(),
                "views": 0,
                "likes": 0,
                "downloads": 0
            })
elif os.path.exists(folder_path):
    print(f"Reading from folder: {folder_path}")
    for root, dirs, files in os.walk(folder_path):
        for f in files:
            if not f.endswith('.pdf'):
                continue
            rel = os.path.relpath(os.path.join(root, f), folder_path)
            parts = rel.replace('\\', '/').split('/')
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

            filename = f
            stem = filename[:-4]
            match = re.match(r'^([0-9]{2}[A-Za-z0-9]+)_(.*)$', stem)
            if match:
                code = match.group(1)
                raw_title = match.group(2).replace('_', ' ')
            else:
                code = ""
                raw_title = stem.replace('_', ' ')

            src_file = os.path.join(root, f)
            out_filepath = os.path.join(target_upload_dir, filename)
            shutil.copyfile(src_file, out_filepath)
            extracted_count += 1

            syllabus_items.append({
                "title": raw_title.strip(),
                "branch": "Artificial Intelligence & Machine Learning",
                "semester": sem_code,
                "description": f"JNTUA R23 Artificial Intelligence & Machine Learning - {category}",
                "pdfUrl": f"/uploads/{filename}",
                "regulation": "R23",
                "subject": raw_title.strip(),
                "subjectCode": code.strip(),
                "views": 0,
                "likes": 0,
                "downloads": 0
            })
else:
    print(f"Neither {zip_path} nor {folder_path} exists.")
    exit(1)

output_json = os.path.abspath(os.path.join(os.path.dirname(__file__), "andhra-circle-backend", "scripts", "aiml_syllabus_items.json"))
with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(syllabus_items, f, indent=2)

print(f"Extraction successful!")
print(f"Extracted {extracted_count} AIML PDFs directly to uploads/")
print(f"Generated {len(syllabus_items)} syllabus records in {output_json}")
