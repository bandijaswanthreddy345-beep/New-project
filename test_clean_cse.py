import re

test_filenames = [
    "00_Course_Structure.pdf",
    "01_Artificial_Intelligence.pdf",
    "02_Computer_Networks.pdf",
    "04_Object_Oriented_Analysis_And_Design_PE-I.pdf",
    "08_Java_Programming_OE-I.pdf",
    "12_Full_Stack_Development_Ii_SEC.pdf",
    "17_Technical_Report_Writing_and_Ipr_Audit.pdf",
    "02_Business_Ethics_And_Corporate_Governance_MgmtII.pdf"
]

def clean_title_and_category(stem):
    # remove leading numbers like 00_, 01_, 12_
    cleaned = re.sub(r'^[0-9]+[\s_.-]+', '', stem)
    category = "Core Course"
    
    # check if category tag at the end
    if cleaned.endswith("_PE-I") or cleaned.endswith(" PE-I"):
        cleaned = re.sub(r'[_ ]PE-I$', '', cleaned)
        category = "Professional Elective-I"
    elif cleaned.endswith("_PE-II") or cleaned.endswith(" PE-II"):
        cleaned = re.sub(r'[_ ]PE-II$', '', cleaned)
        category = "Professional Elective-II"
    elif cleaned.endswith("_PE-III") or cleaned.endswith(" PE-III"):
        cleaned = re.sub(r'[_ ]PE-III$', '', cleaned)
        category = "Professional Elective-III"
    elif cleaned.endswith("_PE-IV") or cleaned.endswith(" PE-IV"):
        cleaned = re.sub(r'[_ ]PE-IV$', '', cleaned)
        category = "Professional Elective-IV"
    elif cleaned.endswith("_PE-V") or cleaned.endswith(" PE-V"):
        cleaned = re.sub(r'[_ ]PE-V$', '', cleaned)
        category = "Professional Elective-V"
    elif cleaned.endswith("_OE-I") or cleaned.endswith(" OE-I"):
        cleaned = re.sub(r'[_ ]OE-I$', '', cleaned)
        category = "Open Elective-I"
    elif cleaned.endswith("_OE-II") or cleaned.endswith(" OE-II"):
        cleaned = re.sub(r'[_ ]OE-II$', '', cleaned)
        category = "Open Elective-II"
    elif cleaned.endswith("_OE-III") or cleaned.endswith(" OE-III"):
        cleaned = re.sub(r'[_ ]OE-III$', '', cleaned)
        category = "Open Elective-III"
    elif cleaned.endswith("_OE-IV") or cleaned.endswith(" OE-IV"):
        cleaned = re.sub(r'[_ ]OE-IV$', '', cleaned)
        category = "Open Elective-IV"
    elif cleaned.endswith("_SEC") or cleaned.endswith(" SEC"):
        cleaned = re.sub(r'[_ ]SEC$', '', cleaned)
        category = "Skill Enhancement Course"
    elif cleaned.endswith("_MgmtII") or cleaned.endswith(" MgmtII"):
        cleaned = re.sub(r'[_ ]MgmtII$', '', cleaned)
        category = "Management Course-II"
        
    title = cleaned.replace('_', ' ').strip()
    return title, category

for tf in test_filenames:
    stem = tf[:-4]
    t, c = clean_title_and_category(stem)
    print(f"Original: {stem:55} -> Title: '{t:40}' | Cat: {c}")
