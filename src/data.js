// Mock data store for shlopp
// This will be replaced with real API calls later

const SECTIONS = [
  { id: 'sec-tech', name: '/tech/', type: 'section', color: '#4a9eff', description: 'technology, programming, gadgets' },
  { id: 'sec-politics', name: '/politics/', type: 'section', color: '#ff4a4a', description: 'politics, policy, government' },
  { id: 'sec-art', name: '/art/', type: 'section', color: '#ff9f4a', description: 'visual art, design, photography' },
  { id: 'sec-music', name: '/music/', type: 'section', color: '#b44aff', description: 'music, albums, production' },
  { id: 'sec-cs', name: '/cs/', type: 'section', color: '#4aff9f', description: 'computer science, algorithms, theory' },
  { id: 'sec-adult', name: '/adult/', type: 'section', color: '#ff4a9f', description: '18+ content' },
  { id: 'sec-food', name: '/food/', type: 'section', color: '#ffcf4a', description: 'cooking, restaurants, recipes' },
];

const MOCK_POSTS = [
  { id: 'p1', author: 'throwaway42', text: 'anyone else think the new macbook pro is just a slightly faster version of last year? like what are we even paying for at this point. the M-series chips peaked at M2 and everything after is just marketing.', timestamp: Date.now() - 86400000 * 7, edits: [] },
  { id: 'p2', author: 'kernelpanic', text: 'disagree hard. the M4 neural engine is genuinely different for local LLM inference. i can run 70B models on a laptop now. that was impossible 2 years ago. you\'re just not using it right.', timestamp: Date.now() - 86400000 * 6.5, edits: [] },
  { id: 'p3', author: 'anon99', text: 'just finished implementing a B-tree from scratch in Rust. took me 3 weeks. the borrow checker nearly killed me but i finally understand why databases work the way they do. ask me anything.', timestamp: Date.now() - 86400000 * 6, edits: [] },
  { id: 'p4', author: 'rustacean', text: 'nice. did you handle concurrent reads? that\'s where it gets really painful with the borrow checker. i ended up using Arc<RwLock<>> everywhere and it felt wrong.', timestamp: Date.now() - 86400000 * 5.8, edits: [] },
  { id: 'p5', author: 'midnightcoder', text: 'hot take: we should teach discrete math before teaching programming. half the bugs i see at work are from people who don\'t understand basic logic or set theory. coding is the easy part.', timestamp: Date.now() - 86400000 * 5.5, edits: [] },
  { id: 'p6', author: 'dropout_dev', text: 'counterpoint: i dropped out and learned to code by building things. never took a math class past algebra. currently making 180k. theory is overrated for most jobs.', timestamp: Date.now() - 86400000 * 5.2, edits: [] },
  { id: 'p7', author: 'artfreak', text: 'just spent 6 hours in the MET staring at the Rothko room. there\'s something about those color fields that hits completely different in person vs on a screen. the scale matters. the texture matters. pixels can\'t do it.', timestamp: Date.now() - 86400000 * 5, edits: [] },
  { id: 'p8', author: 'pixelpusher', text: 'been experimenting with generative art using nothing but CSS gradients and blend modes. no JS, no canvas, just pure CSS. the results are surprisingly organic. might post a gallery.', timestamp: Date.now() - 86400000 * 4.8, edits: [] },
  { id: 'p9', author: 'beatmaker', text: 'unpopular opinion: the 808 is the most important instrument of the 21st century. every genre has been touched by it. rock, pop, country, everything. roland accidentally created the universal language of rhythm.', timestamp: Date.now() - 86400000 * 4.5, edits: [] },
  { id: 'p10', author: 'vinylhead', text: 'just copped the new burial EP on white label. the man hasn\'t lost it. still making music that sounds like 3am rain on a london bus window. genre is irrelevant when you\'re this consistent.', timestamp: Date.now() - 86400000 * 4.2, edits: [] },
  { id: 'p11', author: 'politico', text: 'the fact that we\'re still debating whether social media companies should moderate content in 2026 is insane. the question was answered 5 years ago. the real question is who watches the moderators.', timestamp: Date.now() - 86400000 * 4, edits: [] },
  { id: 'p12', author: 'fencesitter', text: 'both sides of the moderation debate have valid points and i\'m tired of pretending otherwise. free speech absolutism is naive. total moderation is authoritarian. the answer is somewhere in the middle and it\'s complicated.', timestamp: Date.now() - 86400000 * 3.8, edits: [] },
  { id: 'p13', author: 'homecook', text: 'made proper tonkotsu ramen from scratch today. 18 hour pork bone broth. hand-pulled noodles. marinated eggs. the whole thing. my kitchen looks like a crime scene but the bowl was transcendent.', timestamp: Date.now() - 86400000 * 3.5, edits: [] },
  { id: 'p14', author: 'michelinsnob', text: 'unpopular opinion: most "elevated" street food at fancy restaurants is worse than the actual street food. a $28 taco is almost never better than a $3 one from a cart in mexico city.', timestamp: Date.now() - 86400000 * 3.2, edits: [] },
  { id: 'p15', author: 'lambda_calc', text: 'if you really understand the lambda calculus you understand all of computation. everything else is syntactic sugar. church encoding, Y combinator, continuation passing — it\'s all there in three rules.', timestamp: Date.now() - 86400000 * 3, edits: [] },
  { id: 'p16', author: 'pragmatist', text: 'cool but can the lambda calculus help me center a div? theory people live in a different universe. the gap between PL research and actual software engineering is a canyon.', timestamp: Date.now() - 86400000 * 2.8, edits: [] },
  { id: 'p17', author: 'throwaway42', text: 'update on the macbook take: i tried running local whisper on my M3 vs my friend\'s M4. ok fine the difference is real. 3x faster transcription. i was wrong. still overpriced though.', timestamp: Date.now() - 86400000 * 2.5, edits: [{ text: 'update: i tried running local whisper on M3 vs M4. the difference is real. 2x faster.', timestamp: Date.now() - 86400000 * 2.6 }] },
  { id: 'p18', author: 'nightowl', text: 'there\'s a specific kind of creativity that only exists between 2am and 5am. the inner critic goes to sleep and pure ideas come through. every good thing i\'ve ever made happened in that window.', timestamp: Date.now() - 86400000 * 2.3, edits: [] },
  { id: 'p19', author: 'beatmaker', text: 'just dropped a beat tape made entirely from field recordings of NYC subway stations. every kick is a turnstile click, every hi-hat is a metrocard swipe. the city is an instrument if you listen.', timestamp: Date.now() - 86400000 * 2, edits: [] },
  { id: 'p20', author: 'anon99', text: 'follow up on the B-tree post: i benchmarked it against SQLite\'s btree and mine is only 4x slower. considering SQLite has had 20 years of optimization, i\'m calling that a win.', timestamp: Date.now() - 86400000 * 1.8, edits: [] },
  { id: 'p21', author: 'web3skeptic', text: 'blockchain is just a linked list with extra steps and worse performance. change my mind. i\'ve been in tech for 15 years and i still don\'t see a real use case beyond speculation.', timestamp: Date.now() - 86400000 * 1.5, edits: [] },
  { id: 'p22', author: 'cryptobro', text: 'the use case is trustless coordination. you don\'t need blockchain for a database. you need it when multiple parties who don\'t trust each other need to agree on state. that\'s a real problem.', timestamp: Date.now() - 86400000 * 1.3, edits: [] },
  { id: 'p23', author: 'artfreak', text: 'went to a gallery opening where the artist literally just printed out AI-generated images on canvas. no curation, no concept, just midjourney outputs in expensive frames. the art world is cooked.', timestamp: Date.now() - 86400000 * 1.1, edits: [] },
  { id: 'p24', author: 'pixelpusher', text: 'the CSS generative art gallery is live. 12 pieces, all pure CSS. some of them take a few seconds to render because the blur filters are heavy. worth the wait though. link in my profile.', timestamp: Date.now() - 86400000 * 0.9, edits: [] },
  { id: 'p25', author: 'homecook', text: 'pro tip: if your scrambled eggs are "done" in the pan, they\'re overdone on the plate. take them off when they still look slightly wet. residual heat finishes the job. gordon ramsay was right about this one.', timestamp: Date.now() - 86400000 * 0.7, edits: [] },
  { id: 'p26', author: 'midnightcoder', text: 'wrote a proof that P != NP while sleep deprived at 4am. woke up and realized i assumed something that\'s basically equivalent to P != NP. the millennium prize remains unclaimed.', timestamp: Date.now() - 86400000 * 0.5, edits: [] },
  { id: 'p27', author: 'politico', text: 'local elections matter more than national ones for your daily life and yet turnout is like 15%. your city council member decides whether your street gets repaved. the president does not.', timestamp: Date.now() - 86400000 * 0.3, edits: [] },
  { id: 'p28', author: 'kernelpanic', text: 'just discovered that my production server has been running on swap for 3 weeks and nobody noticed because the SSD is fast enough that latency barely changed. modern hardware covers so many sins.', timestamp: Date.now() - 86400000 * 0.2, edits: [] },
  { id: 'p29', author: 'vinylhead', text: 'the algorithm will never recommend you the thing that actually changes your life. that always comes from a friend, a stranger at a record store, or a random link at 3am. discovery should be human.', timestamp: Date.now() - 86400000 * 0.1, edits: [] },
  { id: 'p30', author: 'lambda_calc', text: 'just taught my intro CS class about recursion using the fibonacci sequence. watched 40 students simultaneously have the "wait, it calls ITSELF?" moment. best part of this job.', timestamp: Date.now() - 3600000 * 5, edits: [] },
  { id: 'p31', author: 'dropout_dev', text: 'you know what nobody tells you about self-teaching? the hardest part isn\'t learning. it\'s knowing what to learn next. there\'s no syllabus. you just wander until something clicks.', timestamp: Date.now() - 3600000 * 3, edits: [] },
  { id: 'p32', author: 'nightowl', text: 'just realized the graph structure of this site is basically how my brain works. everything connected to everything else. no hierarchy, just associations. this is how thinking actually works.', timestamp: Date.now() - 3600000 * 2, edits: [] },
  { id: 'p33', author: 'fencesitter', text: 'the best political discussions happen when people talk about specific policies instead of vibes. "should we increase the minimum wage to $18" is a better question than "do you care about workers."', timestamp: Date.now() - 3600000 * 1, edits: [] },
  { id: 'p34', author: 'michelinsnob', text: 'fermentation is the most underrated cooking technique. kimchi, sourdough, miso, hot sauce — all just patience + bacteria. nature does the work if you give it time.', timestamp: Date.now() - 1800000, edits: [] },
  { id: 'p35', author: 'rustacean', text: 'hot take: the best programming language is the one your team already knows. i\'ve seen more projects fail from unnecessary rewrites than from using a "bad" language.', timestamp: Date.now() - 900000, edits: [] },
];

