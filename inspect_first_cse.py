import zipfile

zip_path = r"C:\Users\B Keerthi\Downloads\cse.zip"
with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        print(name)
