import os
import glob
import zipfile
import re
from collections import Counter

zips_to_check = {
    "AIML": r"C:\Users\B Keerthi\Downloads\aiml.zip",
    "Civil": r"C:\Users\B Keerthi\Downloads\civil engineering.zip",
    "Mechanical": r"C:\Users\B Keerthi\Downloads\mechanical engineering.zip",
    "ECE": r"C:\Users\B Keerthi\Downloads\ece.zip",
}

for name, path in zips_to_check.items():
    if not os.path.exists(path):
        print(f"{name}: File not found at {path}")
        continue
    with zipfile.ZipFile(path, 'r') as z:
        pdf_names = [n for n in z.namelist() if n.endswith('.pdf')]
        print(f"\n================ {name} ({len(pdf_names)} PDFs) ================")
        folders = Counter()
        has_leading_numbers = 0
        for n in pdf_names:
            parts = [p for p in n.split('/') if p]
            parent = parts[1] if len(parts) > 2 else (parts[0] if len(parts) > 1 else 'root')
            folders[parent] += 1
            filename = parts[-1]
            if re.match(r'^[0-9]{2}[_\s.-]', filename):
                has_leading_numbers += 1
        for f, cnt in sorted(folders.items()):
            print(f"  Folder: {f:30} -> {cnt} PDFs")
        print(f"  Files with leading numbers (e.g. 01_...): {has_leading_numbers}")