const MOCK_CONNECTIONS = [
  // Posts to sections
  { source: 'p1', target: 'sec-tech' },
  { source: 'p2', target: 'sec-tech' },
  { source: 'p3', target: 'sec-cs' },
  { source: 'p3', target: 'sec-tech' },
  { source: 'p4', target: 'sec-cs' },
  { source: 'p5', target: 'sec-cs' },
  { source: 'p5', target: 'sec-tech' },
  { source: 'p6', target: 'sec-tech' },
  { source: 'p7', target: 'sec-art' },
  { source: 'p8', target: 'sec-art' },
  { source: 'p8', target: 'sec-tech' },
  { source: 'p9', target: 'sec-music' },
  { source: 'p10', target: 'sec-music' },
  { source: 'p11', target: 'sec-politics' },
  { source: 'p12', target: 'sec-politics' },
  { source: 'p13', target: 'sec-food' },
  { source: 'p14', target: 'sec-food' },
  { source: 'p15', target: 'sec-cs' },
  { source: 'p16', target: 'sec-cs' },
  { source: 'p16', target: 'sec-tech' },
  { source: 'p17', target: 'sec-tech' },
  { source: 'p18', target: 'sec-art' },
  { source: 'p19', target: 'sec-music' },
  { source: 'p19', target: 'sec-art' },
  { source: 'p20', target: 'sec-cs' },
  { source: 'p20', target: 'sec-tech' },
  { source: 'p21', target: 'sec-tech' },
  { source: 'p22', target: 'sec-tech' },
  { source: 'p23', target: 'sec-art' },
  { source: 'p24', target: 'sec-art' },
  { source: 'p24', target: 'sec-tech' },
  { source: 'p25', target: 'sec-food' },
  { source: 'p26', target: 'sec-cs' },
  { source: 'p27', target: 'sec-politics' },
  { source: 'p28', target: 'sec-tech' },
  { source: 'p29', target: 'sec-music' },
  { source: 'p30', target: 'sec-cs' },
  { source: 'p31', target: 'sec-tech' },
  { source: 'p31', target: 'sec-cs' },
  { source: 'p32', target: 'sec-tech' },
  { source: 'p33', target: 'sec-politics' },
  { source: 'p34', target: 'sec-food' },
  { source: 'p35', target: 'sec-tech' },
  { source: 'p35', target: 'sec-cs' },

  // Reply chains (post to post)
  { source: 'p2', target: 'p1' },
  { source: 'p4', target: 'p3' },
  { source: 'p6', target: 'p5' },
  { source: 'p12', target: 'p11' },
  { source: 'p16', target: 'p15' },
  { source: 'p17', target: 'p1' },
  { source: 'p17', target: 'p2' },
  { source: 'p20', target: 'p3' },
  { source: 'p20', target: 'p4' },
  { source: 'p22', target: 'p21' },
  { source: 'p24', target: 'p8' },
  { source: 'p26', target: 'p5' },
  { source: 'p29', target: 'p9' },
  { source: 'p31', target: 'p6' },
  { source: 'p31', target: 'p5' },
  { source: 'p33', target: 'p12' },
  { source: 'p33', target: 'p27' },
  { source: 'p34', target: 'p13' },
  { source: 'p35', target: 'p3' },
];

