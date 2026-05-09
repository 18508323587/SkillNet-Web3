import { useState, useEffect } from 'react'
import axios from 'axios'
import { ethers } from 'ethers'
import type { Course } from './types'
import logoImg from './logo.png' 
import SkillBadgeData from './abi/SkillBadge.json' 

const NFT_CONTRACT_ADDRESS = "0x76bced64410c7992f88d1bad7003ec5d67eb4e7e03941fbe6755a706e6b984bd"; 
const NFT_CONTRACT_ABI = Array.isArray(SkillBadgeData) ? SkillBadgeData : (SkillBadgeData as any).abi;

const extractBvid = (url: string) => {
  if (!url) return '';
  const match = url.match(/(BV[a-zA-Z0-9]+)/);
  return match ? match[1] : '';
};

const mallItems = [
  { id: 1, name: 'Web3 黑客松专属 T恤', points: 300, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop' },
  { id: 2, name: '极客机械键盘键帽套装', points: 800, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop' },
  { id: 3, name: 'SkillNet 纪念版 NFT', points: 150, image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=400&auto=format&fit=crop' },
  { id: 4, name: 'GitHub Copilot 月度订阅', points: 750, image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=400&auto=format&fit=crop' },
  { id: 5, name: 'ChatGPT Plus 单月代付', points: 800, image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400&auto=format&fit=crop' },
  { id: 6, name: 'AWS 云服务 50刀代金券', points: 550, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400&auto=format&fit=crop' },
  { id: 7, name: 'Bilibili 大会员季卡', points: 400, image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop' },
  { id: 8, name: '罗技 G304 无线鼠标', points: 680, image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?q=80&w=400&auto=format&fit=crop' },
  { id: 9, name: '极客超大号定制鼠标垫', points: 250, image: 'https://images.unsplash.com/photo-1615663245857-ac931070b8b7?q=80&w=400&auto=format&fit=crop' }
];

const fallbackImages = [
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=600&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=600&auto=format&fit=crop'  
];

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'mall' | 'profile'>('home') 
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [userPoints, setUserPoints] = useState(0);
  const [earnHistory, setEarnHistory] = useState<any[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);

  const [showAllEarn, setShowAllEarn] = useState(false);
  const [showAllRedeem, setShowAllRedeem] = useState(false);

  const [recommendations, setRecommendations] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部') 
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isViewingVideo, setIsViewingVideo] = useState(true) 
  const [isMinting, setIsMinting] = useState(false)

  const currentUser = userAddress || "0x0000000000000000000000000000000000000000";

  const syncDataFromBackend = async (address: string) => {
    try {
      const addressKey = address.toLowerCase();
      
      try {
        const balanceRes = await axios.get(`http://localhost:3000/study/balance/${addressKey}`);
        if (balanceRes.data) {
          if (typeof balanceRes.data.balance === 'number') {
            setUserPoints(balanceRes.data.balance);
          }
          if (Array.isArray(balanceRes.data.history)) {
            setEarnHistory(balanceRes.data.history); 
          }
        }
      } catch (e) {
        console.warn("后端积分接口异常，回退默认分数");
        setUserPoints(200); 
      }

      try {
        const historyRes = await axios.post('http://localhost:3000/shop/history', { userAddress: addressKey });
        setRedemptionHistory(historyRes.data || []);
      } catch (e) {
        console.warn("未找到兑换记录");
      }

    } catch (err) {
      console.error("同步后端数据失败", err);
    }
  };

  useEffect(() => {
    if (userAddress) {
      syncDataFromBackend(userAddress);
    } else {
      setUserPoints(0);
      setEarnHistory([]);
      setRedemptionHistory([]);
    }
  }, [userAddress]);

  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) setUserAddress(accounts[0]); 
      } catch (error: any) {
        if (error.code === 4001) alert("❌ 您拒绝了 MetaMask 连接请求");
        else alert("❌ 连接钱包失败，请确保您已登录并解锁 MetaMask");
      } finally { setIsConnecting(false); }
    } else { alert("🦊 您的浏览器似乎没有安装 MetaMask 插件，请先安装！"); }
  };

  const handleNavClick = (tab: 'home' | 'library' | 'mall' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'profile' && userAddress) {
      syncDataFromBackend(userAddress);
    }
    if (tab !== 'library') { setSearchQuery(''); setSelectedCategory('全部'); }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const requestBody = { userAddress: currentUser, totalPoints: userPoints, streakDays: 3 };
        const response = await axios.post('/ai-api/api/recommend', requestBody, {
          headers: { 'X-Tunnel-Skip-AntiPhishing-Page': 'true' }
        });

        let rawCourses = [];
        if (Array.isArray(response.data)) {
           rawCourses = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
           rawCourses = response.data.data;
        }

        if (rawCourses.length > 0) {
           const formattedCourses = rawCourses.map((course: any, index: number) => {
             const demoDuration = Math.floor(Math.random() * 16) + 5; 
             const backendVideoLink = course.video_url || course.videoUrl || course.url || course.link || course.videoLink || "";
             
             let finalQuestions = course.questions;
             if (!finalQuestions || typeof finalQuestions[0] === 'string' || !finalQuestions[0].correctAnswer) {
                 finalQuestions = [
                    {
                      type: 'choice',
                      question: `关于本节课《${course.title || 'Web3 技术'}》的内容，以下描述最准确的是？`,
                      options: [
                        'A. 它降低了系统的整体安全性', 
                        `B. 它大幅提升了《${course.title || '该技术'}》在网络中的应用效率`, 
                        'C. 它完全不需要任何共识机制即可运行', 
                        'D. 只有管理员可以随意修改底层数据'
                      ],
                      correctAnswer: `B. 它大幅提升了《${course.title || '该技术'}》在网络中的应用效率`
                    },
                    {
                      type: 'boolean',
                      question: `【判断题】在实际的 Web3 项目开发中，安全审计和多维度防护是必不可少的环节。`,
                      options: ['对 (True)', '错 (False)'],
                      correctAnswer: '对 (True)' 
                    }
                 ];
             }

             return {
               ...course,
               baseReward: demoDuration, 
               minStudyTime: demoDuration,
               videoUrl: backendVideoLink,
               _imageIndex: index % fallbackImages.length,
               questions: finalQuestions
             };
           });
           setRecommendations(formattedCourses);
        } else {
           throw new Error("AI 返回数据为空，触发兜底");
        }

      } catch (error: any) {
        console.error("❌ 接口异常，启动兜底数据");
        const fallbackCourses = [
          {
            id: "mock_01",
            title: "零知识证明(ZKP)核心原理与应用实战",
            videoUrl: "BV13Q4y1C7hS", 
            difficulty: 3,
            baseReward: 20,
            minStudyTime: 5,
            _imageIndex: 0,
            questions: [
              {
                type: "choice",
                question: "关于《零知识证明》的内容，以下描述正确的是？",
                options: ["A. 它降低了系统的整体安全性", "B. 可以在不泄露真实数据的情况下证明自己拥有数据", "C. 只能在以太坊主网上运行", "D. 它需要暴露用户的私钥"],
                correctAnswer: "B. 可以在不泄露真实数据的情况下证明自己拥有数据"
              },
              {
                type: "boolean",
                question: "【判断题】应用 ZKP 技术可以彻底避免所有的智能合约业务逻辑漏洞。",
                options: ["对 (True)", "错 (False)"],
                correctAnswer: "错 (False)"
              }
            ]
          },
          {
            id: "mock_02",
            title: "Solidity 智能合约安全审计入门",
            videoUrl: "BV1St41117KV",
            difficulty: 4,
            baseReward: 25,
            minStudyTime: 5,
            _imageIndex: 3,
            questions: [
              {
                type: "choice",
                question: "防范重入攻击（Reentrancy Attack）的核心设计模式是？",
                options: ["A. 尽量多使用 delegatecall", "B. 将资产集中存在单个地址", "C. 检查-生效-交互模式 (CEI)", "D. 不使用 require 语句验证参数"],
                correctAnswer: "C. 检查-生效-交互模式 (CEI)"
              },
              {
                type: "boolean",
                question: "【判断题】在以太坊生态开发中，安全审计是项目主网上线前不可或缺的一环。",
                options: ["对 (True)", "错 (False)"],
                correctAnswer: "对 (True)"
              }
            ]
          },
          {
            id: "mock_03",
            title: "Web3.0 去中心化存储协议 (IPFS) 解析",
            videoUrl: "BV1qP4y1h7k6",
            difficulty: 2,
            baseReward: 15,
            minStudyTime: 5,
            _imageIndex: 6,
            questions: [
              {
                type: "choice",
                question: "IPFS 的寻址方式与传统的 HTTP 协议最大的区别是？",
                options: ["A. IPFS 速度永远比传统网络慢", "B. HTTP 是完全去中心化的架构", "C. IPFS 必须依赖 AWS 中心化机房", "D. IPFS 使用内容寻址，HTTP 使用位置寻址"],
                correctAnswer: "D. IPFS 使用内容寻址，HTTP 使用位置寻址"
              },
              {
                type: "boolean",
                question: "【判断题】只要把文件上传到纯 IPFS 网络，即使没有任何节点提供固定服务，文件也永远不会丢失。",
                options: ["对 (True)", "错 (False)"],
                correctAnswer: "错 (False)"
              }
            ]
          }
        ];
        setRecommendations(fallbackCourses);
      } finally {
        setLoading(false)
      }
    }
    fetchRecommendations()
  }, [currentUser]) 

  useEffect(() => {
    if (!selectedCourse || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [selectedCourse, timeLeft]);

  const handleEnterCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsViewingVideo(true);
    setTimeLeft(course.minStudyTime);
    setAnswers(new Array(course.questions.length).fill(""));
  };

  const handleSubmit = async () => {
    if (!userAddress) return alert("⚠️ 请先在页面右上角连接您的 Web3 钱包！");
    
    if (answers.includes("") || answers.length < selectedCourse!.questions.length) {
      alert("⚠️ 老师说：必须答完所有的选择题和判断题才能交卷哦！");
      return;
    }

    setIsSubmitting(true);
    
    const expectedAnswers = selectedCourse?.questions.map((q: any) => q.correctAnswer);
    let isPassed = true;
    
    if (expectedAnswers && expectedAnswers.length > 0) {
      for (let i = 0; i < expectedAnswers.length; i++) {
        if (answers[i] !== expectedAnswers[i]) { isPassed = false; break; }
      }
    } else { isPassed = false; }

    setTimeout(async () => {
      setIsSubmitting(false);
      
      if (isPassed) {
        const reward = selectedCourse?.baseReward || 20;
        alert(`🎉 判卷通过，您选择了正确的答案！\n获得积分: ${reward}\n(积分即将同步至您的 Web3 账户)`);
        
        try {
          await axios.post('http://localhost:3000/study/submit', {
            userAddress: currentUser, 
            courseId: selectedCourse?.id, 
            title: selectedCourse?.title, 
            baseReward: reward, 
            answers: answers, 
            expectedAnswers: expectedAnswers
          });
          syncDataFromBackend(userAddress); 
        } catch (e) {
          console.warn("日志写入后端失败");
        }

        setSelectedCourse(null);

      } else {
        alert(`❌ 抱歉，答题有误！未能通过本节考核，请重新核实知识点。`);
      }
    }, 1500); 
  };

  const handleRedeem = async (item: typeof mallItems[0]) => {
    if (!userAddress) return alert("⚠️ 请先在页面右上角连接您的 Web3 钱包！");
    
    if (userPoints >= item.points) {
      const confirm = window.confirm(`确定花费 ${item.points} 积分兑换【${item.name}】吗？\n\n即将唤起 MetaMask 进行智能合约交互！`);
      if (confirm) {
        setIsMinting(true);
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          
          let safeAddress = NFT_CONTRACT_ADDRESS.trim();
          if (safeAddress.length > 42) safeAddress = safeAddress.substring(0, 42);

          const contract = new ethers.Contract(safeAddress, NFT_CONTRACT_ABI, signer);
          const tx = await contract.mintBadge(userAddress, String(item.id));
          
          alert("⏳ 交易已提交，正在等待区块链节点打包确认...");
          await tx.wait(); 

          try {
             await axios.post('http://localhost:3000/shop/redeem', { userAddress: currentUser, itemName: item.name, cost: item.points });
             syncDataFromBackend(userAddress); 
          } catch(e) {
             console.warn("兑换日志写入后端失败");
          }

          alert('✅ 兑换成功！合约交互已上链，NFT 徽章已发放！');
        } catch (error: any) {
          console.error("兑换失败:", error);
          if (error.code === 'ACTION_REJECTED') alert('❌ 操作已取消：您在 MetaMask 中拒绝了交易。');
          else alert('❌ 智能合约交互失败！请确保您的 MetaMask 已切换至 Sepolia 测试网。');
        } finally { setIsMinting(false); }
      }
    } else { alert(`❌ 积分不足！还差 ${item.points - userPoints} 积分，快去上课赚取吧！`); }
  };

  const handleUpgradePro = async () => {
    if (!userAddress) return alert("⚠️ 请先连接钱包！");
    if (window.confirm("🔥 升级 SkillNet PRO 节点\n\n解锁特权：\n1. AI 导师 1v1 实时代码纠错\n2. 每日积分收益翻倍\n\n测试模式：唤起钱包支付极少量 Gas 费确认。")) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({ to: userAddress, value: 0n });
        alert("⏳ 正在等待网络确认...");
        await tx.wait(); 
        alert("✅ 支付成功！智能合约确认完毕，欢迎成为 PRO 会员！");
      } catch (error: any) { alert('❌ 升级取消或失败。'); }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const filteredCourses = recommendations.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === '全部' || course.title.includes(selectedCategory);
    return matchSearch && matchCategory;
  });

  const top3Recommendations = recommendations.length >= 3 ? recommendations.slice(0, 3) : recommendations;
  const getCourseImage = (course: any) => course._imageIndex !== undefined ? fallbackImages[course._imageIndex] : fallbackImages[0];

  const displayedEarnHistory = showAllEarn ? earnHistory : earnHistory.slice(0, 3);
  const displayedRedeemHistory = showAllRedeem ? redemptionHistory : redemptionHistory.slice(0, 3);

  const renderCourseCard = (course: any) => (
    <div key={course.id} className="group bg-[#1A1D27] border border-gray-800 rounded-2xl p-5 hover:border-blue-500 transition-all duration-300 shadow-lg flex flex-col h-full">
      <div className="h-44 rounded-xl overflow-hidden mb-5 relative shrink-0">
        <img src={getCourseImage(course)} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-blue-400">难度 Lvl.{course.difficulty || 1}</div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 flex-grow" title={course.title}>{course.title}</h3>
      <div className="flex items-center justify-between text-sm text-gray-400 mb-5 shrink-0 mt-auto">
        <span>预计收益: <span className="text-purple-400 font-bold">+{course.baseReward} 积分</span></span>
        <span>演示时长: {course.minStudyTime}s</span>
      </div>
      <button onClick={() => handleEnterCourse(course)} className="w-full shrink-0 bg-[#252936] text-white py-3 rounded-lg font-bold hover:bg-blue-500 transition-colors">进入课程</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F111A] text-white relative font-sans">
      <nav className="sticky top-0 z-40 bg-[#0F111A]/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('home')}>
            <img src={logoImg} alt="SkillNet Logo" className="w-10 h-10 object-contain rounded-full" />
            <span className="text-2xl font-bold tracking-tighter">SkillNet</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium">
            <button onClick={() => handleNavClick('home')} className={`hover:text-blue-400 transition-colors ${activeTab === 'home' ? 'text-blue-400' : 'text-gray-300'}`}>首页推荐</button>
            <button onClick={() => handleNavClick('library')} className={`hover:text-blue-400 transition-colors ${activeTab === 'library' ? 'text-blue-400' : 'text-gray-300'}`}>课程海库</button>
            <button onClick={() => handleNavClick('mall')} className={`hover:text-blue-400 transition-colors ${activeTab === 'mall' ? 'text-blue-400' : 'text-gray-300'}`}>积分商城</button>
            <button onClick={() => handleNavClick('profile')} className={`hover:text-blue-400 transition-colors ${activeTab === 'profile' ? 'text-blue-400' : 'text-gray-300'}`}>个人中心</button>
            <div className="flex items-center gap-4">
              <span className="text-purple-400 font-bold border border-purple-400/30 bg-purple-400/10 px-3 py-1 rounded-full">💎 {userPoints} 积分</span>
              <button onClick={connectWallet} disabled={isConnecting} className="bg-gradient-to-r from-blue-500 to-blue-400 text-white px-5 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30">
                {userAddress ? `🦊 ${userAddress.substring(0, 6)}...${userAddress.substring(38)}` : (isConnecting ? '连接中...' : '🔌 连接钱包')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {activeTab === 'home' && (
        <>
          <header className="py-24 px-6">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-medium mb-6 border border-purple-500/30">AI 驱动 · Web3 激励</span>
                <h1 className="text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">掌握未来技术，<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">边学边赚积分</span></h1>
                <p className="text-lg text-gray-400 mb-10 max-w-lg leading-relaxed">SkillNet 利用 AI 为你量身定制 Web3 学习路径。听课答题赢取 Token 凭证。</p>
                <button onClick={() => handleNavClick('library')} className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-8 py-3.5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/25">开启我的学习之旅 →</button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl"></div>
                <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop" alt="Code on screen" className="relative rounded-2xl border border-gray-700 shadow-2xl object-cover" />
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-10">为你专属推荐</h2>
            {loading ? <div className="text-blue-400">呼叫 AI 大脑中...</div> : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {top3Recommendations.map((course) => renderCourseCard(course))}
               </div>
            )}
          </main>
        </>
      )}

      {activeTab === 'library' && (
        <main className="max-w-7xl mx-auto px-6 py-12 min-h-screen animate-fade-in">
          <div className="bg-[#1A1D27] border border-gray-800 rounded-3xl p-8 mb-10 shadow-xl">
            <h2 className="text-3xl font-extrabold text-white mb-6">全网课程海库</h2>
            <div className="relative w-full md:w-1/2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
              <input type="text" placeholder="搜索课程..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0F111A] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(renderCourseCard)}
          </div>
        </main>
      )}

      {activeTab === 'mall' && (
        <main className="max-w-7xl mx-auto px-6 py-16 min-h-[70vh] animate-fade-in">
          <div className="mb-12"><h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">积分商城</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mallItems.map((item) => {
              const canAfford = userPoints >= item.points;
              return (
                <div key={item.id} className="bg-[#1A1D27] border border-gray-800 rounded-2xl p-4 flex flex-col hover:-translate-y-1 transition-all">
                  <div className="h-48 rounded-xl overflow-hidden mb-4"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                  <h3 className="text-lg font-bold text-white mb-2 flex-grow">{item.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-purple-400 font-bold text-lg">💎 {item.points}</span>
                    <button 
                      onClick={() => handleRedeem(item)} 
                      disabled={isMinting || !canAfford}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${canAfford ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                      {isMinting ? '交互中...' : '链上兑换'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {activeTab === 'profile' && (
        <main className="max-w-4xl mx-auto px-6 py-16 min-h-[70vh] animate-fade-in">
          <div className="bg-gradient-to-br from-[#1A1D27] to-[#0F111A] border border-gray-800 rounded-3xl p-8 flex items-center gap-8 mb-12 shadow-2xl relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-1"><div className="w-full h-full bg-[#0F111A] rounded-full flex items-center justify-center"><span className="text-4xl">🧑‍💻</span></div></div>
            <div className="flex-grow">
              <h2 className="text-3xl font-extrabold text-white mb-2">Web3 极客先锋</h2>
              <p className="text-gray-400 font-mono text-sm mb-4">{userAddress || "尚未连接钱包"}</p>
              <button 
                onClick={handleUpgradePro} 
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform flex items-center gap-2"
              >
                🔥 升级 SkillNet PRO
              </button>
            </div>
            <div className="text-right border-l border-gray-700 pl-8"><p className="text-gray-400 text-sm">可用积分</p><p className="text-5xl font-black text-blue-400">{userPoints}</p></div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-6">我的获取记录</h3>
          <div className="space-y-4 mb-6">
            {earnHistory.length === 0 ? <p className="text-gray-500 bg-[#1A1D27] p-5 rounded-xl border border-gray-800">暂无获取记录，快去学习赚积分吧！</p> : displayedEarnHistory.map((record, idx) => (
              <div key={idx} className="bg-[#1A1D27] border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                <div><h4 className="text-white font-bold">学习：{record.title}</h4><p className="text-gray-500 text-sm">{formatDate(record.createdAt)}</p></div>
                <span className="text-green-400 font-bold text-lg">+{record.reward} 积分</span>
              </div>
            ))}
          </div>
          {earnHistory.length > 3 && (
            <button onClick={() => setShowAllEarn(!showAllEarn)} className="w-full py-3 mb-12 rounded-xl border border-gray-800 text-gray-400 hover:text-blue-400 hover:border-blue-500/50 transition-colors font-bold text-sm bg-[#1A1D27]/50">
              {showAllEarn ? '收起记录 ∧' : `查看其余 ${earnHistory.length - 3} 条记录 ∨`}
            </button>
          )}

          <h3 className="text-2xl font-bold text-white mb-6">我的兑换记录</h3>
          <div className="space-y-4 mb-6">
            {redemptionHistory.length === 0 ? <p className="text-gray-500 bg-[#1A1D27] p-5 rounded-xl border border-gray-800">暂无兑换记录</p> : displayedRedeemHistory.map((record, idx) => (
              <div key={idx} className="bg-[#1A1D27] border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                <div><h4 className="text-white font-bold">兑换：{record.itemName}</h4><p className="text-gray-500 text-sm">{formatDate(record.createdAt)}</p></div>
                <span className="text-red-400 font-bold text-lg">-{record.cost} 积分</span>
              </div>
            ))}
          </div>
          {redemptionHistory.length > 3 && (
            <button onClick={() => setShowAllRedeem(!showAllRedeem)} className="w-full py-3 rounded-xl border border-gray-800 text-gray-400 hover:text-blue-400 hover:border-blue-500/50 transition-colors font-bold text-sm bg-[#1A1D27]/50">
              {showAllRedeem ? '收起记录 ∧' : `查看其余 ${redemptionHistory.length - 3} 条记录 ∨`}
            </button>
          )}

        </main>
      )}

      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#1A1D27] border border-gray-700 rounded-2xl p-8 max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh]">
            <button onClick={() => setSelectedCourse(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-3xl font-bold text-white mb-6 pr-8 truncate">{selectedCourse.title}</h2>
            
            <div className="overflow-y-auto flex-grow pr-2 hide-scrollbar">
              {isViewingVideo ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                  {selectedCourse.videoUrl ? (
                    <iframe src={`https://player.bilibili.com/player.html?bvid=${extractBvid(selectedCourse.videoUrl)}&page=1&high_quality=1&danmaku=0`} className="w-full h-full" frameBorder="0" allowFullScreen referrerPolicy="no-referrer"></iframe>
                  ) : <p className="text-center mt-20">等待视频链接...</p>}
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedCourse.questions.map((q: any, index: number) => (
                    <div key={index} className="bg-[#0F111A] p-6 rounded-xl border border-gray-800">
                      <p className="text-gray-200 mb-4 font-medium text-lg">
                        <span className="text-blue-400 mr-2">Q{index + 1}.</span> 
                        {q.question || q}
                      </p>
                      
                      {q.options ? (
                        <div className="flex flex-col gap-3">
                          {q.options.map((opt: string, optIdx: number) => (
                            <label key={optIdx} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${answers[index] === opt ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500 bg-[#1A1D27]'}`}>
                              <input 
                                type="radio" 
                                name={`question-${index}`} 
                                value={opt}
                                checked={answers[index] === opt}
                                onChange={(e) => {
                                  const newAnswers = [...answers];
                                  newAnswers[index] = e.target.value;
                                  setAnswers(newAnswers);
                                }}
                                className="w-5 h-5 text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input className="w-full bg-[#1A1D27] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-400 outline-none" placeholder="请填写答案..." value={answers[index]} onChange={(e) => { const newAnswers = [...answers]; newAnswers[index] = e.target.value; setAnswers(newAnswers); }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 shrink-0">
              <button onClick={isViewingVideo ? () => setIsViewingVideo(false) : handleSubmit} disabled={isViewingVideo ? timeLeft > 0 : isSubmitting} className="w-full py-4 rounded-xl font-bold bg-blue-500 text-white disabled:bg-gray-800 disabled:text-gray-500 transition-colors text-lg shadow-lg shadow-blue-500/20">
                {isViewingVideo ? (timeLeft > 0 ? `专注学习中... (${timeLeft}s)` : "🎓 学习完成，进入考核") : (isSubmitting ? "正在通过 AI 节点严格判卷..." : "🚀 提交试卷并领取积分")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App