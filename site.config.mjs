// site.config.mjs - the few things you are likely to change. Edit, then run: npm run build
export default {
  name: 'Frames Before Film',
  tagline: 'Direct videos, ads and graphics with one prompt at a time.',
  description: 'A hands-on course and prompt library for making motion and graphics with Claude Code: six short lessons, 42 prompts, and the real output of each one.',

  // The address the site will live at, with no slash at the end (for example https://framesbeforefilm.com).
  // Leave it empty until you know it: the site works without it, but link previews and the sitemap need it.
  url: '',

  // 'full'   every prompt is shown and can be filled in and copied.
  // 'teaser' only the opening of each prompt is shown, with a button that leads to buyUrl.
  //          Cards listed in freeCards stay fully open, as free samples.
  promptMode: 'full',
  freeCards: ['M1', 'G3', 'M7'],

  // Where people get the full manual and the Studio Skill Pack. Leave empty to hide the button.
  buyUrl: '',
  buyLabel: 'Get the manual',

  // Links shown in the "Gear up" lesson. An empty link shows no link.
  links: {
    claudeCode: 'https://claude.com/claude-code',
    node: 'https://nodejs.org',
    whisperx: 'https://github.com/m-bain/whisperX',
    skillPack: '',
    plan: '',
  },

  footerNote: 'Every brand, school, app and person named in the examples is invented. None of the work shown is client work.',
};
