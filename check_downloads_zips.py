import os
import glob
import zipfile
from collections import Counter

downloads_dir = r"C:\Users\B Keerthi\Downloads"
all_zips = glob.glob(os.path.join(downloads_dir, "*.zip"))

print(f"Total zip files in {downloads_dir}: {len(all_zips)}")
for z in all_zips:
    size_mb = os.path.getsize(z) / (1024 * 1024)
    print(f"- {os.path.basename(z)} ({size_mb:.2f} MB)")
