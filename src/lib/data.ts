export const navItems = [
  { href: "/", label: "Home" },
  { href: "/olympiads", label: "Olympiads" },
  { href: "/guides", label: "Guides" },
  { href: "/resources", label: "Resources" },
  { href: "/question-bank", label: "Question Bank" },
  { href: "/past-papers", label: "Past Papers" },
  { href: "/blog", label: "Blog" },
  { href: "/alumni", label: "Alumni" },
  { href: "/about", label: "About" },
];

export const tracks = [
  {
    slug: "physics",
    name: "Physics",
    icon: "atom",
    color: "text-blue-600",
    gradient: "from-blue-500/12 to-teal/10",
    summary: "Mechanics, electromagnetism, waves, thermodynamics, and modern physics.",
    exam: "IPhO",
    stats: ["8.2K learners", "420 resources", "1,250 questions"],
    outcomes: ["Model physical systems", "Solve multi-step problems", "Prepare for NSTC and IPhO"],
    topics: ["Kinematics", "Newtonian mechanics", "Energy and momentum", "Electricity", "Optics"],
  },
  {
    slug: "astronomy",
    name: "Astronomy",
    icon: "orbit",
    color: "text-purple-600",
    gradient: "from-purple-500/12 to-gold/10",
    summary: "Stars, galaxies, celestial mechanics, observation, and the universe beyond.",
    exam: "IOAA",
    stats: ["3.6K learners", "180 resources", "740 questions"],
    outcomes: ["Read the sky with math", "Use coordinates and telescopes", "Train for IOAA selection"],
    topics: ["Spherical astronomy", "Stellar physics", "Cosmology", "Observation", "Astrophysics"],
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    icon: "flask",
    color: "text-teal",
    gradient: "from-teal/14 to-emerald/8",
    summary: "Reactions, structures, equilibrium, kinetics, and the art of molecules.",
    exam: "IChO",
    stats: ["5.9K learners", "300 resources", "1,040 questions"],
    outcomes: ["Understand reaction patterns", "Balance theory and lab intuition", "Build IChO readiness"],
    topics: ["Stoichiometry", "Organic reactions", "Thermodynamics", "Equilibria", "Bonding"],
  },
  {
    slug: "biology",
    name: "Biology",
    icon: "dna",
    color: "text-emerald",
    gradient: "from-emerald/12 to-mint",
    summary: "Cells, ecosystems, genetics, physiology, evolution, and living systems.",
    exam: "IBO",
    stats: ["4.8K learners", "220 resources", "910 questions"],
    outcomes: ["Link concepts across systems", "Practice data interpretation", "Prepare for IBO style tasks"],
    topics: ["Cell biology", "Genetics", "Plant physiology", "Ecology", "Evolution"],
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    icon: "pi",
    color: "text-emerald",
    gradient: "from-gold/14 to-emerald/8",
    summary: "Proofs, combinatorics, number theory, geometry, and elegant problem solving.",
    exam: "IMO",
    stats: ["9.1K learners", "380 resources", "1,400 questions"],
    outcomes: ["Write rigorous proofs", "Spot hidden structure", "Train for IMO selection"],
    topics: ["Number theory", "Geometry", "Combinatorics", "Algebra", "Inequalities"],
  },
  {
    slug: "informatics",
    name: "Informatics",
    icon: "code",
    color: "text-blue-700",
    gradient: "from-blue-500/10 to-emerald/10",
    summary: "Algorithms, logic, data structures, programming contests, and computational thinking.",
    exam: "IOI",
    stats: ["6.4K learners", "260 resources", "1,120 questions"],
    outcomes: ["Design efficient algorithms", "Implement with confidence", "Prepare for IOI style contests"],
    topics: ["Graphs", "Dynamic programming", "Data structures", "Greedy methods", "Searching"],
  },
];

export const pathwaySteps = [
  {
    title: "NSTC Screening Test",
    copy: "Take the first step and qualify for NSTC.",
    icon: "clipboard",
  },
  {
    title: "NSTC Training",
    copy: "Learn with mentors, camps, and practice sets.",
    icon: "book",
  },
  {
    title: "Pre-Selection Test",
    copy: "Top performers move closer to the team.",
    icon: "medal",
  },
  {
    title: "Training Camps",
    copy: "Advanced problem solving, lectures, and mock tests.",
    icon: "tent",
  },
  {
    title: "International Team",
    copy: "Represent Pakistan on the world stage.",
    icon: "flag",
  },
];

export const platformStats = [
  { label: "Resources", value: "1,250+", icon: "book-open" },
  { label: "Solved Questions", value: "85,000+", icon: "clipboard-check" },
  { label: "Contributors", value: "250+", icon: "users" },
  { label: "Students", value: "20,000+", icon: "graduation-cap" },
  { label: "Olympiad Alumni", value: "250+", icon: "sparkles" },
  { label: "Medals Won", value: "150+", icon: "trophy" },
];

