export const QUESTION_BANK = [
  {
    part: "PART_1",
    name: "Work & Study",
    slug: "work-study",
    desc: "Nhóm câu khởi động về học tập và công việc",
    questions: [
      "Do you work or are you a student?",
      "What subject do you enjoy studying most?",
      "Would you like to change your job in the future?",
      "What do you usually do after school or work?",
    ],
  },
  {
    part: "PART_1",
    name: "Home & Hometown",
    slug: "home-hometown",
    desc: "Câu hỏi cá nhân quen thuộc, dễ lấy đà nói",
    questions: [
      "Can you describe the area where you live now?",
      "What do you like most about your hometown?",
      "Would you prefer living in a city or the countryside?",
      "How has your hometown changed in recent years?",
    ],
  },
  {
    part: "PART_2",
    name: "People & Memories",
    slug: "people-memories",
    desc: "Cue card về người, trải nghiệm và kỷ niệm",
    questions: [
      "Describe a person who encouraged you to achieve a goal.",
      "Describe a memorable conversation you had recently.",
      "Describe a time when you learned something useful from a friend.",
      "Describe a person you enjoy spending time with.",
    ],
  },
  {
    part: "PART_2",
    name: "Skills & Goals",
    slug: "skills-goals",
    desc: "Cue card về kỹ năng, ước mơ và kế hoạch",
    questions: [
      "Describe a skill you want to learn in the future.",
      "Describe a goal you achieved that made you proud.",
      "Describe a difficult decision you made successfully.",
      "Describe a course you would like to take one day.",
    ],
  },
  {
    part: "PART_3",
    name: "Education & Technology",
    slug: "education-technology",
    desc: "Câu thảo luận sâu hơn để kéo band lexical + grammar",
    questions: [
      "How has technology changed the way people learn today?",
      "Do you think online classes can replace traditional classrooms completely?",
      "Why do some learners stay motivated while others give up quickly?",
      "What responsibilities should schools have beyond academic teaching?",
    ],
  },
  {
    part: "PART_3",
    name: "Society & Lifestyle",
    slug: "society-lifestyle",
    desc: "Thảo luận về hành vi xã hội, lối sống và xu hướng",
    questions: [
      "Why do many people struggle to keep a healthy lifestyle?",
      "How does modern life affect family relationships?",
      "Do you think young people face more pressure than older generations?",
      "What makes some public campaigns more effective than others?",
    ],
  },
] as const;

export const DEEPGRAM_EXAMINER_VOICES = [
  { id: "aura-asteria-en", name: "Asteria · nữ mềm" },
  { id: "aura-luna-en", name: "Luna · nữ sáng" },
  { id: "aura-stella-en", name: "Stella · nữ rõ" },
  { id: "aura-athena-en", name: "Athena · nữ nghiêm" },
  { id: "aura-helios-en", name: "Helios · nam sáng" },
  { id: "aura-orpheus-en", name: "Orpheus · nam trầm" },
] as const;
