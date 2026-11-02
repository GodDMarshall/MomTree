// Treatment content. Written as patient education in plain language, avoiding outcome promises.
// Every entry is status "pending" until the clinic's medical team approves it (see APPROVAL-CHECKLIST).

import type { ReviewStatus } from "@/lib/review";

export type TreatmentGroup = "understand" | "assist" | "laboratory" | "surgery" | "male" | "third-party";

export const treatmentGroups: { id: TreatmentGroup; label: string; blurb: string }[] = [
  { id: "understand", label: "Understanding", blurb: "Finding out what is happening, and why." },
  { id: "assist", label: "Assisted conception", blurb: "Helping conception happen inside the body." },
  { id: "laboratory", label: "In the laboratory", blurb: "IVF and the techniques around it." },
  { id: "surgery", label: "Surgery", blurb: "Looking at, and treating, the reproductive organs." },
  { id: "male", label: "Male fertility", blurb: "Half of the picture, assessed from day one." },
  { id: "third-party", label: "Donation, banking & surrogacy", blurb: "Within India's ART and Surrogacy Acts." },
];

export type Step = { title: string; text: string };
export type QA = { q: string; a: string };

export type Treatment = {
  slug: string;
  n: number;
  name: string;
  /** Full name when the display name is an abbreviation. */
  longName?: string;
  group: TreatmentGroup;
  short: string;
  summary: string;
  atAGlance: { label: string; value: string }[];
  whatItIs: string[];
  whoMayBeEvaluated: string[];
  howItWorks: Step[];
  whatToExpect: string[];
  risks: string[];
  faqs: QA[];
  related: string[];
  photo?: { src: string; alt: string; caption: string; width: number; height: number };
  /** Claims that need specific confirmation from the clinic before launch. */
  verify?: string[];
  review: ReviewStatus;
};

const L = "/legacy/2024/08";

