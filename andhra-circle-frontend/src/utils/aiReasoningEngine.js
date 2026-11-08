/**
 * JNTU Circle AI Conversational & Academic Reasoning Engine
 * Provides intelligent, authoritative, and direct responses to every student query,
 * spanning conversational chit-chat, engineering concepts, study strategies, and dynamic synthesis.
 */

// =========================================================================
// 1. CONVERSATIONAL & ASSISTANT IDENTITY HANDLER
// =========================================================
export function getConversationalAnswer(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  const q = rawQuery.toLowerCase().trim();

  // Greetings & Pleasantries
  if (
    /^(?:hi|hello|hey|namaste|hola|yo|sup|good\s*(?:morning|afternoon|evening)|howdy)\b/i.test(q) ||
    q === "hi" || q === "hello" || q === "hey"
  ) {
    return {
      text:
        `Hello! 👋 I am your **JNTU AI Academic Assistant**, built specifically for JNTUA students.\n\n` +
        `I can instantly help you with:\n` +
        `• **Verified Study Resources:** Lecture notes, previous question papers (PYQs), official syllabus copies, and lab program codes.\n` +
        `• **University Regulations:** 80:20 mid marks calculation, CGPA to percentage, attendance criteria, credit detention, and grace marks.\n` +
        `• **Engineering Concepts:** Clear explanations for CS, IT, AIML, ECE, EEE, Mechanical, and Civil subjects.\n` +
        `• **Tools:** Interactive CGPA & SGPA calculators and personalized Student Profiles.\n\n` +
        `What would you like to explore today?`,
      suggestions: [
        "📊 CGPA Calculator",
        "📘 Data Structures Notes",
        "📝 Mid Exam 80:20 Rule",
        "🗓️ CSE 2-1 Subjects",
        "🚀 Build Student Profile"
      ],
      action: { label: "Explore Full Academic Catalog →", path: "/notes" },
    };
  }

  // Identity / About JNTU Circle
  if (
    /who are you|what is jntu circle|who created you|who made this|about jntu circle|what can you do|your name|tell me about yourself/i.test(q)
  ) {
    return {
      text:
        `**JNTU Circle** is Andhra Pradesh's premier centralized academic hub dedicated to empowering engineering students under **JNTU Anantapur (JNTUA)** and affiliated colleges.\n\n` +
        `**What I can do for you:**\n` +
        `• 📚 **Academic Content:** Fast access to verified lecture notes, 5-year semester-end question papers, and lab manuals across R23, R20, and R19 regulations.\n` +
        `• ⚡ **Automated Calculators:** Instant SGPA/CGPA evaluation and percentage converters mapped to JNTUA 10-point scale.\n` +
        `• 🎓 **Regulations Guide:** Clear, official answers on attendance condonation, detention criteria, 80:20 mid evaluation, and degree credits.\n` +
        `• 🔍 **Voice & Text Search:** Instant retrieval by branch, subject name, semester, or topic.\n\n` +
        `How can I assist your engineering journey today?`,
      suggestions: [
        "📊 CGPA to Percentage",
        "📘 Browse Notes",
        "📝 Question Papers",
        "📋 Attendance Rules",
        "🚀 Build Student Profile"
      ],
      action: { label: "Open Student Profile →", path: "/profile" },
    };
  }

  // Gratitude & Politeness
  if (/^(?:thank you|thanks|tq|thx|thank u|appreciate it|great job|well done)\b/i.test(q)) {
    return {
      text:
        `You're very welcome! 😊 Glad I could assist you. If you have any more questions about your subjects, exams, or university regulations, feel free to ask anytime. Best of luck with your academics! 🎓`,
      suggestions: ["📊 CGPA Calculator", "📘 Browse Notes", "📝 Previous Papers", "🚀 Build Student Profile"],
    };
  }

  // Acknowledgement / Affirmation
  if (/^(?:ok|okay|cool|awesome|great|super|nice|got it|understood|fine|alright)\b/i.test(q)) {
    return {
      text:
        `Great! Let me know if you need lecture notes, previous question papers, lab programs, or want to check your CGPA. What topic are you studying next?`,
      suggestions: ["📘 Data Structures Notes", "💻 Python Lab Programs", "📊 CGPA Calculator", "📜 JNTU Regulations"],
    };
  }

  // Farewells
  if (/^(?:bye|goodbye|cya|see you|good night|take care)\b/i.test(q)) {
    return {
      text:
        `Goodbye and have a wonderful day ahead! Keep learning, stay curious, and ace your semester exams with JNTU Circle. See you soon! 🚀`,
      suggestions: ["📘 Notes", "📊 CGPA Calculator", "📝 Question Papers"],
    };
  }

  // Help & Instructions
  if (/^(?:help|how to use|guide|features|instructions|what to ask)\b/i.test(q)) {
    return {
      text:
        `Here is a quick guide on how to get the most out of JNTU Circle:\n\n` +
        `1. **Search Study Materials:** Enter any subject name or code (e.g. *"Data Structures Notes"*, *"Python Lab Manual"*, *"Operating Systems Papers"*).\n` +
        `2. **Check University Rules:** Ask about regulations (e.g. *"how mid marks calculated"*, *"attendance condonation"*, *"credit detention"*, *"grace marks"*).\n` +
        `3. **View Semester Curriculums:** Type your branch and semester (e.g. *"CSE 2-1 subjects"*, *"AIML 2-2 curriculum"*).\n` +
        `4. **Calculate Grades:** Type *"CGPA calculator"* or *"8.5 CGPA to percentage"*.\n` +
        `5. **Voice Search:** Tap the yellow microphone icon anytime to speak your question!`,
      suggestions: ["📊 CGPA Calculator", "📘 CSE Notes", "📝 Mid Exam 80:20 Rule", "🚀 Build Student Profile"],
      action: { label: "Browse Full Notes Catalog →", path: "/notes" },
    };
  }

  return null;
}

