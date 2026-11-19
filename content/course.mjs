// course.mjs - the six lessons: their titles, their one-line promises and their quizzes.
// The lesson bodies are built in build.mjs from content/manual.json, so the course and the manual never disagree.
// Every quiz answer comes straight from the manual. `answer` is the position of the right option, counting from 0.
export const lessons = [
  { slug: 'read-this-first', n: '01', title: 'Read this first', kicker: 'Three rules and one golden rule. Everything else hangs on them.',
    quiz: [
      { q: 'You forgot to type the event\'s start time. What ends up on screen?', options: ['Claude looks the time up for you', 'A draft or a gap: only facts you typed are treated as facts', 'The time the build started'], answer: 1, why: 'Facts in, guesses out. Anything you did not type is a draft until you approve it.' },
      { q: 'When is the cheapest moment to change your mind?', options: ['After the first render', 'At the storyboard', 'When choosing the music'], answer: 1, why: 'The golden rule: change your mind at the storyboard. It is the cheapest frame you will ever redo.' },
      { q: 'A build finishes with a clean report. What has nobody done yet?', options: ['Measured its length', 'Checked its loudness', 'Watched it at speed and listened to it'], answer: 2, why: 'A build is measured, not watched or heard. You are the last check.' },
    ] },
  { slug: 'know-the-terrain', n: '02', title: 'Know the terrain', kicker: 'The whole job in four stages: Facts, Frames, Film, Files.',
    quiz: [
      { q: 'Which stage does a Quick (L1) job skip?', options: ['Facts', 'Frames', 'Files'], answer: 1, why: 'L1 and L2 go straight from the brief to the build. Storyboards start at L3.' },
      { q: 'What does an animatic show?', options: ['The finished motion', 'Pacing: each board frame held for its planned time', 'The sound mix'], answer: 1, why: 'An animatic holds each frame for its planned time. It shows pacing, not motion.' },
      { q: 'Who answers the question at each gate?', options: ['You', 'The storyboard skill', 'The render engine'], answer: 0, why: 'Each stage ends at a gate with one question. You answer it; nobody else can.' },
    ] },
  { slug: 'gear-up', n: '03', title: 'Gear up', kicker: 'What has to be installed, and what you have to bring yourself.',
    quiz: [
      { q: 'The Studio Skill Pack is not installed. What does /storyboard do?', options: ['It still draws three boards', 'Nothing', 'It asks you to choose a tool'], answer: 1, why: 'The prompts drive the pack. Without it, /studio and /storyboard do nothing.' },
      { q: 'Where must your files be so the design apps can read them?', options: ['Anywhere on the computer', 'On the desktop', 'Inside the workspace, in a project folder'], answer: 2, why: 'The design apps read and write only inside the workspace.' },
    ] },
  { slug: 'run-the-play', n: '04', title: 'Run the play', kicker: 'Nine steps from an empty folder to a posted film.',
    quiz: [
      { q: 'Which of these is NOT a line of the Six-Line Brief?', options: ['Who', 'Never', 'Budget'], answer: 2, why: 'The six lines are What, Who, Where, Must, Never and Ask me.' },
      { q: 'You are improving a video that already exists. What comes before the storyboards?', options: ['A diagnosis of what holds it back', 'A new logo', 'The delivery pack'], answer: 0, why: 'For existing work, ask what is holding it back first. That list becomes the brief for the boards.' },
      { q: 'How many problems should one fix line carry?', options: ['As many as you can list', 'Three', 'One'], answer: 2, why: 'One fix line, one problem. A list of ten changes gets nine of them.' },
    ] },
  { slug: 'set-the-dials', n: '05', title: 'Set the dials', kicker: 'Level, look and delivery pack: three choices that shape every job.',
    quiz: [
      { q: 'What does choosing a higher level change?', options: ['How carefully the build is done', 'How much you decide and check before the build', 'The size of the video'], answer: 1, why: 'A level sets how much you decide before the build. The care taken in the build is the same at every level.' },
      { q: 'Which line sends any request to storyboards?', options: ['Show me some options first.', 'use all options', 'plan for me'], answer: 0, why: 'Add "Show me some options first." or start with /storyboard.' },
      { q: 'You need a silent version and a version with sound. When do you ask?', options: ['After delivery', 'In the build prompt', 'It is always made'], answer: 1, why: 'Ask now, not later. Asking later costs another pass.' },
    ] },
  { slug: 'when-x-happens', n: '06', title: 'When X happens, do Y', kicker: 'Routing for what you have. Fixes for what went wrong.',
    quiz: [
      { q: 'The three boards are one idea in three colours. What do you do?', options: ['Pick the nicest colour', 'Send them back and ask for a real choice', 'Build all three'], answer: 1, why: 'Three boards that differ only in colour are one idea. Send them back.' },
      { q: 'A build stopped at a usage limit. What do you type once it resets?', options: ['start', 'continue', 'plan for me'], answer: 1, why: 'Wait for the limit to reset, or switch model, then say "continue".' },
      { q: 'A Starter prompt went wrong. What is the safer second try?', options: ['Run it again unchanged', 'Ask for a plan first, correct the plan, then build', 'Switch to Showcase'], answer: 1, why: 'Run it as a plan first ("plan for me"), correct the plan, then build.' },
    ] },
];
