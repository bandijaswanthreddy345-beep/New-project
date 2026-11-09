import zipfile
import re
import os

zip_path = r"C:\Users\B Keerthi\Downloads\civil engineering.zip"

with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if name.endswith('.pdf'):
            print(name)
