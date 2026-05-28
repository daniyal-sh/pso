export const navItems = [
  { href: "/", label: "Home" },
  { href: "/olympiads", label: "Olympiads" },
  { href: "/guides", label: "Guides" },
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
    outcomes: ["Model physical systems", "Solve multi-step problems", "Prepare for NSTC and IPhO"],
    topics: ["Kinematics", "Newtonian mechanics", "Energy and momentum", "Electricity", "Optics"],
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    icon: "pi",
    color: "text-emerald",
    gradient: "from-gold/14 to-emerald/8",
    summary: "Proofs, combinatorics, number theory, geometry, and elegant problem solving.",
    exam: "IMO",
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
    outcomes: ["Design efficient algorithms", "Implement with confidence", "Prepare for IOI style contests"],
    topics: ["Graphs", "Dynamic programming", "Data structures", "Greedy methods", "Searching"],
  },
  {
    slug: "biology",
    name: "Biology",
    icon: "dna",
    color: "text-emerald",
    gradient: "from-emerald/12 to-mint",
    summary: "Cells, ecosystems, genetics, physiology, evolution, and living systems.",
    exam: "IBO",
    outcomes: ["Link concepts across systems", "Practice data interpretation", "Prepare for IBO style tasks"],
    topics: ["Cell biology", "Genetics", "Plant physiology", "Ecology", "Evolution"],
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    icon: "flask",
    color: "text-teal",
    gradient: "from-teal/14 to-emerald/8",
    summary: "Reactions, structures, equilibrium, kinetics, and the art of molecules.",
    exam: "IChO",
    outcomes: ["Understand reaction patterns", "Balance theory and lab intuition", "Build IChO readiness"],
    topics: ["Stoichiometry", "Organic reactions", "Thermodynamics", "Equilibria", "Bonding"],
  },
  {
    slug: "astronomy",
    name: "Astronomy",
    icon: "orbit",
    color: "text-purple-600",
    gradient: "from-purple-500/12 to-gold/10",
    summary: "Stars, galaxies, celestial mechanics, observation, and the universe beyond.",
    exam: "IOAA",
    outcomes: ["Read the sky with math", "Use coordinates and telescopes", "Train for IOAA selection"],
    topics: ["Spherical astronomy", "Stellar physics", "Cosmology", "Observation", "Astrophysics"],
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
    slug: "incentives-of-nstc-why-it-is-worth-taking-seriously",
    title: "The Incentives of NSTC: Why It Is Worth Taking Seriously",
    category: "NSTC",
    excerpt:
      "A detailed look at the academic, financial, and career incentives attached to NSTC and the STEM Careers Programme for Pakistani students.",
    date: "May 6, 2026",
    author: "Daniyal Shahzad",
    read: "10 min",
    videoUrl: "",
    videoId: "",
    videoTitle: "",
    content: `Every year, thousands of Pakistani students hear about the National Science Talent Contest (NSTC) as a difficult screening test for science olympiads. That is true, but it is only one part of the story. NSTC is not just another exam. It is one of the few pathways in Pakistan where genuine subject ability can translate into national training, international exposure, admission advantages, fee waivers, stipends, certificates, and cash prizes.

If you are a student who enjoys Mathematics, Physics, Informatics, Biology, Chemistry, or Astronomy, NSTC deserves to be taken seriously. Even if you do not end up representing Pakistan internationally, the incentives around the programme make the attempt valuable.

This post explains those incentives in a practical way, based on the NSTC/STEM Careers Programme announcements shared for NSTC-23.

### 1. Priority Admission Without Entry Test
One of the strongest incentives is priority admission without an entry test in any degree of PIEAS and IST for eligible olympiad achievers.

This matters because university entrance tests in Pakistan are often treated as the single gatekeeper for strong STEM programmes. NSTC gives high-performing students another route: prove your ability through national and international olympiad performance, and that performance can directly support your admission.

For a serious science student, this changes the equation. Preparing for NSTC is not separate from your future. It can become part of the same path: learn deeply, compete nationally, qualify for training, and build a profile that universities recognize.

### 2. Tuition Fee Waivers
The NSTC incentives also include tuition fee waivers. According to the shared announcement, the tuition fee waiver structure is:

- **Gold medal:** 100% waiver
- **Silver medal:** 100% waiver
- **Bronze medal:** 75% waiver
- **Honourable mention:** 50% waiver
- **International participation:** 25% waiver

This is a major incentive because tuition cost is one of the biggest worries for many families. A student who performs well in olympiads is not only rewarded with recognition, but can also reduce the financial pressure of university education.

The important lesson here is simple: academic excellence has real financial value. NSTC gives students a way to convert hard-earned subject mastery into tangible support.

### 3. University Services Waivers
The announcement also mentions waivers for university services, following the same structure:

- **Gold medal:** 100% waiver
- **Silver medal:** 100% waiver
- **Bronze medal:** 75% waiver
- **Honourable mention:** 50% waiver
- **International participation:** 25% waiver

Students often think only about tuition, but university life has many associated costs. Service charges and institutional fees can quietly add up. A waiver here makes the overall package more meaningful.

For families trying to plan realistically, this is the kind of incentive that can make a strong STEM university more accessible.

### 4. Monthly Stipends
For medalists, the incentives go even further. The shared announcement lists monthly stipends in PKR:

- **Gold medal:** Rs. 35,000 per month
- **Silver medal:** Rs. 25,000 per month
- **Bronze medal:** Rs. 20,000 per month

A stipend is different from a one-time prize. It gives continued support. For a student, that can mean money for books, transport, internet, stationery, devices, or simply a bit more independence while studying.

It also sends an important signal: the country should support students who represent it intellectually. Olympiad medalists are not just students who did well on an exam. They are students who trained for months or years and competed on a global academic stage.

### 5. Cash Prizes for International Science Olympiads
NSTC is the selection route toward International Science Olympiads. The shared STEM Careers Programme poster lists the following cash prizes:

- **Gold medal:** Rs. 500,000
- **Silver medal:** Rs. 250,000
- **Bronze medal:** Rs. 100,000
- **Honourable mention:** Rs. 50,000
- **International participation:** Rs. 25,000

These prizes recognize international achievement, but they also motivate students before they reach that stage. A student preparing in 9th, 10th, or 11th grade can see that the effort is not invisible. There is a formal system that rewards excellence.

For many students, that recognition can matter emotionally as much as financially. It tells them that spending evenings on hard problems, reading advanced books, and struggling through difficult concepts is not a waste of time.

### 6. Participation Certificates for Top Students
The announcement also says that the top 500 in each subject will receive participation certificates.

This is important because not every useful outcome requires reaching the international team. If you rank well nationally, you still get a credential that shows serious participation in a competitive STEM programme.

For school records, university applications, scholarships, and future academic opportunities, a strong national-level participation certificate can still be meaningful. It shows that you took initiative beyond the classroom and tested yourself against students from across Pakistan.

### 7. Training by Local and Foreign Experts
Another underrated incentive is training. The poster mentions training by local and foreign experts, with the possibility of participation in international training camps.

This is where NSTC becomes much more than an exam. If you qualify further into the pipeline, you may get access to training that most students in Pakistan never receive in school. You learn from mentors, solve harder problems, attend camps, discuss concepts with peers, and start seeing your subject at a deeper level.

Even students who do not eventually win medals often come out of this process stronger. They become better problem solvers. They learn how to self-study. They become more comfortable with failure and revision. These skills carry over into university, research, engineering, computer science, medicine, and almost any serious career.

### 8. International Representation
The biggest non-financial incentive is the chance to represent Pakistan.

Through NSTC, students can qualify for International Science Olympiads such as:

- International Mathematical Olympiad (IMO)
- International Physics Olympiad (IPhO)
- International Chemistry Olympiad (IChO)
- International Biology Olympiad (IBO)

Representing Pakistan internationally is a rare achievement. It places you in rooms with some of the strongest young STEM students in the world. You see what global excellence looks like. You realize where you stand, where Pakistan stands, and what is possible if students are trained seriously.

That exposure can change your ambitions permanently.

### 9. Undergraduate Scholarship Potential
The poster also mentions that alumni have been able to win undergraduate scholarships in top global institutes such as MIT, Harvard, and Cambridge.

This does not mean NSTC automatically gets you into those universities. It does not. But olympiad preparation and international performance can become a very strong signal of academic ability. Top universities value students who have demonstrated deep independent learning, originality, and problem-solving strength.

For Pakistani students, this is especially important because many schools do not have extensive research programmes, advanced labs, or large extracurricular systems. Olympiads can become a clearer way to show excellence.

### 10. Eligibility Makes It Accessible Early
The NSTC-23 poster lists eligibility for current students of Pre-9th, 9th, 10th, and 11th grade, including Matric, O-Level, F.Sc-I, and A-Level-I students.

It also mentions:

- Aggregate marks of 60% or more in core subjects: Physics, Chemistry, Biology, and Mathematics in the last exam
- Age less than 20 years on June 30, 2027
- Students currently studying F.Sc Part-II, A-Level Part-II, or university are not eligible to apply

The key point is that students should start early. If you wait until the final year, you may simply run out of time. Olympiad preparation compounds. A student who starts in 8th or 9th grade has a much better chance of building the depth required for national camps and international selection.

### 11. The Test Is Held Across Pakistan
The poster lists screening test centers in 19 major cities, including Abbottabad, Bahawalpur, Chitral, D.I. Khan, Faisalabad, Gilgit, Gujranwala, Gujrat, Hyderabad, Islamabad/Rawalpindi, Karachi, Lahore, Multan, Muzaffarabad, Peshawar, Quetta, Sargodha, Sukkur, and Swat.

That geographical spread matters. It means NSTC is not only for students in one or two elite city centers. Students from many regions can at least attempt the screening test and enter the pipeline.

### 12. The Hidden Incentive: You Become Better
The incentives above are attractive, but the hidden incentive is the most important one: preparing for NSTC makes you better.

You learn to read books that are harder than your school syllabus. You learn to sit with a problem for an hour without panicking. You learn that memorization is not enough. You learn to connect ideas. You learn to lose, correct yourself, and try again.

That transformation is valuable even if you do not win a medal.

In Pakistan, many students are trained to chase marks. NSTC pushes you toward mastery. That shift can change the kind of student you become.

### Final Thoughts
NSTC is not easy, and it should not be treated casually. But the incentives are real: priority admission, fee waivers, service waivers, stipends, cash prizes, certificates, expert training, international exposure, and a stronger academic profile.

If you are eligible, interested in STEM, and willing to work seriously, NSTC is one of the best opportunities available to Pakistani students.

Do not think of it only as an exam. Think of it as a door. Even if you do not walk all the way to an international medal, preparing for it can still move you far ahead of where you started.`,
  },
  {
    slug: "breaking-the-code-how-to-get-into-mit-from-pakistan",
    title: "Breaking the Code: How to Get Into MIT from Pakistan",
    category: "MIT Admissions",
    excerpt:
      "Bilal Asmatullah shares a Pakistan-focused roadmap for MIT admissions, financial aid, Olympiads, and pushing through self-doubt.",
    date: "May 6, 2026",
    author: "Bilal Asmatullah",
    read: "7 min",
    videoUrl: "https://youtu.be/HUaxLlnfL6c",
    videoId: "HUaxLlnfL6c",
    videoTitle: "How to get into MIT from Pakistan",
    content: `Assalam o Alaikum! My name is Bilal Asmatullah. A few years ago, I was sitting exactly where many of you might be sitting right now: dreaming big but unsure of the path forward. In 2023, I became the only Pakistani to get accepted into the Massachusetts Institute of Technology (MIT) for the Class of 2027.

I recently uploaded a video to guide Pakistani students on how to get into MIT. I made it for students who are currently in the same shoes I was in three or four years ago. If I had seen a video like this back then, it would have been incredibly helpful.

You can watch the full video below, where I break down the roadmap, the mindset you need, and the reality of financial aid.

### 1. Finances Are NOT a Barrier
One of the biggest misconceptions is that you need to come from a highly privileged financial background or attend elite schools with massive tuition fees to get into a top-tier US college. The short answer is: **No, you don't.** Even if your family's income is less than Rs. 100,000 per month, it is entirely possible to get into MIT [00:01:12].

MIT is need-blind and meets 100% of your financial need. When I got in, MIT's financial aid covered my tuition, books, laptop, flights, and food. All you need is competence, a desk, a chair, and a relentless spirit of hard work [00:09:28].

### 2. The Ultimate Secret: International Science Olympiads
You might hear that extracurricular activities like debating or starting a charity are the way to go. While those are great, there is one extracurricular that stands head and shoulders above the rest for MIT admissions.

Currently, there are four Pakistani students at MIT, including myself, and every single one of us has one thing in common: **we are all alumni of the International Science Olympiads** [00:02:47]. Much like athletes go to the Olympics, the best high school minds compete globally in subjects like Physics, Mathematics, Chemistry, Biology, and Informatics.

I personally represented Pakistan and won a bronze medal at the International Physics Olympiad [00:03:40]. If you can reach the top 5 in Pakistan for your chosen subject and win a medal internationally, your chances of getting into MIT skyrocket. In Pakistan, selection happens through the National Science Talent Contest (NSTC) organized by HEC, and I highly encourage you to register and compete.

### 3. Focus on Growth, Not Just the End Goal
I'll be honest: the probability of getting into MIT is very low, and you shouldn't do Olympiads *just* to get in [00:13:05]. When I started preparing, I studied deeply for a year and a half. Even if I had not gotten into MIT, the grueling preparation for the Physics Olympiad would have still put me leagues ahead of an average high school student.

The knowledge and resilience you gain during this process are invaluable [00:13:59].

### 4. Overcome Self-Doubt
Self-doubt will always exist. I remember taking my first screening test and feeling devastated, thinking I would not even make the top 50 in Pakistan [00:12:13]. Even days before my MIT application was due, I second-guessed myself. I took a gap year and faced some incredibly hard times.

But remember: the night is always darkest just before the dawn [00:18:06]. Right before you achieve something massive, you will face extreme self-doubt. That is exactly when you need to push through.

### Let's Connect
The world is designed to reward competence, not just money or connections. If you have the drive, people will believe in you, whether that is MIT giving you a full ride or, in my recent case, investors giving me funding to leave MIT and build a startup [00:16:19].

I highly recommend watching the full video above for a detailed breakdown of the Olympiad selection stages and application fee waivers. If you have specific questions or disagree with anything I said, please leave a comment on the video. I will do my best to clarify your doubts.

Dream big and work hard. Allah Hafiz!`,
  },
  {
    slug: "how-olympiads-got-me-from-pakistan-to-mit",
    title: "How Olympiads Got Me From Pakistan to MIT",
    category: "Olympiads",
    excerpt:
      "Talha reflects on IPhO, MIT, self-learning, and why Pakistani students should start exploring math and physics early.",
    date: "May 6, 2026",
    author: "Talha",
    read: "8 min",
    videoUrl: "https://youtu.be/JR3UOxz7qR4",
    videoId: "JR3UOxz7qR4",
    videoTitle: "How Olympiads Got Me From Pakistan to MIT",
    content: `Hi, Asalamu Alaikum! I'm Talha. I represented Pakistan at the 2024 International Physics Olympiad (IPhO), where I won a bronze medal. Today, I'm in my second semester at MIT, studying physics as an undergraduate.

Sitting here at what is arguably the best university in the world for physics, I realize I am in an incredibly privileged position. But I also realize how far behind we are as a country when it comes to nurturing STEM talent. That is why I sat down to record a deeply personal, 35-minute video.

I want to demystify Science Olympiads, encourage younger students to self-learn, and talk directly to parents about how we view education in Pakistan. You can watch the full video below.

### 1. It's About Problem-Solving, Not Just College Admissions
My friend Bilal recently made a great video on how International Science Olympiads, like Physics, Math, Chemistry, Biology, and Informatics, are the ultimate golden ticket for top-tier university admissions. I won't repeat that here. Currently, there are four Pakistani undergrads at MIT, and all four of us are Olympiad medalists. MIT loves Olympiads.

But the *inherent* value is what I really care about. Preparing for an Olympiad teaches you to tackle incredibly tricky, creative problems every single day. It forces you to read complex textbooks completely on your own, without a teacher holding your hand.

Whether you make it to the international stage or just participate nationally, the analytical skills you build will put you miles ahead of your peers in whatever career you choose.

### 2. Don't Wait for Your School to Teach You
I was a good student getting good grades up to the 8th grade, but I was bored. So I started reading pop science articles, which eventually gave me the courage to pick up old 2002 A-Level Physics and Math textbooks. I studied them on my own throughout 9th grade simply because it was fun.

The standard school curriculum in Pakistan is not rigorous enough to prepare you for global competition. If you are good at a subject, **do not wait for the school curriculum to dictate your pace.** If you can get ahead, stay ahead. Spend just 30 minutes to an hour a day exploring textbooks outside your syllabus.

### 3. A Direct Message to Parents: Let Them Explore
In Pakistani society, there is a massive stigma where parents suppress their children's curiosities to force them down the stable paths of engineering or pre-med. I absolutely understand where parents are coming from: you want your kids to be financially secure.

But success is not binary. There are countless productive fields that pay well. If your child is spending their free time studying a high-level math textbook or preparing for an Olympiad instead of studying for tomorrow's school quiz, **please don't be mad at them for learning.**

Encourage them to build their mental capacity in the things that naturally allure them. Allow them the space to find the intersection between a subject they genuinely love and a career that provides a good life.

### 4. Start as Early as Possible
I did not discover the Olympiad pipeline until the end of 11th grade. By international standards, that is ridiculously late. When I got to MIT and talked to my Russian and Chinese peers, I realized their governments invest millions of dollars to put kids in intensive Olympiad training camps for years.

If you are a younger student in 6th, 7th, or 8th grade, do not think you have to finish high school physics before you give the Olympiad screening tests a try. Go pay the 800-rupee fee and sit for the exam. Even if you struggle, you will get a feel for the format and put yourself in the pipeline.

The younger you start, the more years you have to practice, compound your knowledge, and actually reach the international level.

### 5. Join PakSolve
Because I want to actively help change our culture, I'm teaming up with other MIT students to launch **PakSolve**.

This is a program designed specifically for younger students in Pakistan, from middle school up through pre-A-Levels or FSc, who have a budding interest in math or physics. We will be providing direct instruction over the summer to help you discover just how fun self-learning can be, and to hopefully build a new generation of confident problem solvers and Olympiad competitors.

If we want to stop being the odd country out, while India, China, and Iran sweep gold medals every year, we have to start valuing intellectual curiosity outside the classroom.

Explore what you love, start self-learning today, and apply to PakSolve!`,
  },
];

export const alumniStories = [
  {
    name: "Bilal Asmatullah",
    achievement: "MIT Class of 2027",
    subject: "Physics",
    location: "Cambridge, Massachusetts",
    quote: "Finances are not the barrier many students imagine. Competence, hard work, and the right preparation path matter.",
    role: "IPhO bronze medalist",
  },
  {
    name: "Talha",
    achievement: "IPhO Bronze 2024",
    subject: "Physics",
    location: "Cambridge, Massachusetts",
    quote: "Olympiad preparation is valuable because it teaches you to self-learn and solve hard, creative problems.",
    role: "MIT physics undergraduate",
  },
];