// =========================================================================
// 2. CORE ENGINEERING CONCEPTS & SUBJECT EXPLAINER HANDLER
// =========================================================
export function getSubjectConceptAnswer(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  const q = rawQuery.toLowerCase().trim();

  // --- COMPUTER SCIENCE, IT & AIML CONCEPTS ---

  // Operating Systems (OS)
  if (/operating system|what is os\b|deadlock|cpu scheduling|paging|virtual memory|semaphores/i.test(q)) {
    return {
      text:
        `**Operating System (OS)** acts as an intermediary between the computer hardware and user applications, managing hardware resources efficiently.\n\n` +
        `**Key Core Modules in JNTU Curriculum:**\n` +
        `• **Process Management:** Process states, PCB, threads, and CPU scheduling algorithms (FCFS, SJF, Priority, Round Robin).\n` +
        `• **Process Synchronization:** Race conditions, Critical Section problem, Semaphores, and Peterson's algorithm.\n` +
        `• **Deadlocks:** 4 Coffman conditions (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait), Banker's Algorithm for avoidance, and detection.\n` +
        `• **Memory Management:** Contiguous allocation, Paging, Segmentation, and Virtual Memory (Demand Paging, FIFO, LRU, Optimal page replacement).\n` +
        `• **File & Storage Systems:** Disk scheduling algorithms (FCFS, SSTF, SCAN, C-SCAN, LOOK).`,
      action: { label: "Download Operating Systems Notes →", path: "/search?query=Operating+Systems" },
      suggestions: ["📘 Operating Systems Notes", "📝 OS Previous Papers", "💻 OS Lab Programs"],
    };
  }

  // Database Management Systems (DBMS)
  if (/dbms|database management|what is database|acid propert|normalization|sql query|er diagram|relational model/i.test(q)) {
    return {
      text:
        `**Database Management System (DBMS)** is software designed to store, manage, retrieve, and manipulate structured data reliably.\n\n` +
        `**Key Concepts & JNTU Exam Focus:**\n` +
        `• **ACID Properties:** **A**tomicity (all or none), **C**onsistency (valid state), **I**solation (concurrent independence), **D**urability (persisted).\n` +
        `• **Normalization:** Eliminating redundancy and anomalies through 1NF (atomic values), 2NF (remove partial dependencies), 3NF (remove transitive dependencies), and BCNF.\n` +
        `• **SQL Commands:** DDL (CREATE, ALTER, DROP), DML (SELECT, INSERT, UPDATE, DELETE), DCL (GRANT, REVOKE), and TCL (COMMIT, ROLLBACK).\n` +
        `• **Transaction Processing:** Concurrency control, serializability, lock-based protocols (2-Phase Locking), and deadlocks.\n` +
        `• **ER Modeling:** Entity sets, attributes, primary & foreign keys, relationships, and ER-to-Relational schema mapping.`,
      action: { label: "Download DBMS Lecture Notes →", path: "/search?query=Database+Management+Systems" },
      suggestions: ["📘 DBMS Complete Notes", "📝 DBMS Question Papers", "💻 SQL Lab Queries"],
    };
  }

  // Data Structures & Algorithms (DSA)
  if (/data structure|what is ds\b|linked list|stack|queue|binary tree|binary search tree|graph traversal|dynamic programming|sorting algorithm/i.test(q)) {
    return {
      text:
        `**Data Structures** organize and store data for efficient access and modification, forming the backbone of all software systems.\n\n` +
        `**Essential Categories:**\n` +
        `• **Linear Structures:**\n` +
        `  - **Arrays:** Contiguous memory, $O(1)$ random access, fixed capacity.\n` +
        `  - **Linked Lists:** Dynamic sizing, node-based pointer chains (Singly, Doubly, Circular).\n` +
        `  - **Stacks:** LIFO (Last In, First Out) principle — applications in recursion, expression evaluation, and undo operations.\n` +
        `  - **Queues:** FIFO (First In, First Out) principle — Linear Queue, Circular Queue, Priority Queue, and Deque.\n` +
        `• **Non-Linear Structures:**\n` +
        `  - **Trees:** Hierarchical storage, Binary Search Trees (BST), AVL balanced trees, and B-Trees for database indexing.\n` +
        `  - **Graphs:** Vertices and Edges, BFS (Queue-based level traversal), DFS (Stack-based depth traversal), Dijkstra's shortest path, and MST (Prim's & Kruskal's).\n` +
        `• **Asymptotic Analysis:** Big-$O$, $\\Omega$, and $\\Theta$ notations for time and space complexity evaluation.`,
      action: { label: "Download Data Structures Notes →", path: "/search?query=Data+Structures" },
      suggestions: ["📘 Data Structures Notes", "💻 DS Lab Programs C/Python", "📝 DS Question Papers"],
    };
  }

  // Artificial Intelligence & Machine Learning (AIML)
  if (/artificial intelligence|machine learning|what is ml\b|supervised learning|unsupervised learning|neural network|deep learning|linear regression/i.test(q)) {
    return {
      text:
        `**Artificial Intelligence (AI) & Machine Learning (ML)** enable computational systems to learn patterns from historical data and make autonomous decisions.\n\n` +
        `**Key Learning Paradigms:**\n` +
        `• **Supervised Learning:** Trained on labeled data for predictive tasks.\n` +
        `  - *Regression:* Linear Regression, Polynomial Regression (continuous target values).\n` +
        `  - *Classification:* Logistic Regression, Decision Trees, Random Forest, Support Vector Machines (SVM), Naive Bayes.\n` +
        `• **Unsupervised Learning:** Discovers hidden patterns in unlabeled data.\n` +
        `  - *Clustering:* K-Means, Hierarchical Clustering, DBSCAN.\n` +
        `  - *Dimensionality Reduction:* Principal Component Analysis (PCA).\n` +
        `• **Neural Networks & Deep Learning:** Multilayer Perceptrons (MLP), Backpropagation, Convolutional Neural Networks (CNNs for computer vision), and Recurrent Neural Networks (RNNs / Transformers for NLP).\n` +
        `• **Model Evaluation:** Confusion Matrix, Precision, Recall, F1-Score, ROC-AUC, and Cross-Validation.`,
      action: { label: "Download Machine Learning Notes →", path: "/search?query=Machine+Learning" },
      suggestions: ["📘 Machine Learning Notes", "💻 Python AIML Lab Manual", "🗓️ AIML 2-2 Curriculum"],
    };
  }

  // Computer Networks (CN)
  if (/computer network|osi model|tcp ip|osi layers|ip addressing|subnetting|routing algorithm|dns|http/i.test(q)) {
    return {
      text:
        `**Computer Networks** interconnect autonomous computing devices to exchange data and share resources over communication channels.\n\n` +
        `**The 7-Layer OSI Architecture:**\n` +
        `1. **Physical:** Transmission of raw bit streams over cables / wireless.\n` +
        `2. **Data Link:** Framing, error control (CRC, Hamming code), and flow control (Stop-and-Wait, Sliding Window).\n` +
        `3. **Network:** Logical addressing (IPv4/IPv6), subnetting, and routing (Distance Vector, Link State).\n` +
        `4. **Transport:** End-to-end reliability, segmenting, TCP (connection-oriented) vs UDP (connectionless).\n` +
        `5. **Session:** Dialogue control, token management, and checkpointing.\n` +
        `6. **Presentation:** Data formatting, encryption/decryption, and compression.\n` +
        `7. **Application:** User interfaces and network services (HTTP, HTTPS, FTP, DNS, SMTP).`,
      action: { label: "Download Computer Networks Notes →", path: "/search?query=Computer+Networks" },
      suggestions: ["📘 Computer Networks Notes", "📝 CN Question Papers", "💻 Socket Programming Lab"],
    };
  }

  // Object-Oriented Programming (OOP / Java / Python / C++)
  if (/object oriented|what is oop|polymorphism|inheritance|encapsulation|abstraction|java programming|python programming/i.test(q)) {
    return {
      text:
        `**Object-Oriented Programming (OOP)** organizes software design around data objects rather than functions and logic.\n\n` +
        `**The 4 Pillars of OOP:**\n` +
        `• **Encapsulation:** Bundling data (variables) and methods (functions) inside a class while restricting direct access using access modifiers (\`private\`, \`protected\`, \`public\`).\n` +
        `• **Abstraction:** Hiding complex implementation details and exposing only the essential interface (via abstract classes and interfaces).\n` +
        `• **Inheritance:** Enabling a new class (subclass/child) to inherit fields and methods from an existing class (superclass/parent) for code reusability.\n` +
        `• **Polymorphism:** *"Many forms"* — Compile-time (Method Overloading) and Runtime (Method Overriding via dynamic method dispatch).\n\n` +
        `In JNTU examinations, Java and Python are standard course subjects covering exception handling, multi-threading, collections, and I/O streams.`,
      action: { label: "Download OOP & Java Notes →", path: "/search?query=Java" },
      suggestions: ["📘 Java Programming Notes", "📘 Python Notes", "💻 Java Lab Programs"],
    };
  }

  // --- ECE & ELECTRICAL (EEE) CONCEPTS ---

  // Digital Logic Design (DLD)
  if (/digital logic|dld|boolean algebra|k map|karnaugh map|flip flop|multiplexer|counter|combinational circuit/i.test(q)) {
    return {
      text:
        `**Digital Logic Design (DLD)** is the foundation of digital computers, microprocessors, and embedded systems.\n\n` +
        `**Core Topics in JNTU Syllabus:**\n` +
        `• **Number Systems:** Binary, Octal, Hexadecimal, 1's and 2's complement arithmetic.\n` +
        `• **Boolean Algebra:** Logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR), De Morgan's Laws, SOP and POS canonical forms.\n` +
        `• **Gate Minimization:** 2, 3, 4, and 5-variable Karnaugh Maps (K-Maps), Don't Care conditions, and Quine-McCluskey tabular method.\n` +
        `• **Combinational Circuits:** Half/Full Adders, Subtractors, Encoders, Decoders, Multiplexers (MUX), and Demultiplexers.\n` +
        `• **Sequential Circuits:** Latches vs Flip-Flops (SR, JK, D, T), Master-Slave configuration, Shift Registers, and Synchronous/Asynchronous Counters.`,
      action: { label: "Download Digital Logic Design Notes →", path: "/search?query=Digital+Logic+Design" },
      suggestions: ["📘 DLD Complete Notes", "📝 DLD Question Papers", "💻 DLD Lab Programs"],
    };
  }

  // Electronic Devices & Circuits (EDC)
  if (/electronic devices|edc|zener diode|bjt|transistor|mosfet|pn junction|biasing|amplifier/i.test(q)) {
    return {
      text:
        `**Electronic Devices & Circuits (EDC)** explores semiconductor physics and the operation of foundational electronic hardware components.\n\n` +
        `**Core Topics in JNTU Syllabus:**\n` +
        `• **Semiconductor Diodes:** PN junction physics, forward/reverse bias, V-I characteristics, breakdown mechanisms (Avalanche vs Zener breakdown), and diode clipping/clamping circuits.\n` +
        `• **Rectifiers:** Half-wave, Full-wave center-tapped, and Bridge rectifiers with capacitor filters; ripple factor and efficiency calculations.\n` +
        `• **Bipolar Junction Transistors (BJT):** NPN and PNP configurations (CB, CE, CC), input/output characteristics, active/cutoff/saturation regions, and DC biasing (Fixed bias, Collector-to-Base, Voltage Divider bias).\n` +
        `• **Field Effect Transistors (FET):** JFET and MOSFET (Depletion & Enhancement modes), pinch-off voltage, and transfer characteristics.\n` +
        `• **Small Signal Amplifiers:** h-parameter analysis and frequency response.`,
      action: { label: "Download EDC Lecture Notes →", path: "/search?query=Electronic+Devices" },
      suggestions: ["📘 EDC Complete Notes", "📝 EDC Question Papers", "💻 EDC Lab Manual"],
    };
  }

  // Basic Electrical & Electronics Engineering (BEEE)
  if (/beee|basic electrical|ohm.*law|kirchhoff|kvl|kcl|transformer|dc motor|induction motor/i.test(q)) {
    return {
      text:
        `**Basic Electrical & Electronics Engineering (BEEE)** introduces fundamental electrical circuits, theorems, and electromagnetic machinery.\n\n` +
        `**Key Core Principles:**\n` +
        `• **Ohm's Law:** Voltage is directly proportional to current at constant temperature ($V = I \\times R$).\n` +
        `• **Kirchhoff's Laws:**\n` +
        `  - **KCL (Current Law):** Sum of currents entering a node equals sum leaving (Conservation of Charge).\n` +
        `  - **KVL (Voltage Law):** Algebraic sum of voltages around any closed loop is zero (Conservation of Energy).\n` +
        `• **Network Theorems:** Thevenin's, Norton's, Maximum Power Transfer, and Superposition theorems.\n` +
        `• **AC Circuits:** Sinusoidal waveforms, RMS & average values, power factor, impedance, and resonance.\n` +
        `• **Electrical Machines:** Single-phase transformers (EMF equation, losses, regulation) and DC/Induction motor principles.`,
      action: { label: "Download BEEE Lecture Notes →", path: "/search?query=BEEE" },
      suggestions: ["📘 BEEE Lecture Notes", "📝 BEEE Question Papers", "💻 Electrical Lab Manual"],
    };
  }

  // --- MECHANICAL & CIVIL CONCEPTS ---

  // Thermodynamics & Engineering Mechanics
  if (/thermodynamics|laws of thermodynamics|carnot cycle|heat engine|entropy|mechanics of solids|stress and strain|bernoulli/i.test(q)) {
    return {
      text:
        `**Mechanical Engineering Fundamentals (Thermodynamics & Solid Mechanics):**\n\n` +
        `• **Laws of Thermodynamics:**\n` +
        `  - *Zeroth Law:* Thermal equilibrium and temperature measurement.\n` +
        `  - *First Law:* Conservation of energy ($dQ = dU + dW$).\n` +
        `  - *Second Law:* Clausius & Kelvin-Planck statements; entropy of an isolated system always increases.\n` +
        `  - *Carnot Cycle:* Maximum theoretical efficiency of heat engines ($\\eta = 1 - T_L/T_H$).\n` +
        `• **Mechanics of Solids (Strength of Materials):**\n` +
        `  - *Stress & Strain:* Tensile, compressive, shear, and Hooke's Law within elastic limit ($E = \\sigma / \\epsilon$).\n` +
        `  - *Bending Equation:* $M/I = \\sigma/y = E/R$ for structural beams.\n` +
        `  - *Fluid Mechanics:* Bernoulli's principle expressing conservation of mechanical energy in ideal flowing fluids.`,
      action: { label: "Download Mechanical Notes →", path: "/search?query=Thermodynamics" },
      suggestions: ["📘 Thermodynamics Notes", "📘 Engineering Mechanics Notes", "📝 ME Question Papers"],
    };
  }

  return null;
}

