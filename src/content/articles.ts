// Knowledge Centre. The first five articles are migrated from the old site and rewritten for accuracy
// (for example, the old "IVF over 35" article said ICSI gives "higher success rates", which is not the
// case when sperm is normal). All articles await clinician review before launch.
import type { ReviewStatus } from "@/lib/review";

export type CategoryId =
  | "ivf-education"
  | "fertility-health"
  | "iui-and-icsi"
  | "pregnancy-preparation"
  | "fertility-myths"
  | "male-fertility"
  | "female-fertility"
  | "treatment-guidance";

export const categories: { id: CategoryId; label: string }[] = [
  { id: "ivf-education", label: "IVF education" },
  { id: "fertility-health", label: "Fertility health" },
  { id: "iui-and-icsi", label: "IUI and ICSI" },
  { id: "pregnancy-preparation", label: "Pregnancy preparation" },
  { id: "fertility-myths", label: "Fertility myths" },
  { id: "male-fertility", label: "Male fertility" },
  { id: "female-fertility", label: "Female fertility" },
  { id: "treatment-guidance", label: "Treatment guidance" },
];

export type Block = { type: "p"; text: string } | { type: "h2"; text: string } | { type: "ul"; items: string[] } | { type: "note"; text: string };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  categories: CategoryId[];
  /** Line-plate motif for the cover (a treatment slug or "rings"). */
  motif: string;
  published: string;
  updated: string;
  migratedFrom?: string;
  blocks: Block[];
  review: ReviewStatus;
};

const OLD = "https://momtreeivf.com";