// Saved node positions (simulating server-persisted layout)
const SAVED_POSITIONS = {
  'sec-tech': { x: 0, y: 0 },
  'sec-politics': { x: 500, y: -300 },
  'sec-art': { x: -500, y: -200 },
  'sec-music': { x: -400, y: 300 },
  'sec-cs': { x: 300, y: -350 },
  'sec-adult': { x: 600, y: 300 },
  'sec-food': { x: -200, y: 400 },
};

let currentUser = null;
let posts = [...MOCK_POSTS];
let connections = [...MOCK_CONNECTIONS];
let nextId = 36;

// Compute incoming connection count for each node
function computeIncoming() {
  const counts = {};
  for (const c of connections) {
    counts[c.target] = (counts[c.target] || 0) + 1;
  }
  return counts;
}

export function getSections() {
  return SECTIONS;
}

export function getPosts() {
  return posts;
}

export function getConnections() {
  return connections;
}

export function getPost(id) {
  return posts.find(p => p.id === id);
}

export function getSection(id) {
  return SECTIONS.find(s => s.id === id);
}

export function getNode(id) {
  return getPost(id) || getSection(id);
}

export function getIncomingCounts() {
  return computeIncoming();
}

export function getNodesAndEdges() {
  const incoming = computeIncoming();

  const nodes = [
    ...SECTIONS.map(s => ({
      ...s,
      incoming: incoming[s.id] || 0,
      radius: 28 + Math.min((incoming[s.id] || 0) * 1.5, 20),
      savedX: SAVED_POSITIONS[s.id]?.x,
      savedY: SAVED_POSITIONS[s.id]?.y,
    })),
    ...posts.map(p => {
      const sectionEdge = connections.find(c => c.source === p.id && c.target.startsWith('sec-'));
      const section = sectionEdge ? SECTIONS.find(s => s.id === sectionEdge.target) : SECTIONS[0];
      return {
        ...p,
        type: 'post',
        incoming: incoming[p.id] || 0,
        radius: 5 + Math.min((incoming[p.id] || 0) * 2.5, 14),
        color: section.color,
        sectionId: section.id,
      };
    }),
  ];

  const edges = connections.map(c => ({
    source: c.source,
    target: c.target,
  }));

  return { nodes, edges };
}