export const featuredResources = [
  {
    title: "Guide to IPhO through NSTC",
    category: "Featured Guide",
    description: "Daniyal Shahzad's full Pakistan IPhO selection and preparation guide.",
    href: "/guides/guide-to-ipho-through-nstc",
    icon: "rocket",
    tone: "dark",
  },
  {
    title: "MCQ Practice",
    category: "Practice",
    description: "Topic-wise MCQs with detailed solutions and progress signals.",
    href: "/question-bank",
    icon: "list-checks",
    tone: "mint",
  },
  {
    title: "Past Papers",
    category: "Archive",
    description: "Collections from NSTC and international olympiads.",
    href: "/past-papers",
    icon: "file-text",
    tone: "cool",
  },
  {
    title: "Long Problems",
    category: "Deep Work",
    description: "Challenging problems with hints and structured solutions.",
    href: "/question-bank",
    icon: "activity",
    tone: "gold",
  },
  {
    title: "Preparation Roadmaps",
    category: "Roadmaps",
    description: "Subject-wise routes to plan your olympiad year.",
    href: "/guides",
    icon: "route",
    tone: "teal",
  },
] as const;

export const guideCards = [
  {
    slug: "general-nstc-paper-format-and-strategy",
    title: "NSTC Paper Format and Attempt Strategy",
    category: "General",
    description: "Understand common MCQs, subject MCQs, and descriptive sections.",
    readTime: "12 min",
    level: "Beginner",
  },
  {
    slug: "guide-to-ipho-through-nstc",
    title: "Guide to IPhO through NSTC",
    category: "Physics",
    description: "Use calculus mechanics notes, MCQs, and long problems in stages.",
    readTime: "14 min",
    level: "Intermediate",
  },
  {
    slug: "ioaa-pakistan-guide",
    title: "IOAA Pakistan Guide",
    category: "Astronomy",
    description: "A Pakistan-focused astronomy and astrophysics preparation path.",
    readTime: "18 min",
    level: "Advanced",
  },
];

export const downloadableResources = [
  "Physical Constants Sheet (2024)",
  "Olympiad Math Formula Sheet",
  "Periodic Table (Printable)",
  "IPhO Experimental Data Booklet",
  "Important Derivations (Physics)",
];

export const recommendedBooks = [
  { title: "Problems in General Physics", author: "I. E. Irodov", tag: "Highly Recommended" },
  { title: "Introduction to Mathematical Olympiad", author: "Titu Andreescu", tag: "Highly Recommended" },
  { title: "Organic Chemistry", author: "Clayden, Greeves, Warren", tag: "Highly Recommended" },
  { title: "Algorithms", author: "Sedgewick and Wayne", tag: "Highly Recommended" },
];

export const blogPosts = [
  {
    slug: "how-to-get-started-with-astronomy-olympiad",
    title: "How to Get Started with Astronomy Olympiad",
    category: "Astronomy",
    excerpt: "A calm first plan for students discovering IOAA preparation.",
    date: "May 12, 2024",
    author: "Zainab R.",
    read: "6 min",
  },
  {
    slug: "effective-problem-solving-strategies-for-ipho",
    title: "Effective Problem Solving Strategies for IPhO",
    category: "Physics",
    excerpt: "How to move from formulas to models, estimates, and clean reasoning.",
    date: "May 5, 2024",
    author: "Huzaifa A.",
    read: "8 min",
  },
  {
    slug: "important-organic-reactions-for-icho",
    title: "Important Organic Reactions for IChO",
    category: "Chemistry",
    excerpt: "Patterns that make advanced organic chemistry less mysterious.",
    date: "Apr 28, 2024",
    author: "Sara Khan",
    read: "7 min",
  },
  {
    slug: "ibo-guide-key-topics-and-preparation-tips",
    title: "IBO Guide: Key Topics and Preparation Tips",
    category: "Biology",
    excerpt: "A practical map through cells, genetics, physiology, and ecology.",
    date: "Apr 20, 2024",
    author: "Hassan Ali",
    read: "5 min",
  },
  {
    slug: "roadmap-to-ioi-resources-and-practice-plan",
    title: "Roadmap to IOI: Resources and Practice Plan",
    category: "Informatics",
    excerpt: "A staged plan from syntax comfort to full contest stamina.",
    date: "Apr 14, 2024",
    author: "M. Abdullah",
    read: "9 min",
  },
];

