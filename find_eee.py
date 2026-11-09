import os
import glob

downloads_dir = r"C:\Users\B Keerthi\Downloads"
all_files = os.listdir(downloads_dir)
matching = [f for f in all_files if any(k in f.lower() for k in ["eee", "electrical", "syllabus", "r23"])]
print("Matching files in Downloads:")
for m in matching:
    print("-", m)
