import zipfile
import re

zip_path = r"C:\Users\B Keerthi\Downloads\civil engineering.zip"

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

with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if not name.endswith('.pdf'):
            continue
        parts = name.split('/')
        sem_folder = parts[1]
        category = parts[2] if len(parts) > 3 else "Core"
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
        print(f"Sem: {sem_code:4} | Cat: {category:24} | Code: {code:12} | Title: {raw_title}")