export const alumniStories = [
  {
    name: "Ahmad Raza",
    achievement: "IMO Gold 2023",
    subject: "Mathematics",
    location: "Chiba, Japan",
    quote: "Pakistan Olympiads gave me the foundation and confidence to compete with the world's best.",
    role: "Gold Medalist",
  },
  {
    name: "Fatima Noor",
    achievement: "IPhO Silver 2022",
    subject: "Physics",
    location: "Zurich, Switzerland",
    quote: "Endless problem solving, mentor guidance, and a community that never stops believing in you.",
    role: "Silver Medalist",
  },
  {
    name: "Hassan Ali",
    achievement: "IBO Bronze 2021",
    subject: "Biology",
    location: "Lisbon, Portugal",
    quote: "From a curious camper to an international medalist, this journey changed my life.",
    role: "Bronze Medalist",
  },
  {
    name: "Zainab Fatima",
    achievement: "IOAA Gold 2022",
    subject: "Astronomy",
    location: "Colombo, Sri Lanka",
    quote: "The night-sky conversations at camp sparked a lifelong passion for astronomy.",
    role: "Gold Medalist",
  },
  {
    name: "M. Abdullah",
    achievement: "Honor USACO 2023",
    subject: "Informatics",
    location: "USA",
    quote: "The problem-solving mindset I built here helped me excel in computer science.",
    role: "Honorable Mention",
  },
];

export const questionTopics = [
  { title: "Kinematics", subject: "Physics", questions: "1,250", attempts: "18.7K", average: "2.6", icon: "running" },
  { title: "Waves", subject: "Physics", questions: "980", attempts: "12.1K", average: "2.4", icon: "waves" },
  { title: "Stoichiometry", subject: "Chemistry", questions: "1,180", attempts: "15.3K", average: "2.7", icon: "flask" },
  { title: "Number Theory", subject: "Mathematics", questions: "1,420", attempts: "22.6K", average: "2.8", icon: "pi" },
  { title: "Cell Biology", subject: "Biology", questions: "1,050", attempts: "9.8K", average: "2.5", icon: "dna" },
  { title: "Basic Algorithms", subject: "Informatics", questions: "860", attempts: "8.2K", average: "2.3", icon: "code" },
];

export const sampleQuestions = [
  {
    id: "738452",
    subject: "Physics",
    topic: "Kinematics",
    difficulty: "Medium",
    exam: "NSTC",
    prompt:
      "A particle moves in a straight line with position x(t) = 4t^3 - 12t^2 + 9t + 2 in meters, where t is in seconds. What is the acceleration at t = 2 seconds?",
    options: ["30 m/s^2", "24 m/s^2", "18 m/s^2", "12 m/s^2"],
    answer: 1,
    solution:
      "Differentiate position twice. Velocity is 12t^2 - 24t + 9, so acceleration is 24t - 24. At t = 2, acceleration is 24 m/s^2.",
  },
  {
    id: "640118",
    subject: "Chemistry",
    topic: "Stoichiometry",
    difficulty: "Easy",
    exam: "NSTC",
    prompt:
      "How many moles of oxygen are required to completely burn 2 moles of methane?",
    options: ["1 mol", "2 mol", "4 mol", "8 mol"],
    answer: 2,
    solution: "CH4 + 2O2 -> CO2 + 2H2O, so 2 moles of CH4 require 4 moles of O2.",
  },
];

export const pastPaperQuestion = {
  id: 13,
  exam: "NSTC",
  year: "2023",
  subject: "Physics",
  difficulty: "Medium",
  marks: 4,
  type: "Single Correct",
  prompt:
    "A uniform solid sphere of mass M and radius R is released from rest at the top of an inclined plane of height H and inclination theta. The sphere rolls down the incline without slipping.",
  ask: "Which expression gives the translational kinetic energy of the sphere when it reaches the bottom of the incline?",
  options: ["1/2 MgH sin^2 theta", "5/7 MgH", "2/7 MgH", "1/2 MgH cos^2 theta"],
  answer: 1,
  solution:
    "For rolling without slipping, potential energy MgH becomes translational plus rotational energy. For a solid sphere, I = 2/5 MR^2 and omega = v/R. Solving MgH = 1/2 Mv^2 + 1/2 I omega^2 gives translational kinetic energy 5/7 MgH.",
};

export const adminRows = [
  { title: "How to Get Started with Astronomy Olympiad", type: "Guide", author: "Zainab R.", status: "Published", date: "May 12, 2024", views: "1.2K" },
  { title: "Effective Problem Solving Strategies for IPhO", type: "Post", author: "Huzaifa A.", status: "Review", date: "May 11, 2024", views: "850" },
  { title: "IPhO 2023 Theoretical Paper", type: "Past Paper", author: "M. Abdullah", status: "Published", date: "May 10, 2024", views: "2.3K" },
  { title: "Organic Reactions for IChO", type: "Guide", author: "Sara Khan", status: "Draft", date: "May 9, 2024", views: "120" },
  { title: "Math Olympiad Problem Set #12", type: "Question Set", author: "Ali Raza", status: "Review", date: "May 9, 2024", views: "540" },
];