export const articles: Article[] = [
  {
    slug: "ivf-after-35",
    title: "IVF after 35: what changes, and what can help",
    excerpt: "Age affects fertility for both partners, especially the number and quality of eggs. Here is what that means for treatment, explained honestly.",
    categories: ["ivf-education", "female-fertility"],
    motif: "ovulation-induction",
    published: "2025-01-20",
    updated: "2026-11-02",
    migratedFrom: `${OLD}/ivf-for-couples-over-35-challenges-and-solutions/`,
    review: "pending",
    blocks: [
      { type: "p", text: "Many people start thinking about a family in their mid-thirties or later. If that is you, it helps to understand how age affects fertility, and what treatment can and cannot change." },
      { type: "h2", text: "What changes with age" },
      {
        type: "ul",
        items: [
          "The number of eggs in the ovaries falls steadily through life, and more quickly from the mid-thirties.",
          "The proportion of eggs with chromosomal differences rises with age. This affects the chance of an embryo developing and implanting, and the risk of miscarriage.",
          "Some conditions that affect fertility, such as fibroids and endometriosis, become more common.",
          "Sperm quality can also change with age, though more gradually.",
        ],
      },
      { type: "p", text: "These changes are a normal part of biology. They do not mean pregnancy is impossible, but they do mean time matters." },
      { type: "h2", text: "When to seek advice" },
      { type: "p", text: "If you are 35 or older and have been trying to conceive for six months without success, it is reasonable to have a fertility evaluation. If you are over 40, or have irregular cycles or a known condition, consider seeking advice sooner." },
      { type: "h2", text: "How treatment is tailored" },
      {
        type: "ul",
        items: [
          "Ovarian reserve tests, such as AMH and an antral follicle count, help plan the stimulation dose. They indicate how the ovaries may respond, not whether you will conceive.",
          "Stimulation is adjusted to your response, with careful monitoring.",
          "ICSI is recommended when there is a sperm or fertilisation problem. It does not overcome age-related changes in eggs.",
          "Embryo testing (PGT) may be discussed in specific situations. Its benefit for live birth rates is debated, and it is not right for everyone.",
          "Donor eggs are an option some people consider, within the ART (Regulation) Act, 2021.",
        ],
      },
      { type: "h2", text: "Thinking ahead: egg freezing" },
      { type: "p", text: "For people who are not ready for pregnancy yet, freezing eggs at a younger age can preserve their current potential. It does not guarantee a future pregnancy, and the chance of success depends strongly on age at the time of freezing." },
      { type: "h2", text: "Looking after yourself" },
      { type: "ul", items: ["Stop smoking, and keep alcohol low.", "Aim for a healthy weight and regular activity.", "Take folic acid before conception, as advised by your doctor.", "Review long-term medicines with your doctor."] },
      { type: "note", text: "Every person's situation is different. A consultation is the best way to understand your own options and realistic chances." },
    ],
  },
  {
    slug: "ivf-myths-and-facts",
    title: "IVF myths and facts",
    excerpt: "Clear answers to common misunderstandings about IVF, from guarantees and bed rest to the health of children born after treatment.",
    categories: ["fertility-myths", "ivf-education"],
    motif: "ivf",
    published: "2025-01-20",
    updated: "2026-11-02",
    migratedFrom: `${OLD}/common-ivf-myths-and-facts-everything-you-need-to-know/`,
    review: "pending",
    blocks: [
      { type: "p", text: "IVF is widely used, yet surrounded by misunderstandings that can add worry to an already emotional time. Here are some of the most common, and what the evidence says." },
      { type: "h2", text: "Myth: IVF always works" },
      { type: "p", text: "Fact: IVF improves the chance of pregnancy for many people, but it cannot guarantee it. Success depends on age, the cause of infertility, egg and sperm quality and how embryos develop. Some people need more than one cycle, and for some, IVF does not result in pregnancy." },
      { type: "h2", text: "Myth: IVF is only for blocked tubes" },
      { type: "p", text: "Fact: IVF can help with many causes, including male-factor infertility, endometriosis, ovulation problems and unexplained infertility." },
      { type: "h2", text: "Myth: IVF is the same for everyone" },
      { type: "p", text: "Fact: Treatment is planned around each person's results. The medicines, doses, laboratory techniques and timing all vary." },
      { type: "h2", text: "Myth: Infertility is a woman's problem" },
      { type: "p", text: "Fact: Male factors are involved in a large share of cases, which is why both partners are evaluated from the start." },
      { type: "h2", text: "Myth: Children born after IVF are less healthy" },
      { type: "p", text: "Fact: Most children born after IVF are healthy. Some studies show small increases in certain risks, such as being born early or with a low birth weight, often linked to twins or to the underlying cause of infertility. Transferring one embryo at a time lowers many of these risks." },
      { type: "h2", text: "Myth: You need complete bed rest after embryo transfer" },
      { type: "p", text: "Fact: Prolonged bed rest has not been shown to help. Most people can return to normal, gentle activity soon after transfer, following their doctor's advice." },
      { type: "h2", text: "Myth: IVF always means twins" },
      { type: "p", text: "Fact: Twins are more likely when more than one embryo is transferred. Single embryo transfer reduces this risk." },
      { type: "note", text: "If you have heard something about IVF that worries you, ask us. Clear information is part of good care." },
    ],
  },
  {
    slug: "choosing-a-fertility-clinic",
    title: "How to choose a fertility clinic",
    excerpt: "The questions worth asking any clinic, including ours, before you begin treatment.",
    categories: ["treatment-guidance"],
    motif: "fertility-evaluation",
    published: "2025-01-18",
    updated: "2026-11-02",
    migratedFrom: `${OLD}/how-to-choose-the-best-ivf-specialist-and-fertility-clinic-in-mysuru/`,
    review: "pending",
    blocks: [
      { type: "p", text: "Choosing where to have fertility treatment is a big decision. These are the questions we would encourage you to ask any clinic, including ours." },
      { type: "h2", text: "Registration and regulation" },
      { type: "p", text: "In India, clinics offering assisted reproduction must be registered under the ART (Regulation) Act, 2021. You can ask to see a clinic's registration." },
      { type: "h2", text: "Honest information about outcomes" },
      {
        type: "ul",
        items: [
          "Ask how results are measured. Live births per embryo transfer, or per treatment cycle started, mean more than positive pregnancy tests.",
          "Ask for results for people in your own age group.",
          "Be cautious of guarantees, or of very high success figures given without context.",
        ],
      },
      { type: "h2", text: "The laboratory and the team" },
      { type: "ul", items: ["Who are the doctors and embryologists, and what is their training?", "Which laboratory techniques are offered, and when are they recommended?", "How are embryos assessed and stored?"] },
      { type: "h2", text: "Personal care and communication" },
      { type: "ul", items: ["Will you see the same doctor throughout treatment?", "How, and how quickly, will results be shared with you?", "Is counselling or emotional support available?"] },
      { type: "h2", text: "Costs, explained up front" },
      { type: "p", text: "Ask for a written estimate that includes medicines, monitoring, laboratory procedures and embryo freezing, and what happens if a cycle is cancelled." },
      { type: "h2", text: "Practical matters" },
      { type: "ul", items: ["How easy is the clinic to reach for frequent monitoring visits?", "Who do you contact out of hours?"] },
      { type: "note", text: "We are happy to answer every one of these questions at your consultation." },
    ],
  },
  {
    slug: "when-to-consider-ivf",
    title: "When to seek help, and when IVF may be considered",
    excerpt: "A step-by-step view of the fertility journey, from the first evaluation to deciding whether IVF is the right next step.",
    categories: ["treatment-guidance", "fertility-health"],
    motif: "ultrasound",
    published: "2025-01-18",
    updated: "2026-11-02",
    migratedFrom: `${OLD}/best-time-to-start-ivf-a-step-by-step-fertility-journey/`,
    review: "pending",
    blocks: [
      { type: "p", text: "There is no single right moment to start IVF. For most people the journey begins with understanding what is happening, and IVF is one of several possible next steps." },
      { type: "h2", text: "When to have a fertility evaluation" },
      {
        type: "ul",
        items: [
          "After 12 months of regular unprotected intercourse without pregnancy, if the woman is under 35.",
          "After 6 months, if she is 35 or older.",
          "Sooner if periods are irregular or absent, if there is a known condition such as endometriosis, PCOS or tubal damage, or if there is a known sperm problem.",
        ],
      },
      { type: "h2", text: "Simpler treatments first, where appropriate" },
      { type: "p", text: "Depending on the cause, ovulation induction or IUI may be tried before IVF. For some causes, such as blocked tubes or a significant sperm problem, IVF may be recommended earlier." },
      { type: "h2", text: "When IVF may be considered" },
      { type: "ul", items: ["Blocked or damaged fallopian tubes", "Moderate to severe male-factor infertility", "Endometriosis", "Reduced ovarian reserve", "Unexplained infertility after other treatments", "Fertility preservation or genetic testing needs"] },
      { type: "h2", text: "The main steps of an IVF cycle" },
      { type: "ul", items: ["Assessment and planning", "Ovarian stimulation, with monitoring", "Egg collection", "Fertilisation in the laboratory (IVF or ICSI)", "Embryo culture", "Embryo transfer", "A pregnancy test about two weeks later"] },
      { type: "note", text: "The best time to start is different for everyone. A consultation helps you decide with full information." },
    ],
  },
  {
    slug: "ivf-success-rates-and-costs",
    title: "IVF success rates and costs: what the numbers mean",
    excerpt: "How to read success figures, what affects your own chances, and what is usually included in the cost of IVF.",
    categories: ["ivf-education"],
    motif: "blastocyst-culture",
    published: "2024-12-20",
    updated: "2026-11-02",
    migratedFrom: `${OLD}/ivf-treatment-a-comprehensive-guide-to-success-rates-and-cost-in-mysore/`,
    review: "pending",
    blocks: [
      { type: "p", text: "Success rates and costs are among the first things people ask about IVF. Both are easy to misunderstand, so here is how to think about them." },
      { type: "h2", text: "What affects the chance of success" },
      { type: "ul", items: ["Age, especially the age of the person providing the eggs", "The cause and duration of infertility", "Egg and sperm quality", "How embryos develop in the laboratory", "The health of the uterus", "General health, including weight and smoking"] },
      { type: "h2", text: "How to read success figures" },
      { type: "p", text: "A meaningful figure says what was counted (ideally live births), out of what (per embryo transfer, or per cycle started), and for which age group. A single headline percentage for all patients says little about your own chances." },
      { type: "p", text: "That is why this website does not publish a single success rate. Your doctor will discuss realistic expectations based on your own results." },
      { type: "h2", text: "What the cost usually includes" },
      { type: "ul", items: ["Consultations and tests", "Medicines for ovarian stimulation, which vary with dose and protocol", "Monitoring scans and blood tests", "Egg collection, laboratory work and embryo transfer", "ICSI, embryo freezing and storage, if needed"] },
      { type: "p", text: "Because plans differ, so do costs. You will receive a written estimate before treatment begins." },
      { type: "note", text: "Questions about costs are welcome at any stage. Ask us before you decide anything." },
    ],
  },
  {
    slug: "understanding-semen-analysis",
    title: "Understanding a semen analysis",
    excerpt: "What the test measures, how to prepare, and how to read the results without unnecessary worry.",
    categories: ["male-fertility"],
    motif: "andrology",
    published: "2026-11-02",
    updated: "2026-11-02",
    review: "pending",
    blocks: [
      { type: "p", text: "A semen analysis is one of the first and most informative fertility tests. It is simple and painless, and an essential part of evaluating a couple." },
      { type: "h2", text: "How to prepare" },
      {
        type: "ul",
        items: [
          "Avoid ejaculation for 2–7 days before the test.",
          "Collect the whole sample into the sterile container provided.",
          "Tell the laboratory if any of the sample was lost, or if you have had a fever or illness in the past three months.",
        ],
      },
      { type: "h2", text: "What is measured" },
      { type: "ul", items: ["The volume of the sample", "Sperm concentration and total number", "Motility: how many sperm move, and how well", "Morphology: the proportion of sperm with a typical shape", "Vitality and other factors, where needed"] },
      { type: "h2", text: "Reference values" },
      { type: "p", text: "Results are compared with World Health Organization reference values (6th edition, 2021). The lower reference limits include a semen volume of 1.4 mL, a sperm concentration of 16 million per mL, total motility of 42% and normal forms of 4%." },
      { type: "p", text: "These are not cut-offs for fertility. Many men with results below them father children, and results above them do not guarantee fertility." },
      { type: "h2", text: "If a result is abnormal" },
      {
        type: "ul",
        items: [
          "A single test is not a diagnosis. Results vary, and a repeat test is often advised.",
          "Smoking, heavy drinking, heat and excess weight can affect results. Sperm take about three months to develop, so changes take time to show.",
          "Further tests or treatment, including IUI, IVF or ICSI, may be discussed depending on the findings.",
        ],
      },
      { type: "note", text: "Your doctor will explain your own results. Please don't hesitate to ask what any number means." },
    ],
  },
  {
    slug: "iui-and-icsi-explained",
    title: "IUI and ICSI: two very different treatments",
    excerpt: "They sound alike but work in completely different ways. Here is how, and who each may help.",
    categories: ["iui-and-icsi"],
    motif: "icsi",
    published: "2026-11-02",
    updated: "2026-11-02",
    review: "pending",
    blocks: [
      { type: "p", text: "IUI and ICSI are often confused, perhaps because the names sound alike. In fact they are very different treatments." },
      { type: "h2", text: "IUI: helping sperm reach the egg" },
      { type: "p", text: "In intrauterine insemination, washed and concentrated sperm is placed in the uterus around the time of ovulation. Fertilisation happens naturally, inside the body. IUI needs at least one open fallopian tube and reasonable sperm numbers." },
      { type: "h2", text: "ICSI: fertilisation in the laboratory" },
      { type: "p", text: "Intracytoplasmic sperm injection is part of IVF. Eggs are collected, and an embryologist injects a single sperm into each mature egg. The resulting embryos are cultured in the laboratory before one is transferred to the uterus." },
      { type: "h2", text: "At a glance" },
      {
        type: "ul",
        items: [
          "Where fertilisation happens. IUI: inside the body. ICSI: in the laboratory.",
          "Egg collection. IUI: not needed. ICSI: needed.",
          "Typical reasons. IUI: mild sperm problems, unexplained infertility, ovulation disorders (with medicines), donor sperm. ICSI: significant sperm problems, previous fertilisation failure, some frozen-egg or testing cycles.",
          "The procedure. IUI: a few minutes in the clinic, usually without anaesthesia. ICSI: egg collection under sedation, then laboratory work.",
        ],
      },
      { type: "note", text: "Your evaluation results will guide which treatment, if either, is right for you." },
    ],
  },
  {
    slug: "preparing-for-fertility-treatment",
    title: "Preparing your body and mind for fertility treatment",
    excerpt: "Practical steps for the weeks before treatment, for both partners.",
    categories: ["pregnancy-preparation", "female-fertility", "fertility-health"],
    motif: "rings",
    published: "2026-11-02",
    updated: "2026-11-02",
    review: "pending",
    blocks: [
      { type: "p", text: "There is a lot you cannot control in fertility treatment. These are some of the things you can, in the weeks before you begin." },
      { type: "h2", text: "For both partners" },
      { type: "ul", items: ["Stop smoking, and avoid second-hand smoke where possible.", "Keep alcohol low, or avoid it.", "Aim for a healthy weight; even modest changes can help.", "Stay active with regular, moderate exercise.", "Review all medicines and supplements with your doctor."] },
      { type: "h2", text: "For the person hoping to carry a pregnancy" },
      {
        type: "ul",
        items: [
          "Take folic acid before conception and in early pregnancy, at the dose your doctor recommends.",
          "Check rubella immunity and other routine tests if advised.",
          "Bring long-term conditions such as thyroid disease or diabetes under control before treatment.",
          "Keep caffeine moderate.",
        ],
      },
      { type: "h2", text: "For the male partner" },
      { type: "ul", items: ["Avoid excess heat to the testes, such as hot baths or a laptop on the lap.", "Remember that sperm take about three months to develop, so changes made now help later."] },
      { type: "h2", text: "Looking after your emotional wellbeing" },
      { type: "p", text: "Fertility treatment can be demanding. Talk openly with each other, keep up the things that steady you, and tell your care team how you are feeling. Support is part of treatment, not an extra." },
      { type: "note", text: "If you have a specific question about preparing for treatment, ask us at any time." },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function readingMinutes(a: Article) {
  const words = a.blocks.reduce((n, b) => n + (b.type === "ul" ? b.items.join(" ") : b.text).split(/\s+/).length, 0);
  return Math.max(2, Math.round(words / 200));
}

export function categoryLabel(id: CategoryId) {
  return categories.find((c) => c.id === id)?.label ?? id;
}
