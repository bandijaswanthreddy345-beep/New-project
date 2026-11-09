import zipfile
import re
import os

zip_path = r"C:\Users\B Keerthi\Downloads\civil engineering.zip"

sem_map = {
    "I-Year_I-Sem": "1",
    "I-Year_II-Sem": "2",
    "II-Year_I-Sem": "3",
    "II-Year_II-Sem": "4",
    "III-Year_I-Sem": "5",
    "III-Year_II-Sem": "6",
    "IV-Year_I-Sem": "7",
    "IV-Year_II-Sem": "8",
}

with zipfile.ZipFile(zip_path, 'r') as z:
    records = []
    for name in z.namelist():
        if not name.endswith('.pdf'):
            continue
        parts = name.split('/')
        # e.g. JNTUA_R23_Civil_Subjects_By_Semester/III-Year_I-Sem/Open_Elective-I/23A05505b_Fundamentals_of_Artificial_Intelligence.pdf
        # or JNTUA_R23_Civil_Subjects_By_Semester/IV-Year_I-Sem/23A01701_Finite_Element_Methods.pdf
        sem_folder = parts[1] if len(parts) > 1 else ""
        filename = parts[-1]
        
        # parse code and title from filename
        # e.g. 23A01701_Finite_Element_Methods.pdf
        stem = filename[:-4]
        code = ""
        title = stem
        if "_" in stem:
            first_part, rest = stem.split("_", 1)
            # check if first_part is like 23A01701 or 23A05505b
            if re.match(r'^\d{2}[A-Za-z0-9]+$', first_part):
                code = first_part
                title = rest.replace("_", " ")
            else:
                title = stem.replace("_", " ")
        else:
            title = stem.replace("_", " ")
            
        sem_num = sem_map.get(sem_folder, sem_folder)
        subgroup = parts[2] if len(parts) > 3 else "Core"
        
        records.append({
            "sem_folder": sem_folder,
            "sem_num": sem_num,
            "subgroup": subgroup,
            "code": code,
            "title": title,
            "filename": filename,
            "zip_path": name
        })

print(f"Total PDF records found: {len(records)}")
from collections import Counter
counts = Counter(r['sem_folder'] for r in records)
for k, v in sorted(counts.items()):
    print(f"{k} (Semester {sem_map.get(k, '?')}): {v} PDFs")
