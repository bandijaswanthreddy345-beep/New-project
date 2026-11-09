import zipfile

zip_path = r"C:\Users\B Keerthi\Downloads\JNTUA_R23_CSE_Subject_PDFs_by_Semester.zip"
with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if name.endswith('.pdf'):
            print(name)