// =========================================================================
// 3. STUDY STRATEGY, EXAM TIPS & CAREER ADVICE HANDLER
// =========================================================
export function getStudyAdviceAnswer(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  const q = rawQuery.toLowerCase().trim();

  // How to prepare for semester exams / Score 9+ CGPA
  if (/how to (?:study|prepare|pass|score|get 9|get high|clear)|study tips|exam strategy|last night preparation|how to prepare for semester/i.test(q)) {
    return {
      text:
        `🎯 **Strategic Blueprint to Score 8.5+ to 9.0+ CGPA in JNTUA Semester Exams:**\n\n` +
        `1. **Master the Unit-Wise Blueprint (5-Unit Syllabus):**\n` +
        `   - JNTUA external question papers allocate equal weightage across all 5 units.\n` +
        `   - Pick your strongest 3 units and master 100% of the derivations, diagrams, and numerical problems.\n` +
        `2. **Solve 5 Previous Years' Question Papers (PYQs):**\n` +
        `   - 60% to 70% of theoretical concepts and question patterns repeat across R23, R20, and R19 cycles.\n` +
        `   - Practice writing answers under 3-hour timed conditions.\n` +
        `3. **Maximize Mid-Exam Scores (30 Internal Marks):**\n` +
        `   - Because of JNTUA's **80:20 rule**, scoring high (27+) in your best mid-term virtually guarantees an 'A+' or 'O' grade with a normal external mark.\n` +
        `4. **Presentation Standards in Answer Booklets:**\n` +
        `   - Begin every answer with a bold heading, a neat pencil diagram or flow chart, and numbered key points.\n` +
        `   - Underline key formulas and final answers with units.\n` +
        `5. **Clear Attendance Benchmark:**\n` +
        `   - Maintain strictly above 75% aggregate attendance to avoid condonation fees or academic detention.`,
      action: { label: "Open Previous Question Papers Portal →", path: "/papers" },
      suggestions: ["📝 Browse Question Papers", "📊 CGPA Calculator", "📘 Browse Notes", "🚀 Build Student Profile"],
    };
  }

  // How to clear backlogs quickly
  if (/how to clear backlog|clear backlogs|backlog preparation|backlog study plan|arrears clearance/i.test(q)) {
    return {
      text:
        `💡 **Proven 4-Step Strategy to Clear JNTUA Backlogs on the Next Attempt:**\n\n` +
        `1. **Focus Exclusively on the 70-Mark External:**\n` +
        `   - Your regular internal marks (CIE out of 30) are already carried forward.\n` +
        `   - You need exactly **25 marks out of 70 (35%)** in the semester external exam, and combined aggregate of at least **40 / 100**.\n` +
        `2. **Select the 3 Highest-Yield Units:**\n` +
        `   - Analyze past 3 question papers for that subject to identify recurring topics.\n` +
        `   - Perfect 3 complete units thoroughly rather than skimming all 5.\n` +
        `3. **Diagrams & Step-by-Step Derivations:**\n` +
        `   - Evaluators award partial marks for neat circuit diagrams, flowcharts, logic equations, and algorithms even if final numerical steps differ.\n` +
        `4. **Write Structured Long Answers First:**\n` +
        `   - Attempt Part-B questions with clear headings, steps, and formulas before tackling short questions.`,
      action: { label: "Find Previous Question Papers →", path: "/papers" },
      suggestions: ["📝 Question Papers", "📊 Grade Scale", "📋 Regulation Rules"],
    };
  }

  // Campus Placements & Coding Career Roadmap
  if (/placement preparation|how to get placement|campus placement tips|how to learn coding|coding roadmap|internship guidance|mini project ideas/i.test(q)) {
    return {
      text:
        `🚀 **Complete Campus Placements & Tech Career Roadmap for Engineering Students:**\n\n` +
        `• **1st & 2nd Year (Foundations):**\n` +
        `  - Master one primary programming language deeply (C++, Java, or Python).\n` +
        `  - Study Data Structures & Algorithms (Arrays, Linked Lists, Trees, Stacks, Queues).\n` +
        `  - Maintain CGPA $\\ge 7.5$ with **zero active backlogs** (vital for company eligibility).\n` +
        `• **3rd Year (Specialization & Projects):**\n` +
        `  - Solve 150+ problems on LeetCode / HackerRank (Focus on Two Pointers, Trees, Graphs, Dynamic Programming).\n` +
        `  - Build 2 full-stack or domain-specific projects (e.g. MERN stack, AI/ML models, IoT systems, or Android apps) and host on GitHub.\n` +
        `  - Complete mandatory AICTE / APSCHE virtual internships.\n` +
        `• **4th Year (Cracking Placement Drives):**\n` +
        `  - CS Fundamentals: Prepare Operating Systems, DBMS (SQL queries), Computer Networks, and OOP.\n` +
        `  - Aptitude & Communication: Practice quantitative aptitude, logical reasoning, and mock HR/technical interviews.`,
      action: { label: "Open CGPA & SGPA Calculator →", path: "/calculator" },
      suggestions: ["📘 Data Structures Notes", "📊 Placement Eligibility Rules", "🚀 Build Student Profile"],
    };
  }

  return null;
}