export const treatments: Treatment[] = [
  {
    slug: "fertility-evaluation",
    n: 1,
    name: "Fertility evaluation",
    group: "understand",
    short: "A complete picture of both partners' fertility, before any treatment is chosen.",
    summary:
      "Every journey at Momtree begins with understanding. A fertility evaluation looks at both partners together, so that anything we suggest is based on your own results rather than assumptions.",
    atAGlance: [
      { label: "Who", value: "Both partners" },
      { label: "Setting", value: "Outpatient" },
      { label: "Usually includes", value: "Consultation, blood tests, ultrasound, semen analysis" },
    ],
    whatItIs: [
      "A fertility evaluation is a structured set of consultations and tests that looks at the main factors involved in conceiving: ovulation, the egg reserve, the uterus and fallopian tubes, and sperm health.",
      "It is not a single test, and it does not predict whether you will conceive. Its purpose is to identify what may be helping or getting in the way, so that the next steps can be discussed with you clearly.",
    ],
    whoMayBeEvaluated: [
      "Couples who have been trying to conceive for 12 months, or for 6 months if the woman is 35 or older",
      "Anyone with irregular, very painful or absent periods",
      "People with a known condition such as PCOS, endometriosis, thyroid disease, or previous pelvic surgery or infection",
      "Men with a history of testicular problems, surgery or treatment that can affect sperm",
      "Couples who have experienced more than one pregnancy loss",
      "Anyone who simply wants to understand their fertility before planning",
    ],
    howItWorks: [
      { title: "Consultation", text: "A detailed conversation about medical history, cycles, previous pregnancies, lifestyle and any earlier tests or treatment. Please bring all previous reports." },
      { title: "Hormone and blood tests", text: "Usually including a test of ovarian reserve (such as AMH), thyroid function and other hormones, timed to your cycle where needed." },
      { title: "Pelvic ultrasound", text: "A transvaginal scan to look at the uterus, the ovaries and the number of resting (antral) follicles." },
      { title: "Tubal assessment", text: "Where needed, a test to check whether the fallopian tubes are open, such as a hysterosalpingogram (HSG) or a contrast ultrasound." },
      { title: "Semen analysis", text: "A laboratory assessment of sperm count, movement and shape, using World Health Organization methods. A second sample is sometimes advised." },
      { title: "Review and plan", text: "We go through every result with you, explain what it means, and discuss the options, which may include no treatment at all." },
    ],
    whatToExpect: [
      "Some tests depend on the day of your cycle, so the evaluation may take place over more than one visit.",
      "Blood tests and ultrasound take only a few minutes each.",
      "A tubal test can cause period-like cramping for a short time.",
      "You will receive a clear explanation of your results and copies of your reports.",
    ],
    risks: [
      "Blood tests and ultrasound carry very little risk.",
      "Tubal tests can cause temporary cramping and, rarely, infection or a reaction to the contrast used.",
      "Tests give information, not certainty. Some couples have no cause identified (unexplained infertility), and normal results do not guarantee conception.",
    ],
    faqs: [
      { q: "Do both partners need to come?", a: "Ideally, yes. Male factors contribute to a significant share of fertility problems, so evaluating both partners from the start avoids delays." },
      { q: "Do I need to fast for the blood tests?", a: "Usually not, but some tests have to be done on particular days of the menstrual cycle. Our team will tell you exactly when and how to prepare when you book." },
      { q: "Will the evaluation tell us our chances of pregnancy?", a: "It helps your doctor understand the factors involved and discuss realistic options. No test can predict an individual outcome with certainty." },
    ],
    related: ["ultrasound", "andrology", "ovulation-induction"],
    photo: { src: `${L}/06.jpg`, alt: "The entrance corridor at Momtree IVF, Vijayanagar, with a living green wall", caption: "Your first visit: the clinic, Vijayanagar", width: 1600, height: 900 },
    review: "pending",
  },
  {
    slug: "ovulation-induction",
    n: 3,
    name: "Ovulation induction & cycle monitoring",
    group: "assist",
    short: "Medicines and careful scans to support regular, well-timed ovulation.",
    summary:
      "When ovulation is irregular or absent, carefully dosed medication can help one or two eggs mature. Ultrasound monitoring through the cycle keeps the treatment safe and well timed.",
    atAGlance: [
      { label: "Setting", value: "Outpatient" },
      { label: "Monitoring", value: "Transvaginal ultrasound, sometimes blood tests" },
      { label: "Often combined with", value: "Timed intercourse or IUI" },
    ],
    whatItIs: [
      "Ovulation induction uses medicines, usually tablets such as letrozole or clomiphene, or in some cases low-dose hormone injections, to help the ovaries develop and release a mature egg.",
      "Cycle monitoring follows that development with ultrasound scans, so the dose can be adjusted and ovulation can be timed for intercourse or for an IUI.",
    ],
    whoMayBeEvaluated: [
      "Women who ovulate irregularly or not at all, for example with polycystic ovary syndrome (PCOS)",
      "Some couples with unexplained infertility, usually together with IUI",
      "People whose evaluation shows open fallopian tubes and sperm suitable for natural conception or IUI",
    ],
    howItWorks: [
      { title: "Baseline scan", text: "Early in the cycle, a scan checks the ovaries and the lining of the uterus before medication begins." },
      { title: "Medication", text: "Tablets for a few days, or daily injections, at a dose chosen for you." },
      { title: "Follicle tracking", text: "Scans every few days measure the growing follicles and the lining of the uterus." },
      { title: "Trigger and timing", text: "When a follicle is mature, an injection may be given to time ovulation, followed by intercourse or IUI on the advised days." },
      { title: "Pregnancy test", text: "About two weeks later, if a period has not started." },
    ],
    whatToExpect: [
      "Each scan is short and done in the clinic.",
      "Some people notice hot flushes, mood changes, headaches or bloating with the medicines.",
      "If too many follicles develop, the cycle may be cancelled to reduce the risk of a multiple pregnancy.",
    ],
    risks: [
      "Multiple pregnancy (twins or more), especially with injections. Monitoring is designed to reduce this risk.",
      "Ovarian hyperstimulation syndrome (OHSS), which is uncommon with tablets and more likely with injections.",
      "Not every cycle results in ovulation or pregnancy, and several cycles are often needed.",
    ],
    faqs: [
      { q: "How many cycles are usually tried?", a: "It depends on age, diagnosis and how you respond. Your doctor will discuss a limited number of monitored cycles and when it would make sense to consider another approach." },
      { q: "Why do I need scans if I am only taking tablets?", a: "Scans show how many follicles are growing and when ovulation is likely. That makes treatment safer and better timed." },
      { q: "Is ovulation induction the same as IVF?", a: "No. With ovulation induction, fertilisation happens naturally inside the body. In IVF, eggs are collected and fertilised in the laboratory." },
    ],
    related: ["iui", "ultrasound", "fertility-evaluation"],
    review: "pending",
  },
  {
    slug: "iui",
    n: 4,
    name: "IUI",
    longName: "Intrauterine insemination",
    group: "assist",
    short: "Prepared sperm placed directly in the uterus at the time of ovulation.",
    summary:
      "In IUI, a washed and concentrated sample of sperm is placed directly into the uterus around the time of ovulation, shortening the distance sperm need to travel. The procedure itself takes only a few minutes.",
    atAGlance: [
      { label: "Procedure time", value: "A few minutes" },
      { label: "Anaesthesia", value: "Not usually needed" },
      { label: "Setting", value: "Outpatient" },
    ],
    whatItIs: [
      "Intrauterine insemination is a form of assisted conception in which prepared sperm is passed through the cervix into the uterus using a fine, soft catheter. Fertilisation then takes place naturally, inside the body.",
      "IUI can be done in a natural cycle or combined with ovulation induction. At least one fallopian tube must be open.",
    ],
    whoMayBeEvaluated: [
      "Couples with mild problems with sperm count or movement",
      "Unexplained infertility, usually with ovulation induction",
      "Difficulties with intercourse or ejaculation",
      "Treatment with donor sperm, within the ART (Regulation) Act, 2021",
      "Ovulation disorders, together with ovulation-inducing medicines",
    ],
    howItWorks: [
      { title: "Monitoring", text: "Scans follow the growing follicle, with or without medication." },
      { title: "Timing", text: "A trigger injection may be used, and the IUI is planned around the expected ovulation." },
      { title: "Sperm preparation", text: "On the day, the semen sample is washed and concentrated in the andrology laboratory. This usually takes one to two hours." },
      { title: "Insemination", text: "The prepared sperm is placed in the uterus through a thin catheter. Most people say it feels similar to a cervical smear test." },
      { title: "Afterwards", text: "You can usually return to normal activities the same day. A pregnancy test is done about two weeks later." },
    ],
    whatToExpect: [
      "Mild cramping or light spotting afterwards is common and settles quickly.",
      "There is no need for prolonged bed rest after the procedure.",
      "The male partner provides a sample on the day, usually after a few days of abstinence, as the laboratory advises.",
    ],
    risks: [
      "Mild discomfort, cramping or spotting.",
      "Infection, which is rare.",
      "Multiple pregnancy and OHSS when fertility medicines are used.",
      "IUI is not suitable when both tubes are blocked or when sperm problems are severe. In these situations IVF or ICSI may be discussed.",
    ],
    faqs: [
      { q: "Does IUI hurt?", a: "Most people feel little more than mild pressure or cramping for a few minutes. Anaesthesia is not usually needed." },
      { q: "How is IUI different from IVF?", a: "In IUI, fertilisation happens inside the body. In IVF, eggs are collected and fertilised in the laboratory before an embryo is transferred." },
      { q: "Can we try IUI more than once?", a: "Yes, several cycles are often considered. Your doctor will discuss how many attempts make sense for you before reviewing other options." },
    ],
    related: ["ovulation-induction", "andrology", "ivf"],
    review: "pending",
  },
  {
    slug: "ivf",
    n: 5,
    name: "IVF",
    longName: "In vitro fertilisation",
    group: "laboratory",
    short: "Eggs and sperm brought together in the laboratory, and an embryo returned to the uterus.",
    summary:
      "In IVF, eggs are collected from the ovaries and fertilised with sperm in the embryology laboratory. Embryos are cultured and observed by embryologists, and one is transferred to the uterus at the right moment.",
    atAGlance: [
      { label: "Stimulation", value: "About 8–14 days of injections" },
      { label: "Egg collection", value: "Under sedation or anaesthesia, usually 15–30 minutes" },
      { label: "Embryo culture", value: "3–6 days" },
    ],
    whatItIs: [
      "In vitro fertilisation means fertilisation that takes place outside the body, in a carefully controlled laboratory. It allows embryologists to see each stage that would normally be hidden: the egg, fertilisation and the first days of development.",
      "IVF is not a single procedure but a sequence of steps, each planned around your own results. ICSI, blastocyst culture and embryo freezing are techniques that may form part of an IVF cycle.",
    ],
    whoMayBeEvaluated: [
      "Blocked or damaged fallopian tubes",
      "Endometriosis",
      "Reduced ovarian reserve",
      "Significant male-factor infertility, often with ICSI",
      "Unexplained infertility after other treatments",
      "Ovulation disorders that have not responded to simpler treatment",
      "Fertility preservation or embryo testing, after counselling",
    ],
    howItWorks: [
      { title: "Ovarian stimulation", text: "Daily hormone injections for roughly 8–14 days help several follicles grow. Scans and blood tests guide the dose." },
      { title: "Trigger", text: "A final injection matures the eggs, and egg collection is timed about 34–36 hours later." },
      { title: "Egg collection", text: "Under sedation or anaesthesia, a fine needle guided by ultrasound collects eggs from the follicles. You usually go home the same day." },
      { title: "Fertilisation", text: "The same day, eggs are placed with prepared sperm (conventional IVF) or injected individually (ICSI). The next morning, embryologists check for signs of fertilisation." },
      { title: "Embryo culture", text: "Embryos develop in incubators that hold temperature, gases and humidity steady, and are assessed at set times for 3–6 days." },
      { title: "Embryo transfer", text: "A selected embryo is placed in the uterus with a soft catheter under ultrasound guidance. Suitable remaining embryos can be frozen." },
      { title: "Pregnancy test", text: "A blood test is done about two weeks after egg collection." },
    ],
    whatToExpect: [
      "Stimulation involves frequent clinic visits for scans.",
      "Bloating and tenderness are common during stimulation and after egg collection.",
      "Not every egg will be mature, not every egg will fertilise, and not every embryo will continue to develop. This is part of normal biology, and we will explain each stage as it happens.",
      "The emotional side matters too. Please talk to us about how you are feeling at any stage.",
    ],
    risks: [
      "Ovarian hyperstimulation syndrome (OHSS). Stimulation protocols and monitoring aim to minimise it.",
      "Egg collection: bleeding, infection or injury to nearby organs are uncommon.",
      "Multiple pregnancy if more than one embryo is transferred. Single embryo transfer reduces this risk.",
      "Ectopic pregnancy remains possible after IVF.",
      "Outcomes vary widely with age, the cause of infertility and embryo development. IVF cannot guarantee pregnancy.",
    ],
    faqs: [
      { q: "How long does one IVF cycle take?", a: "From the start of stimulation to the pregnancy test is usually about four to six weeks, plus preparation time before. Frozen embryo transfers follow their own timeline." },
      { q: "Is egg collection painful?", a: "It is done under sedation or anaesthesia, so you should not feel pain during the procedure. Some cramping afterwards is common and usually settles within a day or two." },
      { q: "How many embryos will be transferred?", a: "Usually one. Transferring a single embryo greatly reduces the risk of twins or triplets for mother and babies. Your doctor will discuss this with you, within the limits set by Indian law." },
    ],
    related: ["icsi", "blastocyst-culture", "laser-assisted-hatching"],
    photo: { src: "/clinic/02-lab.jpg", alt: "An embryologist working at a micromanipulation microscope in the Momtree embryology laboratory", caption: "Embryology laboratory, Momtree", width: 1600, height: 755 },
    review: "pending",
  },
  {
    slug: "icsi",
    n: 6,
    name: "ICSI",
    longName: "Intracytoplasmic sperm injection",
    group: "laboratory",
    short: "A single sperm injected into each mature egg by an embryologist.",
    summary:
      "ICSI is a laboratory technique used within IVF. Instead of letting sperm reach the egg on their own, an embryologist selects a single sperm and injects it directly into each mature egg with a fine glass needle.",
    atAGlance: [
      { label: "Part of", value: "An IVF cycle" },
      { label: "Performed by", value: "An embryologist, at a micromanipulation workstation" },
      { label: "Fertilisation check", value: "The next morning" },
    ],
    whatItIs: [
      "In conventional IVF, many prepared sperm are placed with each egg and fertilisation happens on its own. In ICSI, the cells surrounding each egg are gently removed, mature eggs are identified, and one sperm is injected into the centre of each egg.",
      "ICSI is done at a micromanipulation workstation: a microscope with very fine controls that hold the egg steady with one pipette while a second, finer needle places the sperm.",
    ],
    whoMayBeEvaluated: [
      "Low sperm count, poor movement or abnormal shape",
      "Sperm retrieved surgically, or limited frozen samples",
      "Low or failed fertilisation in a previous IVF cycle",
      "Some situations involving embryo testing or frozen eggs",
    ],
    howItWorks: [
      { title: "Egg collection", text: "As in IVF." },
      { title: "Preparation", text: "The cells surrounding each egg are removed so the embryologist can see whether it is mature." },
      { title: "Selection", text: "A single, moving sperm of normal appearance is chosen for each mature egg." },
      { title: "Injection", text: "The egg is held gently with a holding pipette while the sperm is injected through the outer shell into the cytoplasm." },
      { title: "Fertilisation check", text: "About 16–18 hours later, embryologists look for two pronuclei, the first sign of normal fertilisation." },
    ],
    whatToExpect: [
      "For you, an ICSI cycle feels the same as IVF. The difference happens in the laboratory.",
      "Only mature eggs can be injected, so the number injected may be lower than the number collected.",
    ],
    risks: [
      "A small number of eggs may be damaged by the injection.",
      "Fertilisation is not guaranteed, even with ICSI.",
      "Some studies report a small increase in certain risks for children conceived by ICSI, which may partly relate to the underlying cause of infertility. Your doctor can explain what this means for you.",
      "ICSI is not routinely needed when sperm is normal. It is recommended on the basis of your results.",
    ],
    faqs: [
      { q: "Does ICSI improve success compared with IVF?", a: "ICSI helps when sperm or fertilisation is the problem. When sperm is normal it has not been shown to improve outcomes, so it is recommended for specific reasons." },
      { q: "Can the embryologist choose the 'best' sperm?", a: "They select a moving sperm of normal appearance under high magnification. This improves the chance of fertilisation, but it cannot assess genetic quality." },
      { q: "Is ICSI a separate treatment from IVF?", a: "No. It is a fertilisation technique used within an IVF cycle." },
    ],
    related: ["ivf", "andrology", "blastocyst-culture"],
    photo: { src: `${L}/03.jpg`, alt: "The micromanipulators of the ICSI workstation in the Momtree laboratory", caption: "The micromanipulation workstation used for ICSI", width: 1600, height: 900 },
    review: "pending",
  },
  {
    slug: "blastocyst-culture",
    n: 7,
    name: "Blastocyst culture",
    group: "laboratory",
    short: "Embryos cultured to day five or six, their most developed stage before transfer.",
    summary:
      "In blastocyst culture, embryos continue to grow in the laboratory until day five or six. By then they have two distinct groups of cells, and embryologists have more information for choosing an embryo to transfer.",
    atAGlance: [
      { label: "Culture length", value: "5–6 days" },
      { label: "Assessed by", value: "Embryologists, at set times" },
      { label: "Often allows", value: "Single embryo transfer" },
    ],
    whatItIs: [
      "A blastocyst is an embryo that has developed for about five to six days after fertilisation. It has a fluid-filled cavity, an inner cell mass (which may become the baby) and an outer layer of cells (which may become the placenta).",
      "Culturing embryos to this stage lets embryologists see which embryos continue to develop, and helps when choosing a single embryo for transfer or freezing.",
    ],
    whoMayBeEvaluated: [
      "IVF and ICSI cycles with several good-quality embryos on day 2–3",
      "When single embryo transfer is planned",
      "When embryos are to be frozen or tested",
    ],
    howItWorks: [
      { title: "Day 1", text: "Fertilisation is confirmed by the presence of two pronuclei." },
      { title: "Days 2–3", text: "The embryo divides into two to four cells, then about eight." },
      { title: "Day 4", text: "The cells draw tightly together into a morula." },
      { title: "Days 5–6", text: "A cavity forms and the embryo becomes a blastocyst. Embryologists assess its expansion and its two cell groups." },
      { title: "Transfer or freezing", text: "A blastocyst can be transferred fresh, or frozen by vitrification for a later transfer." },
    ],
    whatToExpect: [
      "Your embryologist or doctor will update you on how your embryos are developing.",
      "It is normal for some embryos to stop developing before day 5. This is part of natural embryo development.",
    ],
    risks: [
      "Some cycles will have no blastocyst available for transfer. It is difficult news, and your team will explain what it means and what the options are.",
      "Embryo grading helps with selection but cannot predict with certainty which embryo will implant.",
    ],
    faqs: [
      { q: "Is a day 5 transfer always better than day 3?", a: "Not always. It depends on how many embryos there are and how they are developing. Your doctor and embryologist will advise you on timing." },
      { q: "What does an embryo 'grade' mean?", a: "It describes how expanded the blastocyst is and how its two cell groups look. It is a useful guide, not a guarantee." },
      { q: "Can blastocysts be frozen?", a: "Yes. Vitrification, a rapid freezing method, is widely used for blastocysts." },
    ],
    related: ["ivf", "icsi", "laser-assisted-hatching"],
    photo: { src: "/clinic/01.jpg", alt: "An embryologist examining embryos under a stereo microscope at Momtree", caption: "Embryo assessment at the stereo microscope", width: 3840, height: 2160 },
    review: "pending",
  },
  {
    slug: "laser-assisted-hatching",
    n: 8,
    name: "Laser-assisted hatching",
    group: "laboratory",
    short: "A precise opening in the embryo's outer shell, considered in selected cases.",
    summary:
      "Before it can implant, an embryo has to 'hatch' from its protective outer shell, the zona pellucida. In laser-assisted hatching, an embryologist uses a precise laser to thin or open a tiny part of this shell before transfer.",
    atAGlance: [
      { label: "When", value: "Shortly before embryo transfer" },
      { label: "Performed by", value: "An embryologist" },
      { label: "Used", value: "Selectively, after discussion" },
    ],
    whatItIs: [
      "Every embryo is surrounded by the zona pellucida, a protective layer. To implant in the uterus, the blastocyst must break out of it. Laser-assisted hatching makes a small opening or thinned area in the zona to help this happen.",
      "It is a laboratory technique carried out under the microscope, and involves no extra procedure for you.",
    ],
    whoMayBeEvaluated: [
      "Frozen-thawed embryos",
      "Embryos with a thick zona pellucida",
      "Repeated unsuccessful embryo transfers, after evaluation",
      "In some cases, older age",
    ],
    howItWorks: [
      { title: "Assessment", text: "The embryologist examines the embryo and its zona." },
      { title: "Laser", text: "A few brief pulses from a laser create a small, controlled opening or thinned area." },
      { title: "Transfer", text: "The embryo is transferred to the uterus as usual." },
    ],
    whatToExpect: ["You will not notice any difference in the transfer itself."],
    risks: [
      "Evidence on whether assisted hatching improves live birth rates is mixed, so it is offered selectively rather than routinely.",
      "There is a very small risk of damaging the embryo.",
      "Some studies suggest a possible small increase in identical twinning.",
    ],
    faqs: [
      { q: "Will assisted hatching increase my chances?", a: "For most people the evidence does not show a clear improvement in live birth rates. It may be considered in specific situations after discussion with your doctor." },
      { q: "Is the laser harmful to the embryo?", a: "The laser is aimed at the outer shell, away from the cells, and applied briefly by a trained embryologist." },
      { q: "Does it hurt?", a: "No. It happens in the laboratory, before transfer." },
    ],
    related: ["blastocyst-culture", "ivf", "icsi"],
    verify: ["Confirm the clinic has laser hatching equipment in use (listed on the current website)."],
    review: "pending",
  },
  {
    slug: "laparoscopy",
    n: 9,
    name: "Laparoscopy",
    group: "surgery",
    short: "Keyhole surgery to look at, and treat, the pelvic organs.",
    summary:
      "Laparoscopy is minimally invasive keyhole surgery. Through small cuts in the abdomen, a camera lets the surgeon see the uterus, tubes and ovaries directly, and treat some conditions during the same operation.",
    atAGlance: [
      { label: "Anaesthesia", value: "General" },
      { label: "Setting", value: "Operation theatre; usually day care or one night" },
      { label: "Recovery", value: "Most activities within about 1–2 weeks" },
    ],
    whatItIs: [
      "During laparoscopy, a thin telescope with a camera is passed through a small cut near the navel. Carbon dioxide gas gently lifts the abdominal wall so the organs can be seen, and small instruments are introduced through one or two further cuts.",
      "It can be diagnostic (to find a cause) or operative (to treat a problem), and is often both.",
    ],
    whoMayBeEvaluated: [
      "Suspected endometriosis",
      "Ovarian cysts",
      "Blocked tubes, adhesions, or fluid-filled tubes (hydrosalpinx)",
      "Some fibroids",
      "Unexplained pelvic pain or infertility, after other tests",
    ],
    howItWorks: [
      { title: "Pre-operative assessment", text: "Tests to make sure surgery and anaesthesia are safe for you." },
      { title: "Surgery", text: "Under general anaesthesia, the surgeon examines and treats the pelvic organs. Dye may be passed through the tubes to check that they are open." },
      { title: "Recovery", text: "Most people go home the same day or the next day." },
      { title: "Follow-up", text: "Findings and next steps are discussed at a follow-up visit." },
    ],
    whatToExpect: [
      "Some pain around the cuts, and shoulder-tip pain from the gas, are common for a few days.",
      "Most people return to light activities within a few days and to most activities within one to two weeks, depending on what was done.",
    ],
    risks: [
      "The risks of anaesthesia.",
      "Bleeding or infection.",
      "Uncommonly, injury to the bowel, bladder or blood vessels, which may need further surgery.",
      "Rarely, conversion to open surgery.",
    ],
    faqs: [
      { q: "Will I have scars?", a: "Usually two to four small scars of about 5–10 mm, which fade over time." },
      { q: "How soon can we try to conceive afterwards?", a: "It depends on what was found and treated. Your surgeon will advise you." },
      { q: "Is laparoscopy always needed before IVF?", a: "No. It is recommended only when what it finds or treats could change your care." },
    ],
    related: ["hysteroscopy", "fertility-evaluation", "ivf"],
    review: "pending",
  },
  {
    slug: "hysteroscopy",
    n: 10,
    name: "Hysteroscopy",
    group: "surgery",
    short: "A slim camera through the cervix to examine and treat the inside of the uterus.",
    summary:
      "Hysteroscopy lets a doctor look directly inside the uterus with a thin telescope passed through the cervix, with no cuts. Polyps, some fibroids or scar tissue can often be treated at the same time.",
    atAGlance: [
      { label: "Incisions", value: "None" },
      { label: "Anaesthesia", value: "None, local or short general, depending on the procedure" },
      { label: "Setting", value: "Day care" },
    ],
    whatItIs: [
      "A hysteroscope is a slim telescope with a light and a camera. It is passed through the vagina and cervix into the uterus, which is gently filled with fluid so the lining can be seen clearly.",
      "Diagnostic hysteroscopy examines the cavity. Operative hysteroscopy uses fine instruments through the same scope to treat what is found.",
    ],
    whoMayBeEvaluated: [
      "Polyps or fibroids seen on ultrasound that may affect the cavity",
      "Suspected scar tissue (adhesions) or a uterine septum",
      "Abnormal bleeding",
      "Repeated unsuccessful embryo transfers or pregnancy loss, after evaluation",
    ],
    howItWorks: [
      { title: "Timing", text: "Usually planned in the first half of the cycle, after the period has finished." },
      { title: "Procedure", text: "The hysteroscope is passed gently through the cervix. A diagnostic look takes a few minutes; treatment takes longer." },
      { title: "Recovery", text: "Most people go home the same day." },
    ],
    whatToExpect: [
      "Cramping and light bleeding for a few days are common.",
      "Most people return to normal activities within a day or two.",
    ],
    risks: [
      "Cramping, bleeding or infection.",
      "Rarely, a small perforation of the uterine wall.",
      "During operative procedures, rarely, problems from fluid absorption. Fluid balance is monitored throughout.",
    ],
    faqs: [
      { q: "Is hysteroscopy painful?", a: "A diagnostic hysteroscopy is usually brief and causes period-like cramping. For longer procedures anaesthesia is used, so you are comfortable." },
      { q: "Can hysteroscopy improve my chances of pregnancy?", a: "When a problem in the cavity is found and treated, it may help. Routine hysteroscopy for everyone is not recommended." },
      { q: "Do I need to stay in hospital?", a: "Usually not. It is normally a day-care procedure." },
    ],
    related: ["laparoscopy", "ultrasound", "ivf"],
    review: "pending",
  },
  {
    slug: "ultrasound",
    n: 2,
    name: "Ultrasound",
    group: "understand",
    short: "Real-time images of the uterus and ovaries, at every stage of care.",
    summary:
      "Ultrasound is used throughout fertility care: to assess the uterus and ovaries, to follow growing follicles, to guide egg collection and embryo transfer, and to see an early pregnancy.",
    atAGlance: [
      { label: "Type", value: "Mostly transvaginal" },
      { label: "Radiation", value: "None" },
      { label: "Time", value: "Usually 5–15 minutes" },
    ],
    whatItIs: [
      "Fertility scans are usually transvaginal: a slim probe in a protective cover gives clear, close-up images of the uterus and ovaries. Ultrasound uses sound waves, not radiation.",
      "At Momtree, ultrasound is part of nearly every stage of care, from the first assessment to an early pregnancy scan.",
    ],
    whoMayBeEvaluated: [
      "Baseline assessment of the uterus and ovaries",
      "Counting resting (antral) follicles, one indicator of ovarian reserve",
      "Tracking follicle growth and the uterine lining during treatment",
      "Guiding egg collection and embryo transfer",
      "Early pregnancy scans",
    ],
    howItWorks: [
      { title: "Preparation", text: "Usually an empty bladder for a transvaginal scan. A full bladder may be requested for abdominal views, or for embryo transfer." },
      { title: "Scan", text: "The probe is inserted gently and images appear in real time. You are welcome to ask questions as they are taken." },
      { title: "Results", text: "Measurements are recorded and discussed with you." },
    ],
    whatToExpect: [
      "A transvaginal scan may be a little uncomfortable but should not be painful. Tell us if you would like to pause.",
      "Scans during treatment are short, and are often booked early in the day.",
    ],
    risks: [
      "Ultrasound is considered very safe and does not use radiation.",
      "Like any image, it has limits. Some findings need further tests to confirm them.",
    ],
    faqs: [
      { q: "Is a transvaginal scan safe in early pregnancy?", a: "Yes. It is the standard way to see an early pregnancy clearly." },
      { q: "Why do I need so many scans during treatment?", a: "Follicles change from day to day. Regular scans let your doctor adjust medicines and time procedures safely." },
      { q: "How long does a scan take?", a: "Usually between 5 and 15 minutes." },
    ],
    related: ["fertility-evaluation", "ovulation-induction", "ivf"],
    photo: { src: `${L}/05.jpg`, alt: "A clinician in the Momtree procedure room beside an ultrasound machine", caption: "The procedure room, with ultrasound", width: 1600, height: 900 },
    review: "pending",
  },
  {
    slug: "andrology",
    n: 11,
    name: "Andrology",
    group: "male",
    short: "Assessing and supporting male fertility.",
    summary:
      "Male factors are involved in a large share of fertility problems, which is why both partners are evaluated together. The andrology laboratory assesses semen, prepares sperm for treatment and can freeze sperm for later use.",
    atAGlance: [
      { label: "Core test", value: "Semen analysis" },
      { label: "Before the test", value: "Usually 2–7 days of abstinence" },
      { label: "Results", value: "Discussed with your doctor" },
    ],
    whatItIs: [
      "Andrology is the branch of medicine concerned with male reproductive health. In a fertility clinic, the andrology laboratory analyses semen, prepares sperm for IUI, IVF or ICSI, and can freeze (cryopreserve) sperm.",
      "A semen analysis looks at volume, sperm concentration, movement (motility) and shape (morphology), using World Health Organization methods. Because results naturally vary, a second test is sometimes recommended.",
    ],
    whoMayBeEvaluated: [
      "Every couple having a fertility evaluation",
      "Men with a history of testicular injury, surgery, infection or undescended testes",
      "Men about to have treatment, such as chemotherapy, that could affect fertility and who wish to freeze sperm first",
      "Abnormal results that need repeating or further assessment",
    ],
    howItWorks: [
      { title: "Preparation", text: "Avoid ejaculation for 2–7 days before the test, or as advised." },
      { title: "Sample", text: "Collected by masturbation into a sterile container, in a private room at the clinic." },
      { title: "Analysis", text: "The laboratory assesses the sample under the microscope, usually within the hour." },
      { title: "Review", text: "Your doctor explains the results and any next steps, which may include lifestyle changes, further tests or treatment." },
    ],
    whatToExpect: [
      "Results are usually discussed at a follow-up appointment.",
      "One abnormal result is not a diagnosis. Repeat testing is common.",
    ],
    risks: [
      "A semen analysis carries no physical risk.",
      "It measures sperm, not the whole picture of fertility, so further tests may be needed.",
    ],
    faqs: [
      { q: "What do the numbers in a semen analysis mean?", a: "They are compared with WHO reference values. Values below these limits do not mean pregnancy is impossible, and values above them do not guarantee it. Your doctor will explain your results." },
      { q: "Can lifestyle affect sperm?", a: "Yes. Smoking, heavy drinking, excess weight, heat exposure and some medicines can affect sperm. Sperm take about three months to develop, so changes take time to show." },
      { q: "Can sperm be frozen before treatment?", a: "Yes. Sperm freezing can be arranged, for example before medical treatment that may affect fertility." },
    ],
    related: ["icsi", "iui", "art-bank"],
    photo: { src: `${L}/04.jpg`, alt: "Close view of a laboratory stereo microscope at Momtree", caption: "Laboratory microscopy", width: 1600, height: 900 },
    verify: ["The current website describes an 'AI enabled andrology lab'. Confirm which system is used before any AI wording is published."],
    review: "pending",
  },
  {
    slug: "art-bank",
    n: 12,
    name: "ART bank & cryopreservation",
    group: "third-party",
    short: "Freezing and storing sperm, eggs and embryos, and access to screened donor gametes.",
    summary:
      "Cryopreservation lets sperm, eggs and embryos be frozen and stored for future use. Under India's ART (Regulation) Act, 2021, donor sperm and eggs are sourced, screened and stored through registered ART banks.",
    atAGlance: [
      { label: "Method", value: "Vitrification for eggs and embryos" },
      { label: "Storage", value: "Liquid nitrogen, −196 °C" },
      { label: "Consent", value: "Written, with defined storage periods" },
    ],
    whatItIs: [
      "Freezing (cryopreservation) preserves reproductive cells at very low temperatures so they can be used later. Eggs and embryos are usually frozen by vitrification, a rapid method that avoids damaging ice crystals. Sperm can also be frozen.",
      "An ART bank collects, screens and stores gametes from donors and supplies them to ART clinics, as defined and regulated by the ART (Regulation) Act, 2021.",
    ],
    whoMayBeEvaluated: [
      "Couples with surplus good-quality embryos after IVF",
      "People facing medical treatment that may affect fertility",
      "Men who may not be available on the day of treatment, or with low sperm numbers",
      "Patients who need donor sperm or eggs, within the law",
    ],
    howItWorks: [
      { title: "Counselling and consent", text: "Written consent records how long material is stored and what happens to it." },
      { title: "Freezing", text: "Sperm, eggs or embryos are prepared and frozen in the laboratory." },
      { title: "Storage", text: "Samples are labelled, recorded and kept in monitored liquid-nitrogen tanks." },
      { title: "Use", text: "When needed, samples are thawed (warmed) and used in treatment." },
    ],
    whatToExpect: [
      "Storage is reviewed and renewed according to your consent and the law.",
      "Not every frozen egg or embryo survives thawing.",
    ],
    risks: [
      "Survival after thawing is high with vitrification but not guaranteed.",
      "Frozen eggs and embryos do not guarantee a future pregnancy.",
    ],
    faqs: [
      { q: "How long can embryos be stored?", a: "Storage periods are set by Indian law and by your written consent. Our team will explain the current rules." },
      { q: "Are frozen embryo transfers less successful?", a: "In many situations, results with frozen embryos are similar to fresh ones. Your doctor will advise you on your own circumstances." },
      { q: "Can I choose a donor?", a: "No. Under Indian law a donor's identity is confidential, and matching follows the regulations." },
    ],
    related: ["donor-services", "andrology", "ivf"],
    verify: [
      "Confirm whether Momtree is itself registered as an ART bank or works with a registered partner bank.",
      "The current website says the ART bank supplies 'surrogate mothers'. That wording conflicts with the Surrogacy (Regulation) Act, 2021, so it has been removed.",
    ],
    review: "pending",
  },
  {
    slug: "donor-services",
    n: 13,
    name: "Donor services",
    group: "third-party",
    short: "Treatment with donor eggs or sperm, within the ART (Regulation) Act.",
    summary:
      "For some people, conceiving with their own eggs or sperm is not possible. Donor eggs or sperm, provided through registered ART banks and used under the ART (Regulation) Act, 2021, can make treatment possible.",
    atAGlance: [
      { label: "Donor identity", value: "Confidential, by law" },
      { label: "Screening", value: "Medical and genetic screening of donors" },
      { label: "Counselling", value: "Before treatment" },
    ],
    whatItIs: [
      "Donor treatment uses eggs or sperm from a screened donor. Donor sperm can be used in IUI or IVF. Donor eggs are fertilised in the laboratory, and the resulting embryo is transferred to the intended mother.",
      "In India, the ART (Regulation) Act, 2021 sets out who may donate, how donors are screened and how donor identity is protected. Counselling is part of the process.",
    ],
    whoMayBeEvaluated: [
      "Very low or absent ovarian reserve, or premature ovarian insufficiency",
      "Absent sperm where retrieval is not possible",
      "A high risk of passing on a serious genetic condition",
      "Repeated unsuccessful IVF with own eggs, after evaluation",
    ],
    howItWorks: [
      { title: "Consultation and counselling", text: "The medical, emotional and legal aspects are explained, including consent." },
      { title: "Screening and matching", text: "Donors are screened as the law requires, and matching follows the regulations." },
      { title: "Treatment", text: "IUI or IVF using donor gametes, with preparation of the uterus where needed." },
      { title: "Follow-up", text: "As with any treatment, including a pregnancy test and early scans." },
    ],
    whatToExpect: [
      "There are legal consents and documents to complete before treatment begins.",
      "Counselling is offered to help you think the decision through.",
    ],
    risks: [
      "Treatment risks are similar to those of IUI or IVF.",
      "Pregnancy is not guaranteed with donor gametes.",
      "Using donor gametes raises emotional and family questions. Counselling can help.",
    ],
    faqs: [
      { q: "Will we know who the donor is?", a: "No. Indian law requires a donor's identity to remain confidential." },
      { q: "Who can be a donor?", a: "Eligibility, including age limits and conditions for donating, is defined by the ART (Regulation) Act, 2021 and its rules." },
      { q: "Is the child legally ours?", a: "Under the ART Act, a child born through assisted reproduction is treated as the biological child of the commissioning couple, and donors have no parental rights. For advice on your own situation, please consult a lawyer." },
    ],
    related: ["art-bank", "ivf", "surrogacy"],
    verify: ["Legal statements to be confirmed against the current ART Act rules by the clinic or its counsel."],
    review: "pending",
  },
  {
    slug: "surrogacy",
    n: 14,
    name: "Surrogacy services",
    group: "third-party",
    short: "Medical care for altruistic surrogacy, as permitted by Indian law.",
    summary:
      "When a woman cannot safely carry a pregnancy, surrogacy may be an option. In India only altruistic surrogacy is permitted, under the Surrogacy (Regulation) Act, 2021, with strict eligibility rules and certificates.",
    atAGlance: [
      { label: "Permitted", value: "Altruistic surrogacy only" },
      { label: "Approvals", value: "Certificates from the appropriate authority" },
      { label: "Counselling", value: "Part of the process" },
    ],
    whatItIs: [
      "In gestational surrogacy, an embryo created through IVF is transferred to the uterus of a surrogate, who carries the pregnancy for the intending parents.",
      "Indian law prohibits commercial surrogacy. Altruistic surrogacy is allowed only for eligible intending couples or women, with a medical indication and legal approvals. The surrogate receives no payment beyond medical expenses and insurance cover.",
    ],
    whoMayBeEvaluated: [
      "Absence of the uterus, or a uterus that cannot support a pregnancy",
      "Medical conditions that make pregnancy life-threatening",
      "Repeated IVF failure or recurrent pregnancy loss, as defined in the rules",
    ],
    howItWorks: [
      { title: "Medical evaluation", text: "Assessment of the medical indication for surrogacy." },
      { title: "Legal eligibility", text: "Certificates of essentiality and eligibility are obtained from the appropriate authority, as the law requires." },
      { title: "IVF", text: "Embryos are created through IVF." },
      { title: "Transfer and care", text: "An embryo is transferred to the surrogate, and her pregnancy is carefully monitored." },
    ],
    whatToExpect: [
      "The legal process takes time and involves documents from the authorities.",
      "Counselling is part of the process for everyone involved.",
    ],
    risks: [
      "The medical risks of IVF and pregnancy apply to the surrogate.",
      "Pregnancy is not guaranteed.",
      "The legal framework can change, so requirements are checked at the start of the process.",
    ],
    faqs: [
      { q: "Is commercial surrogacy allowed in India?", a: "No. Only altruistic surrogacy is permitted, under the Surrogacy (Regulation) Act, 2021." },
      { q: "Who is eligible?", a: "The law sets specific conditions for intending parents and for surrogates, including age, marital status and medical indication. We will explain the current requirements at your consultation." },
      { q: "What is Momtree's role?", a: "Medical care and guidance through each step, within the Surrogacy (Regulation) Act, 2021." },
    ],
    related: ["ivf", "donor-services", "art-bank"],
    verify: ["Confirm the clinic's registration status under the Surrogacy (Regulation) Act, 2021 before this page goes live."],
    review: "pending",
  },
];

export function getTreatment(slug: string) {
  return treatments.find((t) => t.slug === slug);
}

export function treatmentsByGroup() {
  return treatmentGroups.map((g) => ({ ...g, items: treatments.filter((t) => t.group === g.id) }));
}
