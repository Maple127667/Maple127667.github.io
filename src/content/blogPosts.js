export const BLOG_POSTS = [
  {
    id: "2026-08-03",
    slug: "2026-08-03",
    href: "/blog/2026-08-03",
    title: "直到大地变成一颗酸橙！",
    date: "2026-08-03",
    kind: "日常",
    excerpt: "酸橙味照片生成器！很好玩",
    body: [
      {
        type: "paragraph",
        text: "直到大地变成一颗酸橙！",
      },
      {
        type: "paragraph",
        variant: "date-note",
        text: "原片照于2024-5-31",
      },
      {
        type: "image",
        image: {
          src: "/assets/blog/2026-08-03/original-flight.webp",
          alt: "从飞机舷窗看向云海，画面上叠有‘直到大地变成一颗酸橙’的手写标题与纸飞机角色",
          width: 960,
          height: 720,
        },
      },
      {
        type: "paragraph",
        text: "酸橙味照片生成器！很好玩",
      },
      {
        type: "image",
        variant: "compact",
        image: {
          src: "/assets/blog/2026-08-03/lime-generator.webp",
          alt: "浅蓝色背景上的‘直到照片变成一瓶酸橙’手写标题",
          width: 501,
          height: 203,
        },
      },
      {
        type: "external-link",
        href: "https://orange.colanns.me/?_wv=1",
        label: "orange.colanns.me",
      },
    ],
  },
  {
    id: "2025-10-01",
    slug: "2025-10-01",
    href: "/blog/2025-10-01",
    title: "2025-10-01 随笔",
    date: "2025-10-01",
    kind: "随笔",
    excerpt: "在通宵以后总是特别的想要写点什么",
    body: [
      "在通宵以后总是特别的想要写点什么",
      "或许是夕阳的光拍碎了情绪的海，波光粼粼成了转瞬的浪\n但是又想捕捉刹那的光影，或许名为情绪，虚幻又转瞬即逝",
      "情感是这样的，会在沙滩上留下短暂的踪迹，又会被新的浪花覆写，就算是拍一张照，也只是浪花的片刻留影，并不是活灵活现的真实",
      "没有人记得住大海里的每一朵浪花，没有人记得下自己的每一缕心思，但是将现在的浪花和夕阳拓下也并无不可\n浪花也并非没有踪迹，只是太小一朵，细细密密堆积起来才成了回忆的海\n言藻多是华丽堆砌，情感或有矫揉造作\n心有所感，絮絮叨叨而作",
    ],
  },
  {
    id: "2023-10-12",
    slug: "2023-10-12",
    href: "/blog/2023-10-12",
    title: "致抵达旅途终点的人们——星空列车与白的旅行设定＆彩蛋",
    titleLines: ["致抵达旅途终点的人们", "——星空列车与白的旅行设定＆彩蛋"],
    date: "2023-10-12",
    kind: "游戏随笔",
    excerpt: "关于《星空列车与白的旅行》的世界观、人物设定，以及藏在旅途中的一些小细节。",
    opening: {
      label: "写在前面",
      text: "非常荣幸能和大家一起参与到本书的编撰之中！怜狸老师的字也很可爱！",
      images: [
        {
          src: "/assets/blog/2023-10-12/book-cover.webp",
          alt: "印有猫耳少女与“我和 Galgame 的故事”文字的实体书封面",
          width: 720,
          height: 960,
          caption: "收到实体书的那一天。",
        },
        {
          src: "/assets/blog/2023-10-12/book-note.webp",
          alt: "实体书内附的手写祝福、签名与蓝色人物涂鸦",
          width: 800,
          height: 783,
          caption: "怜狸老师留下的字和小画。",
        },
      ],
    },
    contents: [
      { id: "world-and-characters", label: "世界观与人物设定" },
      { id: "references-and-tributes", label: "引用、名词与致敬" },
      { id: "small-details", label: "小彩蛋与小细节" },
      { id: "reference-images", label: "文中提到的画面" },
    ],
    body: [
      {
        type: "paragraph",
        variant: "notice",
        text: "首先呢，我希望看到这篇文章的人都是已经看完《星空列车与白的旅行》这部有声小说的人，因为这篇文章涉及到许多剧情和人物设定，拜托了！",
      },
      {
        type: "paragraph",
        text: "本作是一个单纯疼爱猫耳少女的故事（さかき傘老师原话），但是在猫耳少女、璀璨的星海外，还有一段以救赎为名的故事。星空列车可以看作夜羽真白的梦境或者一个神奇的精神世界，众人在星空列车上，完成一场对生命的救赎之旅，让夜羽真白重新燃起对生活的希望。而与此同时的现实生活中，夜羽真白正处于器官移植的手术和恢复期中，这些移植器官的来源也正是列车上的乘客们。",
      },
      {
        type: "quote",
        text: "世界是一个宝石箱，装满了熠熠生辉的宝石的宝石箱，所以我希望你去亲眼看看它，替没有珍惜过这个世界的我，去看看这个美好的世界。这或许是晓、花江、鹰世、野鸟这些大人们共同的期待：“比起单纯的拯救生命，让人燃起对生活的希望更是不可缺少的。”",
      },
      {
        type: "section",
        id: "world-and-characters",
        title: "关于世界观和设定的一些解答",
        intro: "大家比较关心的问题",
        blocks: [
          {
            type: "subsection",
            title: "关于狩叶·朗姆柯妮在作品中的设定",
            blocks: [{
              type: "paragraph",
              text: "狩叶是星空列车上的乘务员，在现实中代表了真白的血液，本名是猫村春香。作为夜羽真白护士的妹妹，时常在医院玩，也经常会去献血（赠品是妙乐多），但是在日本一个人三个月只能献血一次。而春香就使用了狩叶·朗姆柯妮的化名献血来多次献血。所以流淌在夜羽真白体内的血液也就是狩叶·朗姆柯妮啦。",
            }],
          },
          {
            type: "subsection",
            title: "白色的诺瓦在列车中是什么位置，为什么会攻击大家？",
            blocks: [{
              type: "paragraph",
              text: "结合上下文，既然众人是依靠器官捐献过来的，那么白色的诺瓦（夜羽真白形象）则是身体内的免疫机制，向新的器官发出攻击（排异反应）。其中白色诺瓦说的“滚出去，这是不可以饶恕的！”这里不仅有排异反应的因素，还有真白母亲给她灌输的“可不能夺走别人的东西”的极端维根主义理念存在于真白心中，排斥移植的器官（映照着车上的众人），厌恶靠别人器官而活着的自己，加重对器官的排异反应。故白色的诺瓦就是免疫系统。",
            }],
          },
          {
            type: "subsection",
            title: "为什么狩叶会变成真白？",
            blocks: [{
              type: "paragraph",
              text: "承接上文，真白，或者说车上的白色诺瓦是免疫系统，在旅程的最后，猫村春香献的血逐渐被夜羽真白这具身体所同化，所以代表血液的狩叶便成为了代表免疫系统的白色诺瓦的化身。",
            }],
          },
          {
            type: "subsection",
            title: "狩叶还会记得诺瓦吗？",
            blocks: [
              {
                type: "paragraph",
                text: "很遗憾的是不会，因为互相认识的是狩叶和诺瓦，猫村春香并没有星空列车上的记忆，所以猫村春香不会认识诺瓦，但是猫村春香当然是认识夜羽真白啦。",
              },
              {
                type: "paragraph",
                text: "猫村春香的姐姐猫村秋穗是夜羽真白的护士，而猫村春香也经常呆在医院里。夜羽真白还会努力地完成和白先生的承诺——交一个朋友。医院里也很少有同年龄段的小孩，那么看来就是对猫村春香下手啦～之后她们应该会成为朋友吧。不过猫村跳脱的性格和真白安静的性格真是鲜明的对比，这种反差也是一种有趣的点吧～（PS：想看后日谈）",
              },
            ],
          },
          {
            type: "subsection",
            title: "列车站员是谁？",
            blocks: [{
              type: "paragraph",
              text: "其实相信大部分人已经猜出来了，就是诺瓦的爷爷。在旅程中一直默默地陪伴诺瓦，并且为众人的旅途提供帮助。在小笠原群岛海边准备烧烤材料的时候说了：“这样啊，要吃烤肉啊。拜托了，这是必要的事情。”而诺瓦在后续中也提及：“妈妈禁止吃肉，但是爷爷经常说吃肉会比较好。”",
            }],
          },
          {
            type: "subsection",
            title: "大家的死亡原因是什么呢？",
            blocks: [{
              type: "list",
              items: [
                "钟城晓——死于酗酒和中暑（来源：旁白画外音中提及）",
                "鹰世——死于上吊（来源：时常提起压力大和不时摸脖子）",
                "野鸟——死于失温疾病（来源：在旅途尾声野鸟表现出失温症状，之前也有提及这个旧疾）",
                "花江——死于一氧化碳中毒（来源：旁白画外音中提及）",
              ],
            }],
          },
          {
            type: "subsection",
            title: "大家捐献的器官都是什么呢？",
            blocks: [
              {
                type: "list",
                items: ["音理是心脏", "晓是肝脏", "野鸟是胃", "花江是脾脏", "鹰世是肾脏和肺部"],
              },
              {
                type: "paragraph",
                text: "推理如下：鹰世在游戏中有提及自己捐献的是肾脏和肺部，而根据人体的血液循环依次经过的器官是：心脏、肝脏、胃、脾脏、肾脏、肺部。将真白的身体比作星空列车，车厢的排名是音理、晓、野鸟、花江、鹰世，可以一一对应。",
              },
            ],
          },
        ],
      },
      {
        type: "section",
        id: "references-and-tributes",
        title: "引用的小故事、名词和致敬",
        blocks: [
          { type: "paragraph", text: "山猫轩的故事出自《要求繁多的餐厅》，是《宫泽贤治童话集》中的一篇，在童话集中还收录了《银河铁道之夜》。" },
          { type: "paragraph", text: "To be or not to be 出自莎士比亚创作的话剧《哈姆雷特》，是文中一段很经典的独白，其中文翻译为“生存还是毁灭”，其后一句是 that is a question（这是一个问题）。由于其过于出名且经典，很好地表现了花江热爱话剧的一面。" },
          { type: "paragraph", text: "SL 蒸汽列车外形原型是 C59 型蒸汽列车，目前停放在福冈九州铁道博物馆，而内部装潢应该是参照 JR 山口号蒸汽列车（C57）。JR 山口号列车 1937 年开始运行，在 1979 年因为铁路现代化停运，但是在铁路爱好者的强烈意愿下，列车于 1979 年 8 月复驶至今，其内部装潢与游戏内部基本一致。" },
          { type: "paragraph", text: "日本北海道函馆是花江的家乡。实际上并没有一个著名的星象馆，但是函馆的函馆山夜景被评为世界三大夜景之一，吸引了不少游客前往。星象馆原型或许是坐落于岩手的宫泽贤治童话村内的星象陈列室。" },
          { type: "paragraph", text: "《银河铁道之夜》有同名动画版和电影版，而二创的漫画版把男主和男二都变成了女孩子。较为出名的致敬作品有《银河铁道 999》，有漫画和电视动画。其中日本漫画家相生青唯也创作了致敬《银河铁道之夜》的东方 Project 二创作品《银河铁道与星之魔法使》，《千与千寻》中铁道的画面也是借鉴于《银河铁道之夜》。而致敬《银河铁道之夜》的作品远不止这些，也包括本作。" },
          { type: "paragraph", text: "读者可能对宫泽贤治不太熟悉，甚至听说过他名字的都不多。但是宫泽贤治在日本是家喻户晓的。毫不夸张地说，日本近现代很多艺术家都是读着宫泽贤治的童话长大的，宫崎骏就很喜欢宫泽贤治的童话，还有《千与千寻》中对《银河铁道之夜》的致敬，甚至于宫泽贤治的《不畏风雨》还被收录于小学课本中。宫泽贤治诞辰 120 周年，日本专门成立了宫泽贤治诞辰 120 周年纪念事务执行委员会。称其为国民童话家也不为过，所以《银河铁道之夜》《要求繁多的餐厅》等故事都是日本人耳熟能详的故事。" },
        ],
      },
      {
        type: "section",
        id: "small-details",
        title: "小彩蛋 & 小细节",
        blocks: [
          { type: "paragraph", text: "第一次列车不能正常运转，是鹰世打开了关闭的输气口，恢复通气让列车重新运行下去。这也是鹰世代表的肺脏的本职工作。或许每次火车停下都暗示着外界真白身体状况的一次坎坷，而每个场景都是真白接纳一个人的证明——在故事的最后，点燃的炉火似乎再也不会熄灭，属于音理的心脏也不会停止跳动，或许车辆也不会停下了吧？" },
          { type: "paragraph", text: "男主角晓的老家是岩手县，是宫泽贤治的出生地。" },
          { type: "paragraph", text: "猫村春香（狩叶）的姐姐名字只出现过一次，叫猫村秋穗。虽然戏份不多，但是非常温柔的护士姐姐，大家是不是都很有印象呢？" },
          { type: "paragraph", text: "鹰世说感觉到列车不对劲的时候就已经有不舒服的感觉了，而他是上吊身亡的，所以有摸颈后的习惯，而不是他本身就有的习惯性动作。晓第一次看见鹰世的时候，鹰世已经开始摸颈后了，也就是晓还没上车，鹰世就感觉不对劲了，不愧是智囊先生。而野鸟小姐到最后都还是迷迷糊糊的，很好地符合了迷迷糊糊的性格。" },
          { type: "paragraph", text: "其实在挪威旅行后的第一次睡眠，晓就已经借着真白的身体短暂地醒过一次，说床上有熊、鲸鱼、兔子的玩偶。但是在背景画中床上只有两只熊，床头有两只兔子，但是没有鲸鱼，鲸鱼桑去哪里了呢？" },
          { type: "paragraph", text: "音理其实一直陪伴在众人身旁，暗示着、引导着大家。早在挪威的森林那一站，敏锐的花江小姐就已经注意到了音理出现的踪迹。" },
          { type: "paragraph", variant: "ending", text: "在众人为了真白的生命而努力的时候，这趟旅行也让他们解开了心中的郁结，找回了自己的本心。晓在音理发生意外后的消沉，花江失意后的自暴自弃，鹰世在极大压力后的绝望，野鸟被病痛折磨——毫无疑问，他们都曾经对世界失望。但是，在旅途的终点，他们都找回了属于自己的本心。生命本就是值得尊重的，世界本就是美好的。或许有许多坎坷消磨掉你的本心，作为陪伴他们抵达旅途终点的你，又能否在这段旅途中，找回最单纯和最纯粹的那份感动呢？" },
        ],
      },
      {
        type: "gallery",
        id: "reference-images",
        title: "文中提到的画面",
        images: [
          { src: "/assets/blog/2023-10-12/train-interior.webp", alt: "红色绒布座椅的复古蒸汽列车车厢内景", width: 820, height: 582, caption: "日本现今翻新后重新运行的复古蒸汽列车内饰。不作为交通工具，仅作为观光车与蒸汽机车爱好者的休憩。" },
          { src: "/assets/blog/2023-10-12/galaxy-railroad-night.webp", alt: "《银河铁道之夜》视觉图，蒸汽列车驶过蓝色星海", width: 689, height: 465, caption: "《银河铁道之夜》动画宣传海报，是大部分日本人都看过的经典，许多致敬画面也取景于此。" },
          { src: "/assets/blog/2023-10-12/spirited-away-train.webp", alt: "《千与千寻》中列车行驶在海面上的画面", width: 960, height: 507, caption: "《千与千寻》中致敬《银河铁道之夜》的片段。" },
          { src: "/assets/blog/2023-10-12/planetarium.webp", alt: "深蓝色星空主题展馆内景，墙面陈列星图装置", width: 960, height: 640, caption: "宫泽贤治童话村内的星象陈列馆。" },
          { src: "/assets/blog/2023-10-12/yamanekoken.webp", alt: "山猫轩餐厅建筑正面，屋顶映着蓝天白云", width: 960, height: 640, caption: "宫泽贤治童话村里的山猫轩饭馆——里面不会吃人（大概）。" },
        ],
      },
    ],
  },
  {
    id: "2022-05-04",
    slug: "2022-05-04",
    href: "/blog/2022-05-04",
    title: "[mcbe]关于漏斗的一些特性分析",
    date: "2022-05-04",
    kind: "游戏研究",
    excerpt: "从源码级别分析漏斗的行为，以及几个看起来像 bug 的特性是怎样产生的。",
    contents: [
      { id: "hopper-range", label: "一、漏斗的范围" },
      { id: "precision-underflow", label: "二、精度下溢导致的高xz区域漏斗范围增大" },
      { id: "chunk-boundary", label: "3、区块边界限位失效问题的解释" },
      { id: "boundary-ownership", label: "4、区域边界的归属判定" },
      { id: "bug-fixes-bug", label: "5、bug修复了bug" },
    ],
    body: [
      {
        type: "paragraph",
        text: "由于漏斗的一些特性（bug）实在让人费解，所以我们拜托了@hhhxiao_从源码级别来分析了一下漏斗的行为，以此推断出了一些漏斗的特性（bug）成因。",
      },
      {
        type: "section",
        id: "hopper-range",
        title: "一、漏斗的范围",
        blocks: [
          {
            type: "paragraph",
            parts: [
              { type: "text", text: "在代码中，首先定义了漏斗的吸取范围为1*1*1，" },
              { type: "strong", text: "这个范围在漏斗上方是1*0.625*1，漏斗中1*0.375*1" },
              { type: "text", text: "（漏斗上表面碰撞箱有凹陷），在这之后，" },
              { type: "strong", text: "吸收范围往六个方向各收缩0.0001格，变为总体0.9998*0.9998*0.9998" },
              { type: "text", text: "。（如图）" },
            ],
          },
          {
            type: "image",
            variant: "compact",
            image: {
              src: "/assets/blog/2022-05-04/hopper-analysis/01-hopper-range.webp",
              alt: "漏斗吸取范围与漏斗内部凹槽的示意图",
              width: 391,
              height: 462,
              caption: "下陷的区域保证了在漏斗内凹的物品也能被吸入",
            },
          },
          {
            type: "paragraph",
            text: "如图，假设漏斗（灰色）吸取范围为1，漏斗应该会吸取到处于隔壁方块边界的物品（如图橙色方块），而漏斗实际范围是0.9998，所以物品与漏斗吸取范围没有接触，不会吸取到这个物品。成功的防止了“误吸入”。",
          },
          {
            type: "image",
            variant: "compact",
            image: {
              src: "/assets/blog/2022-05-04/hopper-analysis/02-boundary-gap.webp",
              alt: "物品与漏斗吸取范围之间保留微小间距的示意图",
              width: 391,
              height: 313,
              caption: "物品与漏斗范围之间隔了0.0001格",
            },
          },
        ],
      },
      {
        type: "section",
        id: "precision-underflow",
        title: "二、精度下溢导致的高xz区域漏斗范围增大",
        blocks: [
          {
            type: "paragraph",
            parts: [
              { type: "text", text: "在x.z坐标超过[-2049,+2048]（以下简称2048）的时候。" },
              { type: "strong", text: "因为精度下溢的问题，漏斗上方的吸取范围重新回到1*0.9998*1" },
              { type: "text", text: "（y轴并不可能超过2048）。这导致的问题就是漏斗可以不正确的吸取到处于旁边方块边界的物品。" },
            ],
          },
          {
            type: "paragraph",
            parts: [
              { type: "text", text: "（仅有x坐标超过[-2049,+2048]，而z坐标不超过[-2049,+2048]时，漏斗仅x轴范围扩大，变为（1*0.9998*0.9998），" },
              { type: "strong", text: "可得x，z坐标的计算是独立的" },
              { type: "text", text: "，当x，z坐标都超过[-2049,+2048]时，漏斗范围才会变为1*0.9998*1）" },
            ],
          },
          {
            type: "image",
            variant: "compact",
            image: {
              src: "/assets/blog/2022-05-04/hopper-analysis/03-high-coordinate-precision.webp",
              alt: "高坐标精度下溢后，擦边物品进入漏斗范围的示意图",
              width: 556,
              height: 450,
              caption: "消失的0.0001距离让擦边的物品能进入漏斗（图黄色方块）",
            },
          },
        ],
      },
      {
        type: "section",
        id: "chunk-boundary",
        title: "3、区块边界限位失效问题的解释",
        blocks: [
          {
            type: "paragraph",
            parts: [
              { type: "text", text: "在代码研究中可以发现，" },
              { type: "strong", text: "漏斗的吸取范围仅限于本区块" },
              { type: "text", text: "（漏斗遍历整个区块的实体）。也就是说，如果在区块边界（如图，漏斗和冰中间是区块边界）。" },
            ],
          },
          {
            type: "image",
            variant: "compact",
            image: {
              src: "/assets/blog/2022-05-04/hopper-analysis/04-chunk-boundary.webp",
              alt: "区块边界两侧的漏斗、冰面与掉落物位置示意图",
              width: 575,
              height: 360,
              caption: "掉落物实体坐标以中心为准，所以归属于左边的区块",
            },
          },
          {
            type: "paragraph",
            text: "由于掉落物的坐标判定以中心点为准，则掉落物在冰侧的区块，而漏斗在另一区块。漏斗无法读取到另一个区块的掉落物（因为漏斗只读取本区块的掉落物），即物品限位后漏斗无法吸取到物品——这就是常说的区块边界漏斗bug。",
          },
        ],
      },
      {
        type: "section",
        id: "boundary-ownership",
        title: "4、区域边界的归属判定",
        blocks: [
          { type: "paragraph", text: "区块、方块边界（以下简称区域边界），属于正方向的区域" },
          { type: "paragraph", text: "听不懂不要紧，我们来画个图。" },
          {
            type: "image",
            variant: "compact",
            image: {
              src: "/assets/blog/2022-05-04/hopper-analysis/05-positive-boundary.webp",
              alt: "区域边界归属于正坐标方向的示意图",
              width: 533,
              height: 297,
              caption: "正方向指x，z的正坐标（坐标增）方向",
            },
          },
          { type: "paragraph", text: "区域与区域之间有交界处，但是在游戏里面这个交界处却会带来麻烦——如果一个实体正好处于交界处，那么到底如何去判定实体在哪个区域。" },
          {
            type: "paragraph",
            parts: [
              { type: "text", text: "Mojang选择" },
              { type: "strong", text: "把边界归于正方向的区域" },
              { type: "text", text: "——也就是橙色区域。" },
            ],
          },
          { type: "paragraph", text: "那就是假如有个掉落物实体中心正好在两个区域中间，这个掉落物实体会被判定为属于正方向的区域（橙色），例如说摩擦因素取值会取正方向的方块的摩擦。" },
          { type: "paragraph", text: "了解了这点以后，我们再来看漏斗范围扩大和这个判定会产生什么奇妙的化学反应。" },
        ],
      },
      {
        type: "section",
        id: "bug-fixes-bug",
        title: "5、bug修复了bug",
        blocks: [
          {
            type: "paragraph",
            parts: [
              { type: "text", text: "Mojang对于漏斗所处位置的判定是将漏斗吸取范围边界的坐标截断为整数，然后加载坐标所处区块内所有掉落物。值得注意的是漏斗范围在2048外会被不正确的扩大到1，然后处于区块边界负方向侧漏斗的正方向边界已经与区块边界重合，而这个区块边界属于正方向的区块，即这个漏斗范围同时处于左右两个区块，" },
              { type: "strong", text: "这个跨区块的漏斗会吸取两个区块（在区块角落可能是三个）的掉落物" },
              { type: "text", text: "——即用bug去解决了区块边界的bug（特性）。" },
            ],
          },
          {
            type: "image",
            variant: "compact",
            image: {
              src: "/assets/blog/2022-05-04/hopper-analysis/06-expanded-chunk-range.webp",
              alt: "扩大的漏斗吸取范围跨越正方向区块边界的示意图",
              width: 503,
              height: 365,
              caption: "扩大的漏斗范围边界与正方向区块边界重合",
            },
          },
          { type: "paragraph", text: "但是反方向（漏斗在正方向侧）则不能加载到另一侧区块（因为区块边界所属问题，可以自己尝试分析）" },
          { type: "paragraph", text: "即在2048坐标外，区块边界的可用情况为" },
          {
            type: "image",
            variant: "compact",
            image: {
              src: "/assets/blog/2022-05-04/hopper-analysis/07-handwritten-summary.webp",
              alt: "区块边界可用方向的手绘总结图",
              width: 648,
              height: 547,
              caption: "学姐的珍贵手绘，斯哈斯哈",
            },
          },
        ],
      },
      {
        type: "section",
        id: "acknowledgements",
        title: "致谢与说明",
        blocks: [
          { type: "paragraph", text: "本次专栏主要是由 @hhhxiao_ 的代码研究推论而来，感谢学姐对游戏代码的挖掘让我们能更加深刻的理解游戏机制。" },
          {
            type: "paragraph",
            parts: [
              { type: "text", text: "本次专栏内容由车轴草@retrifolium 和影 @T0ShadowX 发现的bug延申讨论而成" },
              { type: "strike", text: "（最后延申的是不是有点太长了）" },
            ],
          },
          { type: "paragraph", text: "感谢@江雁苍穹 @钚钴鸟 @OEOTYAN 的大量猜想，讨论，测试。" },
          { type: "paragraph", text: "如果您对本文有异议或者发现勘误，请私信我，我会尽快改正。" },
          {
            type: "external-link",
            href: "https://www.bilibili.com/opus/656093590619947015",
            label: "在哔哩哔哩查看原文",
          },
        ],
      },
    ],
  },
];

export const FIRST_BLOG_POST = BLOG_POSTS[0];

export function getBlogPostBySlug(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}