// =========================================================================
// 4. DYNAMIC ACADEMIC INTELLIGENCE SYNTHESIZER
// Guarantees an intelligent, structured response for EVERY arbitrary query,
// completely eliminating the "No exact records found" fallback!
// =========================================================
export function synthesizeDynamicAcademicResponse(rawQuery, searchRes) {
  const q = (rawQuery || "").trim();
  const lowerQ = q.toLowerCase();

  // If search yielded partial matches, prioritize them
  const hasMatched = searchRes && searchRes.results && searchRes.results.length > 0;
  if (hasMatched) {
    const topItems = searchRes.results.slice(0, 5);
    return {
      text:
        `Here are verified JNTU academic materials & resources matching **"${q}"**:\n\n` +
        `Each resource contains verified syllabus mapping, lecture units, and examination blueprints for semester preparation.`,
      matchedResources: topItems,
      relatedSubjects: searchRes.relatedSubjects,
      action: {
        label: `View all ${searchRes.results.length} results in Catalog →`,
        path: `/search?query=${encodeURIComponent(q)}`,
      },
      suggestions: searchRes.suggestedQueries && searchRes.suggestedQueries.length > 0
        ? searchRes.suggestedQueries
        : ["Notes", "Question Papers", "Syllabus Copy", "Lab Programs"],
    };
  }

  // Synthesize an insightful academic response tailored to the student's keywords
  const title = q.length > 30 ? q.slice(0, 30) + "..." : q;
  const relatedSubs = searchRes && searchRes.relatedSubjects && searchRes.relatedSubjects.length > 0
    ? searchRes.relatedSubjects.slice(0, 4)
    : ["Computer Science", "Artificial Intelligence", "Electronics & Communication", "Electrical Engineering"];

  return {
    text:
      `### Academic Overview: "${title}"\n\n` +
      `Here is key academic guidance and curriculum alignment for your inquiry under **JNTUA Academic Regulations**:\n\n` +
      `• **Curriculum Context:** For semester-end preparation, ensure you cross-reference this topic with the official **R23/R20 Regulation Course Structure** to cover all 5 units systematically.\n` +
      `• **Examination Strategy:** Review the past 5 years' question papers to recognize recurring question patterns, typical 14-mark descriptive questions, and short-answer concepts.\n` +
      `• **Verified Resources:** You can access verified lecture notes, question banks, and syllabus copies directly in our digital academic repositories below.`,
    relatedSubjects: relatedSubs,
    action: {
      label: `Search "${title}" in Full Academic Catalog →`,
      path: `/search?query=${encodeURIComponent(q)}`,
    },
    suggestions: [
      "📘 Browse All Notes",
      "📝 Previous Question Papers",
      "📚 Official Syllabus",
      "📊 CGPA Calculator",
      "🚀 Build Student Profile",
    ],
  };
}

