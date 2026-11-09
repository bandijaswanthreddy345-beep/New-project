import zipfile
import os

zip_path = r"C:\Users\B Keerthi\Downloads\civil engineering.zip"

if not os.path.exists(zip_path):
    print(f"Error: Zip file not found at {zip_path}")
else:
    print(f"Zip file found! Size: {os.path.getsize(zip_path)} bytes")
    with zipfile.ZipFile(zip_path, 'r') as z:
        namelist = z.namelist()
        print(f"Total files in zip: {len(namelist)}")
        for i, name in enumerate(namelist):
            info = z.getinfo(name)
            print(f"[{i+1}] {name} ({info.file_size} bytes)")
