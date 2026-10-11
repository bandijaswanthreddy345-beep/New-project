import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Color Palette matching the academic reference slide
    BG_COLOR = RGBColor(246, 243, 237)          # Warm ivory/linen
    FRAME_COLOR = RGBColor(184, 158, 126)       # Subtle golden-tan border
    TITLE_COLOR = RGBColor(84, 53, 31)          # Deep warm espresso/brown
    ACCENT_BROWN = RGBColor(121, 85, 72)        # Medium warm brown
    TEXT_DARK = RGBColor(33, 43, 54)            # Deep charcoal
    TEXT_MUTED = RGBColor(100, 116, 139)        # Slate muted
    CARD_BG = RGBColor(255, 255, 255)           # Pure white card
    CARD_BORDER = RGBColor(226, 217, 203)       # Subtle cream border
    GOLD_ACCENT = RGBColor(197, 138, 43)        # Academic gold

    logo_path = os.path.join(os.path.dirname(__file__), "andhra-circle-frontend", "public", "jntu-circle-logo.png")
    has_logo = os.path.exists(logo_path)

    def add_base_decorations(slide, slide_num=None, total_slides=12):
        # 1. Background Fill
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_COLOR
        bg_shape.line.fill.background()

        # 2. Outer Framing Border (like the reference photo)
        frame = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(0.35), Inches(12.533), Inches(6.8))
        frame.fill.background()
        frame.line.color.rgb = FRAME_COLOR
        frame.line.width = Pt(1.5)

        # 3. Inner accent line
        inner_frame = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.46), Inches(0.41), Inches(12.413), Inches(6.68))
        inner_frame.fill.background()
        inner_frame.line.color.rgb = RGBColor(218, 201, 180)
        inner_frame.line.width = Pt(0.75)

        # 4. Standard Footer matching the reference image
        footer_box = slide.shapes.add_textbox(Inches(1.0), Inches(6.82), Inches(11.333), Inches(0.4))
        tf = footer_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = "Department of Artificial Intelligence and Machine Learning, MS Engineering College"
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Georgia"
        p.font.size = Pt(11)
        p.font.italic = True
        p.font.color.rgb = ACCENT_BROWN

        if slide_num is not None:
            num_box = slide.shapes.add_textbox(Inches(11.8), Inches(6.82), Inches(1.0), Inches(0.4))
            np = num_box.text_frame.paragraphs[0]
            np.text = f"{slide_num}/{total_slides}"
            np.font.name = "Arial"
            np.font.size = Pt(10)
            np.font.color.rgb = TEXT_MUTED

    def add_slide_header(slide, title_text, category_text=None):
        header_box = slide.shapes.add_textbox(Inches(1.0), Inches(0.55), Inches(11.333), Inches(1.0))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0)
        tf.margin_bottom = Inches(0)

        if category_text:
            p_cat = tf.paragraphs[0]
            p_cat.text = category_text.upper()
            p_cat.font.name = "Georgia"
            p_cat.font.size = Pt(10)
            p_cat.font.bold = True
            p_cat.font.color.rgb = GOLD_ACCENT
            p_cat.alignment = PP_ALIGN.CENTER
            p = tf.add_paragraph()
        else:
            p = tf.paragraphs[0]

        p.text = title_text
        p.font.name = "Georgia"
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = TITLE_COLOR
        p.alignment = PP_ALIGN.CENTER

        # Accent underline
        sep = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.8), Inches(1.48), Inches(1.733), Inches(0.04))
        sep.fill.solid()
        sep.fill.fore_color.rgb = GOLD_ACCENT
        sep.line.fill.background()

    # =========================================================================
    # SLIDE 0: TITLE COVER SLIDE
    # =========================================================================
    slide0 = prs.slides.add_slide(blank_slide_layout)
    add_base_decorations(slide0)

    # Decorative header banner
    cover_box = slide0.shapes.add_textbox(Inches(1.5), Inches(1.2), Inches(10.333), Inches(4.5))
    ctf = cover_box.text_frame
    ctf.word_wrap = True

    p0 = ctf.paragraphs[0]
    p0.text = "MAJOR PROJECT PRESENTATION"
    p0.font.name = "Georgia"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = GOLD_ACCENT
    p0.alignment = PP_ALIGN.CENTER

    p1 = ctf.add_paragraph()
    p1.text = "JNTU CIRCLE (ANDHRA CIRCLE)"
    p1.font.name = "Georgia"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = TITLE_COLOR
    p1.alignment = PP_ALIGN.CENTER

    p2 = ctf.add_paragraph()
    p2.text = "A Unified Academic Resource Ecosystem & Smart University Intelligence Platform"
    p2.font.name = "Georgia"
    p2.font.size = Pt(17)
    p2.font.italic = True
    p2.font.color.rgb = ACCENT_BROWN
    p2.alignment = PP_ALIGN.CENTER

    # Divider
    sep = slide0.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.8), Inches(3.4), Inches(3.733), Inches(0.04))
    sep.fill.solid()
    sep.fill.fore_color.rgb = GOLD_ACCENT
    sep.line.fill.background()

    # Meta card
    meta_card = slide0.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.5), Inches(3.7), Inches(8.333), Inches(2.6))
    meta_card.fill.solid()
    meta_card.fill.fore_color.rgb = CARD_BG
    meta_card.line.color.rgb = CARD_BORDER

    mtf = meta_card.text_frame
    mtf.word_wrap = True
    mtf.margin_top = Inches(0.2)

    mp1 = mtf.paragraphs[0]
    mp1.text = "Presented by:"
    mp1.font.bold = True
    mp1.font.size = Pt(13)
    mp1.font.color.rgb = TITLE_COLOR
    mp1.alignment = PP_ALIGN.CENTER

    mp2 = mtf.add_paragraph()
    mp2.text = "Department of Artificial Intelligence and Machine Learning"
    mp2.font.size = Pt(14)
    mp2.font.color.rgb = TEXT_DARK
    mp2.font.bold = True
    mp2.alignment = PP_ALIGN.CENTER

    mp3 = mtf.add_paragraph()
    mp3.text = "M.S. Engineering College"
    mp3.font.size = Pt(13)
    mp3.font.color.rgb = ACCENT_BROWN
    mp3.alignment = PP_ALIGN.CENTER

    mp4 = mtf.add_paragraph()
    mp4.text = "Technology Stack: React 19 • Node.js • Express • MongoDB • JNTUA Automated Sync"
    mp4.font.size = Pt(11)
    mp4.font.italic = True
    mp4.font.color.rgb = TEXT_MUTED
    mp4.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 1: FLOW OF PRESENTATION (Exact match to reference photo!)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_slide_layout)
    add_base_decorations(slide1, slide_num=1)
    add_slide_header(slide1, "Flow of Presentation")

    # Left Column (1 to 5)
    left_box = slide1.shapes.add_textbox(Inches(1.6), Inches(2.1), Inches(4.8), Inches(4.3))
    ltf = left_box.text_frame
    ltf.word_wrap = True

    left_items = [
        ("1.  Abstract", "Core summary, problem context & system overview"),
        ("2.  Introduction", "Collegiate engineering ecosystem & student challenges"),
        ("3.  Problem Statement", "Resource fragmentation & critical information gaps"),
        ("4.  Literature Review", "Comparative analysis against existing platforms"),
        ("5.  Proposed System", "MERN architecture & modular resource pillars"),
    ]

    for i, (title, sub) in enumerate(left_items):
        p = ltf.paragraphs[0] if i == 0 else ltf.add_paragraph()
        p.text = title
        p.font.name = "Georgia"
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = TITLE_COLOR
        p.space_after = Pt(2)

        p_sub = ltf.add_paragraph()
        p_sub.text = f"      {sub}"
        p_sub.font.name = "Arial"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(14)

    # Right Column (6 to 10)
    right_box = slide1.shapes.add_textbox(Inches(7.2), Inches(2.1), Inches(4.8), Inches(4.3))
    rtf = right_box.text_frame
    rtf.word_wrap = True

    right_items = [
        ("6.  System Architecture", "Decoupled 3-tier client-server microservices flow"),
        ("7.  Key Features & Demonstration", "Unit notes, JNTU GPA calc, live notice daemon"),
        ("8.  Implementation & Progress", "Database schema, REST controllers & security"),
        ("9.  Future Scope", "AI question paper analysis & RAG study tutor"),
        ("10. Conclusion", "Project impact & academic summary"),
    ]

    for i, (title, sub) in enumerate(right_items):
        p = rtf.paragraphs[0] if i == 0 else rtf.add_paragraph()
        p.text = title
        p.font.name = "Georgia"
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = TITLE_COLOR
        p.space_after = Pt(2)

        p_sub = rtf.add_paragraph()
        p_sub.text = f"      {sub}"
        p_sub.font.name = "Arial"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(14)

    # Helper function for 2-column cards layout
    def create_two_card_slide(slide_title, cat_text, left_title, left_bullets, right_title, right_bullets, slide_idx):
        slide = prs.slides.add_slide(blank_slide_layout)
        add_base_decorations(slide, slide_num=slide_idx)
        add_slide_header(slide, slide_title, cat_text)

        # Left Card
        card_l = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.75), Inches(5.4), Inches(4.8))
        card_l.fill.solid()
        card_l.fill.fore_color.rgb = CARD_BG
        card_l.line.color.rgb = CARD_BORDER
        card_l.line.width = Pt(1)

        ltf = card_l.text_frame
        ltf.word_wrap = True
        ltf.margin_top = Inches(0.25)
        ltf.margin_left = Inches(0.25)
        ltf.margin_right = Inches(0.25)

        lp0 = ltf.paragraphs[0]
        lp0.text = left_title
        lp0.font.name = "Georgia"
        lp0.font.size = Pt(16)
        lp0.font.bold = True
        lp0.font.color.rgb = TITLE_COLOR
        lp0.space_after = Pt(10)

        for b in left_bullets:
            bp = ltf.add_paragraph()
            bp.text = f"•  {b}"
            bp.font.name = "Arial"
            bp.font.size = Pt(12)
            bp.font.color.rgb = TEXT_DARK
            bp.space_after = Pt(8)

        # Right Card
        card_r = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.933), Inches(1.75), Inches(5.4), Inches(4.8))
        card_r.fill.solid()
        card_r.fill.fore_color.rgb = CARD_BG
        card_r.line.color.rgb = CARD_BORDER
        card_r.line.width = Pt(1)

        rtf = card_r.text_frame
        rtf.word_wrap = True
        rtf.margin_top = Inches(0.25)
        rtf.margin_left = Inches(0.25)
        rtf.margin_right = Inches(0.25)

        rp0 = rtf.paragraphs[0]
        rp0.text = right_title
        rp0.font.name = "Georgia"
        rp0.font.size = Pt(16)
        rp0.font.bold = True
        rp0.font.color.rgb = TITLE_COLOR
        rp0.space_after = Pt(10)

        for b in right_bullets:
            bp = rtf.add_paragraph()
            bp.text = f"•  {b}"
            bp.font.name = "Arial"
            bp.font.size = Pt(12)
            bp.font.color.rgb = TEXT_DARK
            bp.space_after = Pt(8)

        return slide

    # =========================================================================
    # SLIDE 2: ABSTRACT
    # =========================================================================
    create_two_card_slide(
        "Abstract",
        "Executive Summary",
        "The Core Challenge & Motivation",
        [
            "Collegiate engineering education requires access to syllabus-specific lecture notes, previous papers, and fast notifications.",
            "Existing materials are fragmented across ad-heavy websites, informal group chats, and outdated shared folders.",
            "Lack of unit-by-unit modularity forces students to search through massive textbook PDFs before midterm exams.",
            "JNTU Circle was conceptualized as a dedicated, open-access intelligence portal tailored to university curricula (R19, R20, R23)."
        ],
        "The Solution & Architectural Highlights",
        [
            "Full-Stack MERN Architecture: Built using React 19, Vite, Node.js, Express.js, and MongoDB Atlas.",
            "Autonomous Background Sync: Real-time worker parses official JNTUA examination APIs and extracts verified B.Tech circulars.",
            "Academic Intelligence Suite: University-accurate 10-point SGPA/CGPA grade calculators & 75% attendance trackers.",
            "Collaborative Hub: Unit-level PDF viewer, community upload workflows with admin verification, and peer comments."
        ],
        slide_idx=2
    )

    # =========================================================================
    # SLIDE 3: INTRODUCTION
    # =========================================================================
    create_two_card_slide(
        "Introduction",
        "Context & Vision",
        "Engineering Academic Landscape",
        [
            "Standardized curricula across 150+ affiliated engineering colleges following JNTU regulations.",
            "Fast-paced semesters demanding quick turnaround for midterms, lab evaluations, and university finals.",
            "High stakes: Missing a university examination registration or revaluation notification directly affects academic standing.",
            "Multi-disciplinary scope: Tailored support for AIML, CSE, ECE, MECH, and CIVIL departments."
        ],
        "Platform Vision & Objectives",
        [
            "Centralization: Single digital destination for Notes, Question Papers, Lab Manuals, Syllabi, and Exam Alerts.",
            "Unit Granularity: Break monolithic study materials into manageable Units 1 through 5 for targeted exam revision.",
            "Reliability & Speed: Sub-100ms client interactions, zero intrusive advertisements, and verified academic accuracy.",
            "Student Empowerment: Built with an intuitive command bar, glassmorphism design tokens, and mobile-first responsiveness."
        ],
        slide_idx=3
    )

    # =========================================================================
    # SLIDE 4: PROBLEM STATEMENT
    # =========================================================================
    create_two_card_slide(
        "Problem Statement",
        "Identified Inefficiencies",
        "Critical Academic Pain Points",
        [
            "Material Fragmentation: Academic resources are scattered across random Google Drive links, Telegram channels, and paper handouts.",
            "Information Noise in Exam Notices: University websites bundle postgraduate, pharmacy, and administrative notices in one congested list.",
            "Deadlines Missed: Students miss critical examination registration, fee payment, and challenge evaluation deadlines.",
            "File Bulk: Downloading 200MB scanned textbooks on mobile devices wastes bandwidth and study preparation time."
        ],
        "Evaluation & Collaboration Deficits",
        [
            "Inaccurate GPA Calculation: Commercial GPA tools do not support JNTU's specific 10-point scale (O:10 to F:0) or branch credit weights.",
            "Attendance Tracking Gap: Students cannot easily calculate how many lectures they can safely miss to stay above the 75% university rule.",
            "No Verification Mechanism: Community notes on social media are unvetted and often contain syllabus inaccuracies.",
            "Disjointed Lab Resources: Lab manuals lack code snippets, execution outputs, and viva questions in a single place."
        ],
        slide_idx=4
    )

    # =========================================================================
    # SLIDE 5: LITERATURE REVIEW
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_slide_layout)
    add_base_decorations(slide5, slide_num=5)
    add_slide_header(slide5, "Literature Review", "Comparative Benchmark")

    # Table of comparison
    rows, cols = 6, 5
    left = Inches(1.0)
    top = Inches(1.8)
    width = Inches(11.333)
    height = Inches(4.7)

    table_shape = slide5.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    # Column widths
    table.columns[0].width = Inches(2.7)
    table.columns[1].width = Inches(2.1)
    table.columns[2].width = Inches(2.1)
    table.columns[3].width = Inches(2.1)
    table.columns[4].width = Inches(2.333)

    headers = ["Evaluation Metric", "Official Portals", "Commercial Portals", "Social Media Groups", "Proposed JNTU Circle"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = TITLE_COLOR if col_idx < 4 else GOLD_ACCENT
        p = cell.text_frame.paragraphs[0]
        p.font.name = "Georgia"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

    data = [
        ("Regulation Filtering (R20/R23)", "Partial / Cluttered", "No / Generic", "Scattered / Unindexed", "✅ Native Regulation Tags"),
        ("Unit-Wise Notes (Units 1-5)", "Not Provided", "Mixed / Paywalled", "Broken Drive Links", "✅ Dedicated Unit Modularity"),
        ("Live University Notice Sync", "Raw PDF Circulars", "Not Available", "Manual Forwarding", "✅ Autonomous Sync Daemon"),
        ("Academic GPA / SGPA Engine", "Not Available", "Generic Percentages", "Not Available", "✅ Official JNTU 10-Pt Scale"),
        ("In-Browser PDF Document Reader", "Download Only", "Paywalled Viewer", "Third-Party App Needed", "✅ Native Zero-Install Reader")
    ]

    for row_idx, row_data in enumerate(data, start=1):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if row_idx % 2 == 0 else RGBColor(248, 245, 240)
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Arial"
            p.font.size = Pt(11)
            p.font.color.rgb = TITLE_COLOR if col_idx == 4 else TEXT_DARK
            if col_idx == 4:
                p.font.bold = True
            p.alignment = PP_ALIGN.CENTER if col_idx > 0 else PP_ALIGN.LEFT

    # =========================================================================
    # SLIDE 6: PROPOSED SYSTEM
    # =========================================================================
    create_two_card_slide(
        "Proposed System",
        "Methodology & Core Pillars",
        "Three-Tier Functional Architecture",
        [
            "Tier 1: Curated Academic Repository — Indexed unit notes (Units 1 to 5), university question papers, lab manuals, and syllabi.",
            "Tier 2: Background Sync Daemon (`jntuaSyncService`) — Automated worker polling university endpoints, filtering B.Tech circulars, and updating MongoDB.",
            "Tier 3: Academic Intelligence & Calculation Engine — Regulation-compliant SGPA/CGPA formulas and automated attendance compliance algorithms.",
            "Tier 4: Student Hub & Administrative Governance — Discussion threads, heart-burst likes, community submissions, and moderation queues."
        ],
        "Key Engineering Innovations",
        [
            "Granular PDF Streaming: Micro-chunked unit delivery so students access only what they need, saving mobile data.",
            "Autonomous Scraping Pipeline: Eliminates manual administrative overhead in republishing official university circulars.",
            "Strict JNTU Grade Point Modeling: O (10), A+ (9), A (8), B+ (7), B (6), C (5), P (4), F (0) with semester-wise presets.",
            "Role-Based Access Control (RBAC): Admin review panel ensuring verified academic quality before public release."
        ],
        slide_idx=6
    )

    # =========================================================================
    # SLIDE 7: SYSTEM ARCHITECTURE
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_slide_layout)
    add_base_decorations(slide7, slide_num=7)
    add_slide_header(slide7, "System Architecture", "End-to-End Microservices Flow")

    arch_cards = [
        ("Presentation Layer", "React 19 + Vite", Inches(1.0), [
            "JntuChatbot Command Bar",
            "Faceted Branch & Semester Filters",
            "Embedded PDF Document Viewer",
            "SGPA/CGPA & Attendance Calculator",
            "Admin Management Dashboard"
        ]),
        ("Application Layer", "Node.js & Express REST API", Inches(4.8), [
            "JWT Authentication & Role Guards",
            "Resource Controllers (CRUD)",
            "Multer Multipart Upload Pipeline",
            "Automated JNTUA Sync Daemon",
            "Rate Limiting & Error Handlers"
        ]),
        ("Data & Services Layer", "MongoDB Atlas & External APIs", Inches(8.6), [
            "MongoDB Atlas Collections",
            "Static Uploads Document Storage",
            "Official University API Endpoint",
            "B.Tech Regex Filter Engine",
            "Indexed Query Optimization"
        ])
    ]

    for title, tech, left_pos, points in arch_cards:
        card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(1.8), Inches(3.7), Inches(4.7))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.margin_top = Inches(0.25)
        ctf.margin_left = Inches(0.2)
        ctf.margin_right = Inches(0.2)

        p0 = ctf.paragraphs[0]
        p0.text = title
        p0.font.name = "Georgia"
        p0.font.size = Pt(16)
        p0.font.bold = True
        p0.font.color.rgb = TITLE_COLOR

        p_tech = ctf.add_paragraph()
        p_tech.text = tech
        p_tech.font.name = "Arial"
        p_tech.font.size = Pt(11)
        p_tech.font.bold = True
        p_tech.font.color.rgb = GOLD_ACCENT
        p_tech.space_after = Pt(12)

        for pt in points:
            p_pt = ctf.add_paragraph()
            p_pt.text = f"• {pt}"
            p_pt.font.name = "Arial"
            p_pt.font.size = Pt(11)
            p_pt.font.color.rgb = TEXT_DARK
            p_pt.space_after = Pt(8)

    # =========================================================================
    # SLIDE 8: KEY FEATURES & DEMONSTRATION
    # =========================================================================
    create_two_card_slide(
        "Key Features & Demonstration",
        "Core Capabilities",
        "Academic Resource Management",
        [
            "Unit 1 to 5 Modular Notes: Displays individual module syllabi, downloadable PDFs, and view counters.",
            "Integrated PDF Document Reader: Read notes directly inside the browser with navigation controls.",
            "Autonomous JNTUA Notification Sync: Scrapes official exams API, isolates B.Tech circulars, and extracts Drive/PDF links.",
            "Executable Lab Manuals: Code snippets, sample test cases, outputs, and viva questions for laboratory exams."
        ],
        "Student Intelligence & Community Tools",
        [
            "Regulation-Compliant GPA Calculator: Preloaded subject credits for AIML, CSE, ECE, MECH, and CIVIL branches.",
            "Attendance Compliance Analyzer: Real-time calculation of safe leaves based on the 75% university rule.",
            "Interactive Student Profile & Reports: Cumulative semester progression table with distinction and rank indicators.",
            "Community Contributions: Students can upload notes with admin moderation queue ensuring academic integrity."
        ],
        slide_idx=8
    )

    # =========================================================================
    # SLIDE 9: IMPLEMENTATION & PROGRESS
    # =========================================================================
    create_two_card_slide(
        "Implementation & Progress",
        "Technical Deliverables",
        "Backend & Database Architecture",
        [
            "8 Mongoose Models: User, Note, Paper, Syllabus, Notification, LabProgram, Comment, and UserMaterial.",
            "10 REST Controllers: Complete CRUD APIs handling file streams, queries, authentication, and stats.",
            "Automated Daemon Service: Cron-like sync service with error fallback handling and duplicate prevention.",
            "Security Implementation: Salted password hashing using bcryptjs and stateless JWT authorization."
        ],
        "Frontend Engineering & UI Metrics",
        [
            "Modern Component Architecture: 40+ modular components and pages built with React 19 and Vite.",
            "CSS Token Design System: Polished glassmorphic aesthetics, fluid responsive layouts, and zero external UI bloat.",
            "Interactive Visual Feedback: Heart-burst physics like animations and animated modal dialogs.",
            "Comprehensive Validation: Tested across mobile, tablet, and desktop environments with sub-100ms load times."
        ],
        slide_idx=9
    )

    # =========================================================================
    # SLIDE 10: FUTURE SCOPE
    # =========================================================================
    create_two_card_slide(
        "Future Scope",
        "Roadmap & Enhancements",
        "AI & Machine Learning Extensions",
        [
            "NLP Question Paper Trend Analyzer: Analyze 5-year past question papers to predict high-probability questions per unit.",
            "RAG-Based AI Study Tutor: Ingest verified unit notes into a localized vector database to provide instant doubt resolution.",
            "Automated Result Aggregator: Scrape semester grade sheets directly via student university hall ticket numbers.",
            "Automated Audio Summaries: Convert text modules into concise 5-minute audio revision podcasts."
        ],
        "Ecosystem & Platform Scaling",
        [
            "WhatsApp & Mobile Push Notifications: Alert students instantly when exam fee circulars or timetables are released.",
            "Multi-University Taxonomy: Generalize database taxonomy to support sister institutions (JNTUK, JNTUH, AU, SVU).",
            "Faculty Evaluation Portal: Allow college professors to upload verified lecture slides and conduct quizzes.",
            "PWA & Offline Mode: Cache visited lecture modules offline using Service Workers for zero-connectivity study."
        ],
        slide_idx=10
    )

    # =========================================================================
    # SLIDE 11: CONCLUSION
    # =========================================================================
    create_two_card_slide(
        "Conclusion",
        "Final Assessment",
        "Project Achievements",
        [
            "Successfully Engineered: Built and verified JNTU Circle as a complete academic resource and intelligence ecosystem.",
            "Eliminated Search Overhead: Transformed hours of scattered resource hunting into single-click branch filtering.",
            "Automated University Notice Delivery: Ensured zero missed exam registration or revaluation deadlines.",
            "Verified Academic Compliance: Provided students with regulation-accurate calculation tools for four-year degree planning."
        ],
        "Key Learnings & Impact",
        [
            "Practical Full-Stack Mastery: Hands-on implementation of decoupled MERN architecture, REST APIs, and daemons.",
            "Real-World Student Value: Solved an authentic, widespread challenge experienced across university engineering colleges.",
            "Scalable & Extensible: Designed with modular architectures ready for future AI/ML analytics integrations.",
            "Demonstrated Engineering Excellence: Proves how clean web engineering directly enhances higher education workflows."
        ],
        slide_idx=11
    )

    # =========================================================================
    # SLIDE 12: THANK YOU & Q&A
    # =========================================================================
    slide12 = prs.slides.add_slide(blank_slide_layout)
    add_base_decorations(slide12, slide_num=12)

    ty_box = slide12.shapes.add_textbox(Inches(1.5), Inches(1.8), Inches(10.333), Inches(4.0))
    ty_tf = ty_box.text_frame
    ty_tf.word_wrap = True

    p_ty0 = ty_tf.paragraphs[0]
    p_ty0.text = "THANK YOU"
    p_ty0.font.name = "Georgia"
    p_ty0.font.size = Pt(44)
    p_ty0.font.bold = True
    p_ty0.font.color.rgb = TITLE_COLOR
    p_ty0.alignment = PP_ALIGN.CENTER

    p_ty1 = ty_tf.add_paragraph()
    p_ty1.text = "Questions & Discussions are Welcome"
    p_ty1.font.name = "Georgia"
    p_ty1.font.size = Pt(20)
    p_ty1.font.italic = True
    p_ty1.font.color.rgb = ACCENT_BROWN
    p_ty1.alignment = PP_ALIGN.CENTER
    p_ty1.space_after = Pt(20)

    # Contact card
    card_ty = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.0), Inches(3.6), Inches(7.333), Inches(2.5))
    card_ty.fill.solid()
    card_ty.fill.fore_color.rgb = CARD_BG
    card_ty.line.color.rgb = CARD_BORDER

    ctf = card_ty.text_frame
    ctf.word_wrap = True
    ctf.margin_top = Inches(0.25)

    p_c1 = ctf.paragraphs[0]
    p_c1.text = "Department of Artificial Intelligence and Machine Learning"
    p_c1.font.name = "Georgia"
    p_c1.font.size = Pt(14)
    p_c1.font.bold = True
    p_c1.font.color.rgb = TITLE_COLOR
    p_c1.alignment = PP_ALIGN.CENTER

    p_c2 = ctf.add_paragraph()
    p_c2.text = "M.S. Engineering College"
    p_c2.font.name = "Georgia"
    p_c2.font.size = Pt(13)
    p_c2.font.color.rgb = ACCENT_BROWN
    p_c2.alignment = PP_ALIGN.CENTER

    p_c3 = ctf.add_paragraph()
    p_c3.text = "Project: JNTU Circle (Andhra Circle) • MERN Full-Stack Portal"
    p_c3.font.name = "Arial"
    p_c3.font.size = Pt(11)
    p_c3.font.italic = True
    p_c3.font.color.rgb = TEXT_MUTED
    p_c3.alignment = PP_ALIGN.CENTER

    # Save presentation
    output_path = os.path.join(os.path.dirname(__file__), "JNTU_Circle_Project_Presentation.pptx")
    prs.save(output_path)
    print(f"Successfully generated PowerPoint presentation at: {output_path}")

if __name__ == "__main__":
    create_deck()