export function getConnectionsForNode(nodeId) {
  const outgoing = connections.filter(c => c.source === nodeId).map(c => c.target);
  const incoming = connections.filter(c => c.target === nodeId).map(c => c.source);
  return { outgoing, incoming };
}

export function createPost(text, parentIds) {
  if (!currentUser) return null;
  const id = `p${nextId++}`;
  const post = {
    id,
    author: currentUser,
    text,
    timestamp: Date.now(),
    edits: [],
  };
  posts.unshift(post);
  for (const parentId of parentIds) {
    connections.push({ source: id, target: parentId });
  }
  return post;
}

export function addConnectionToPost(sourceId, targetId) {
  // Check if connection already exists
  const exists = connections.some(c => c.source === sourceId && c.target === targetId);
  if (exists) return false;
  connections.push({ source: sourceId, target: targetId });
  return true;
}

export function editPost(postId, newText) {
  const post = posts.find(p => p.id === postId);
  if (!post || post.author !== currentUser) return false;
  post.edits.push({ text: post.text, timestamp: Date.now() });
  post.text = newText;
  return true;
}

export function login(username, password) {
  // Mock auth — just set the username
  currentUser = username;
  return { username };
}

export function signup(username, password) {
  currentUser = username;
  return { username };
}

export function logout() {
  currentUser = null;
}

export function getCurrentUser() {
  return currentUser;
}

export function getAllUsers() {
  const users = new Set();
  for (const p of posts) users.add(p.author);
  return [...users];
}
