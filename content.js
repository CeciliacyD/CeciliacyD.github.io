/* ============================================
   ✿ 网站内容配置 — 你平时主要改这个文件！
   ============================================ */

const SITE_CONTENT = {

  // 网站名字（首页大标题 + 浏览器标签页名）
  siteName: "Cecilia's World",

  // 「关于我」
  about:
    "嗨，我是 Cecilia 🎀\n" +
    "喜欢一切软软的、温柔的东西。\n" +
    "最近睡得很好，每天都元气满满。\n" +
    "这个小角落会一直慢慢布置下去。",

  // 关于我框里的表情
  aboutPhoto: "🎀",

  // 频道小按键：点一下就打开对应的页面（url 留空 "" 就是普通标签）
  // 网页上也能在"编辑"模式里自由增删
  channels: [
    { icon: "🎀", label: "丝带" },
    { icon: "🪻", label: "绣球花" },
    { icon: "☕", label: "下午茶" },
    { icon: "📖", label: "小书" },
    { icon: "✨", label: "新点子" },
    { icon: "📷", label: "小日常", url: "./daily.html" },
    { icon: "💌", label: "给我留言", url: "./wall.html" }
  ],

  // 小日常的初始纸条（照片留空 "" 就是纯文字卡）
  // 网页上也可以直接"贴一张新纸条"添加，会存在浏览器里
  daily: [
    { img: "", text: "睡得很好，每天都元气满满地醒来 ☁" },
    { img: "", text: "下午茶配一本旧书，是最温柔的时间 ☕" },
    { img: "", text: "今天路过花店，绣球花开得正好 🪻" }
  ],

  // 留言墙的固定纸条
  seededNotes: [
    { name: "小蝴蝶", text: "路过你的房间，好温柔呀" },
    { name: "Léa", text: "Bonjour ~ 好喜欢这个角落" },
    { name: "星星", text: "常来坐坐 ✧" }
  ],

  // 悄悄话：只有输入暗号才能看到的留言
  whisperPassword: "apple",
  whispers: [
    { name: "Léa", text: "其实那天收到你的明信片，我开心了一整天" }
  ],

  // 官方 YouTube 音乐视频 ID（播放器会嵌入 YouTube；访客需要点击播放）
  youtubeMusicVideoId: "WnUR3be5Ebk",

  // 本地音乐文件备用配置：文件放在 music/ 目录下，如 ["song1.mp3"]
  music: []
};
