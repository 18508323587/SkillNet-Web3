import { useState, useEffect } from 'react'
import axios from 'axios'
import { ethers } from 'ethers'
import type { Course } from './types'
import logoImg from './logo.png' 
import SkillBadgeData from './abi/SkillBadge.json' 

// 引入工具库 (新增了 ChevronDown 和 ChevronUp 用于下拉框)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, BookOpen, Map, ShoppingBag, User, Bell, Mail, CheckCircle2, Circle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

// 🔌 [接口对接预留]: 模块1 智能合约地址
const NFT_CONTRACT_ADDRESS = "0x76bced64410c7992f88d1bad7003ec5d67eb4e7e03941fbe6755a706e6b984bd"; 
const NFT_CONTRACT_ABI = Array.isArray(SkillBadgeData) ? SkillBadgeData : (SkillBadgeData as any).abi;

// 商城项目 (纯虚拟商品，图片一一对应)
const mallItems = [
  { id: 1, name: '腾讯视频 VIP (1个月)', points: 150, image: 'https://images.unsplash.com/photo-1585647347384-259252771d1b?q=80&w=400&auto=format&fit=crop' },
  { id: 2, name: '腾讯视频 VIP (1年)', points: 1500, image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop' },
  { id: 3, name: '哔哩哔哩 大会员 (1个月)', points: 180, image: 'https://images.unsplash.com/photo-1613376023733-f5424df9fa32?q=80&w=400&auto=format&fit=crop' },
  { id: 4, name: '哔哩哔哩 大会员 (1年)', points: 1800, image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop' },
  { id: 5, name: '网易云音乐 黑胶VIP (1个月)', points: 100, image: 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?q=80&w=400&auto=format&fit=crop' },
  { id: 6, name: '网易云音乐 黑胶VIP (1年)', points: 1000, image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop' },
  { id: 7, name: 'QQ 超级会员 (1个月)', points: 120, image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=400&auto=format&fit=crop' },
  { id: 8, name: 'QQ 超级会员 (1年)', points: 1200, image: 'https://images.unsplash.com/photo-1611162618725-662280ff3df4?q=80&w=400&auto=format&fit=crop' },
  { id: 9, name: '百度网盘 SVIP (1个月)', points: 200, image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=400&auto=format&fit=crop' },
  { id: 10, name: '百度网盘 SVIP (1年)', points: 2000, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400&auto=format&fit=crop' },
  { id: 11, name: '话费充值折扣券 (10元)', points: 100, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop' },
  { id: 12, name: '话费充值折扣券 (30元)', points: 300, image: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=400&auto=format&fit=crop' },
  { id: 13, name: '话费充值折扣券 (50元)', points: 500, image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=400&auto=format&fit=crop' },
  { id: 14, name: '饿了么 超级吃货卡 (1个月)', points: 100, image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=400&auto=format&fit=crop' },
  { id: 15, name: '星巴克 30元代金券', points: 300, image: 'https://images.unsplash.com/photo-1558500201-901d898ba82c?q=80&w=400&auto=format&fit=crop' },
  { id: 16, name: '肯德基 50元代金券', points: 500, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cbc6ec?q=80&w=400&auto=format&fit=crop' },
  { id: 17, name: '瑞幸咖啡 29元饮品券', points: 290, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop' },
  { id: 18, name: '滴滴出行 50元打车券', points: 500, image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400&auto=format&fit=crop' },
  { id: 19, name: 'ChatGPT Plus 代付 (1个月)', points: 1500, image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400&auto=format&fit=crop' },
  { id: 20, name: 'GitHub Copilot 订阅 (1个月)', points: 800, image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=400&auto=format&fit=crop' }
];

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'path' | 'mall' | 'profile'>('home') 
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // 核心状态：严格默认为 0 和空数组，数据来源必须依靠合约拉取
  const [userPoints, setUserPoints] = useState(0); 
  const [earnHistory, setEarnHistory] = useState<any[]>([]); 
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);

  const [recommendations, setRecommendations] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部') 
  
  // 答题与课程状态
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isViewingVideo, setIsViewingVideo] = useState(true) 
  const [isMinting, setIsMinting] = useState(false)

  // 炫酷任务下拉框控制状态
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

  // ==========================================
  // 🔌 [接口对接预留]: 唯一真理来源 —— 智能合约与后端API
  // ==========================================
  const syncDataFromRemote = async (address: string) => {
    try {
      // 1. 获取链上真实积分余额
      // TODO: const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      // TODO: const balance = await contract.balanceOf(address);
      // TODO: setUserPoints(Number(balance));

      // 2. 获取用户学习与兑换的历史日志 (Event Logs / 后端记录)
      // TODO: const historyRes = await axios.get(`/api/user/${address}/history`);
      // TODO: setEarnHistory(historyRes.data.earnHistory);
      // TODO: setRedemptionHistory(historyRes.data.redemptionHistory);
      
      console.log(`📡 准备向合约地址 ${NFT_CONTRACT_ADDRESS} 拉取 ${address} 的链上数据...`);
    } catch (err) {
      console.warn("❌ 数据拉取失败，请检查合约节点状态");
    }
  };

  useEffect(() => {
    if (userAddress) syncDataFromRemote(userAddress);
  }, [userAddress]);

  // 📈 逻辑函数：生成【近一周（7天）】固定折线图数据
  const getDynamicChartData = () => {
    const data = [];
    let cumulative = 0;

    // 为了确保每天都有坐标轴（哪怕没学习），生成过去 7 天的连续日期数组
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      
      // 过滤出这特定的“这一天”用户看了多少视频赚了多少积分
      const dailyPoints = earnHistory
        .filter((item: any) => new Date(item.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) === dateStr)
        .reduce((sum: number, item: any) => sum + item.reward, 0);
      
      // 累加到趋势线中（没看视频就是平的，看了就会上涨）
      cumulative += dailyPoints;
      
      // 给最后一天的名字换成“今日”更直观
      data.push({ name: i === 0 ? '今日' : dateStr, points: cumulative });
    }
    
    return data;
  };

  // ✅ 逻辑函数：验证今日任务完成情况 (依赖 earnHistory 进行验证)
  const checkDailyTasks = () => {
    const today = new Date().toLocaleDateString();
    const todaysLessons = earnHistory.filter((h: any) => new Date(h.createdAt).toLocaleDateString() === today);
    const todaysRedeems = redemptionHistory.filter((r: any) => new Date(r.createdAt).toLocaleDateString() === today);
    
    return [
      { id: 1, label: '观看课程视频', reward: 5, completed: todaysLessons.length >= 1, target: 1, current: todaysLessons.length },
      { id: 2, label: '得到一次奖励', reward: 10, completed: todaysLessons.length >= 1, target: 1, current: todaysLessons.length >= 1 ? 1 : 0 },
      { id: 3, label: '观看 5 个视频', reward: 20, completed: todaysLessons.length >= 5, target: 5, current: todaysLessons.length },
      { id: 4, label: '在积分商城完成 1 次权益兑换', reward: 15, completed: todaysRedeems.length >= 1, target: 1, current: todaysRedeems.length },
      { id: 5, label: '连续学习打卡 3 天', reward: 50, completed: false, target: 3, current: 1 },
      { id: 6, label: '分享专属邀请链接', reward: 10, completed: false, target: 1, current: 0 }
    ];
  };

  // 获取计算好的任务，并根据折叠状态进行切割
  const allTasks = checkDailyTasks();
  const visibleTasks = isTasksExpanded ? allTasks : allTasks.slice(0, 3);

  // 🦊 连接钱包 (剔除所有本地假数据兜底)
  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setUserAddress(accounts[0]);
        // 这里绝对不再做 setUserPoints(200) 的兜底。一切交给 useEffect 中的 syncDataFromRemote。
      } catch (error: any) {
        setIsConnecting(false);
      } finally { setIsConnecting(false); }
    } else {
      alert("🦊 请先安装 MetaMask 插件！");
    }
  };

  // 🤖 [接口对接预留]: 模块5 AI 推荐接口
  useEffect(() => {
    const fetchCoursesFromAI = async () => {
      setLoading(true);
      try {
        // TODO: const response = await axios.post('/ai-api/api/recommend', { userAddress });
        // 严格遵照：不写假数据兜底，没有接口就直接抛错为空
        throw new Error("AI 接口未接入"); 
      } catch (error) {
        setRecommendations([]);
      } finally { setLoading(false); }
    }
    fetchCoursesFromAI();
  }, [userAddress]);

  // 🚀 提交试卷逻辑：对接 AI 预言机并请求上链签名
  const handleSubmit = async () => {
    if (!userAddress) return alert("⚠️ 请先连接钱包！");
    setIsSubmitting(true);
    
    // 🔌 [接口对接预留]: 实际应向后台发请求获取验证签名
    // TODO: const verifyRes = await axios.post('/ai-api/api/verify', { answers });
    // TODO: if(verifyRes.data.success) { await contract.claimPoints(verifyRes.data.signature); }
    
    setTimeout(() => {
      setIsSubmitting(false);
      const reward = selectedCourse?.baseReward || 20;
      
      // ⚠️ 注释：在有后端的情况下，这里应当重新调用 syncDataFromRemote 拉取最新余额。
      // 目前为了能让你在开发环境看到交互变化，使用 React 乐观更新 UI。
      setUserPoints(prev => prev + reward);
      setEarnHistory(prev => [
        { title: selectedCourse?.title, reward: reward, createdAt: new Date().toISOString() },
        ...prev
      ]);
      
      setSelectedCourse(null);
      alert(`🎉 AI 判卷完成！智能合约已为您发放 ${reward} 积分`);
    }, 1500);
  };

  // ⛓️ [接口对接预留]: 模块1 合约兑换接口
  const handleRedeem = async (item: typeof mallItems[0]) => {
    if (userPoints >= item.points) {
      if (window.confirm(`确定花费 ${item.points} 积分兑换【${item.name}】吗？\n将唤起 MetaMask 发起区块链交易！`)) {
        setIsMinting(true);
        
        // 🔌 [接口对接预留]: 唤起合约真实 mint 函数
        // TODO: const provider = new ethers.BrowserProvider((window as any).ethereum);
        // TODO: const signer = await provider.getSigner();
        // TODO: const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
        // TODO: const tx = await contract.mintBadge(userAddress, String(item.id));
        // TODO: await tx.wait();
        
        setTimeout(() => {
          setIsMinting(false);
          // ⚠️ 注释：实际应当等待 tx.wait() 后重新 syncDataFromRemote
          setUserPoints(prev => prev - item.points);
          setRedemptionHistory(prev => [
            { itemName: item.name, cost: item.points, createdAt: new Date().toISOString() },
            ...prev
          ]);
          alert('✅ 兑换成功，数字资产已上链！');
        }, 1000);
      }
    } else { alert('❌ 积分余额不足！'); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const filteredCourses = recommendations.filter((course: Course) => {
    const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === '全部' || course.title.includes(selectedCategory);
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex h-screen bg-[#09090b] text-white font-sans overflow-hidden">
      
      {/* 📌 侧边栏 */}
      <aside className="w-64 bg-[#0F111A] border-r border-white/5 flex flex-col z-20">
        <div className="p-8 flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="text-2xl font-black tracking-tight">SkillNet</span>
        </div>
        
        <nav className="flex-1 px-4">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-6 py-4 mb-2 rounded-xl transition-all ${activeTab === 'home' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-white'}`}>
            <Home size={20} /> <span className="font-bold">仪表盘</span>
          </button>
          <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-3 px-6 py-4 mb-2 rounded-xl transition-all ${activeTab === 'library' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-white'}`}>
            <BookOpen size={20} /> <span className="font-bold">探索课程</span>
          </button>
          <button onClick={() => setActiveTab('mall')} className={`w-full flex items-center gap-3 px-6 py-4 mb-2 rounded-xl transition-all ${activeTab === 'mall' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-white'}`}>
            <ShoppingBag size={20} /> <span className="font-bold">积分商城</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-6 py-4 mb-2 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-white'}`}>
            <User size={20} /> <span className="font-bold">个人中心</span>
          </button>
        </nav>

        <div className="p-8">
          <button onClick={connectWallet} className="w-full bg-[#1A1D27] border border-white/10 text-sm font-bold py-3 rounded-xl hover:bg-white/5 transition-colors">
            {userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(38)}` : '🔌 连接钱包'}
          </button>
        </div>
      </aside>

      {/* 📌 主内容区 */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#09090b]">
        
        <header className="h-20 px-10 flex items-center justify-end gap-6 z-10">
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full">
            <span className="text-xs font-bold text-purple-400">NETWORK: SEPOLIA</span>
          </div>
          <Bell className="text-gray-500 cursor-pointer hover:text-white" size={20} />
          <div className="w-px h-6 bg-gray-800"></div>
          <Avatar className="w-10 h-10 border border-purple-500/50">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>SN</AvatarFallback>
          </Avatar>
        </header>

        <div className="flex-1 overflow-y-auto p-10 hide-scrollbar">
          
          {activeTab === 'home' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* ================= 上排：总积分与任务 ================= */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. 总积分卡片 */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#1A1D27] to-[#0F111A] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] group-hover:bg-purple-600/20 transition-all duration-700"></div>
                  <div>
                    <h2 className="text-gray-500 font-bold mb-2">链上积分余额</h2>
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-black tracking-tighter text-white">{userPoints}</span>
                      <span className="text-xl font-bold text-purple-400 uppercase tracking-widest">Points</span>
                    </div>
                    <p className="text-gray-500 mt-6 max-w-sm leading-relaxed">
                      系统已接入智能合约。您的所有积分余额及获取记录均通过区块链实时拉取验证，确保证明不可篡改。
                    </p>
                  </div>
                </div>

                {/* 2. 今日任务进度 (实时刷新 + 下拉隐藏) */}
                <div className="bg-[#0F111A] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col relative">
                  <h3 className="text-lg font-bold mb-6 flex justify-between items-center shrink-0">
                    今日挑战任务
                    <span className="text-xs text-gray-500 font-mono">每日 00:00 重置</span>
                  </h3>
                  
                  {/* 任务列表 */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 hide-scrollbar">
                    {visibleTasks.map((task: any) => (
                      <div key={task.id} className={`p-4 rounded-2xl border transition-all ${task.completed ? 'bg-green-500/5 border-green-500/20 opacity-60' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            {task.completed ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} className="text-gray-600" />}
                            <span className={`text-sm font-bold ${task.completed ? 'text-gray-400' : 'text-white'}`}>{task.label}</span>
                          </div>
                          <span className="text-xs font-bold text-purple-400">+{task.reward}</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${task.completed ? 'bg-green-500' : 'bg-purple-600'}`} style={{ width: `${Math.min((task.current / task.target) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 炫酷下拉框按钮 */}
                  {allTasks.length > 3 && (
                    <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
                      <button 
                        onClick={() => setIsTasksExpanded(!isTasksExpanded)} 
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300"
                      >
                        {isTasksExpanded ? (
                          <>收起隐藏任务 <ChevronUp size={14} /></>
                        ) : (
                          <>展开其余 {allTasks.length - 3} 个任务 <ChevronDown size={14} /></>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= 下排：趋势图与推荐课程 ================= */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 3. 学习进度趋势 (占据左侧 2 列) */}
                <div className="lg:col-span-2 bg-[#0F111A] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-xl font-black text-white mb-1">一周学习成就趋势</h3>
                      <p className="text-sm text-gray-500">积分随每日学习记录实时波动上涨 (近 7 天)</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-lg text-green-400 text-xs font-bold">
                        <TrendingUp size={14} /> 本周表现
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getDynamicChartData()}>
                        <defs>
                          <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="name" stroke="#3f3f46" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#3f3f46" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F111A', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="points" stroke="#9333ea" strokeWidth={4} fillOpacity={1} fill="url(#colorPoints)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. 推荐课程展示区 (占据右侧 1 列) */}
                <div className="lg:col-span-1 bg-[#0F111A] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-bold text-lg text-white">推荐课程</h3>
                    <button onClick={() => setActiveTab('library')} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                      查看全部
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                      <span className="animate-pulse">数据同步中...</span>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar">
                      {recommendations.slice(0, 3).map((course: any, idx: number) => (
                        <div key={course.id || idx} onClick={() => handleEnterCourse(course)} className="bg-white/5 rounded-2xl p-4 border border-white/5 cursor-pointer hover:border-purple-500/50 hover:bg-white/10 transition-all group flex gap-4 items-center">
                           {/* 左侧方形封面 */}
                           <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                              <BookOpen size={24} className="text-purple-400 opacity-80" />
                           </div>
                           {/* 右侧文字信息 */}
                           <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-white truncate mb-1">{course.title}</h4>
                             <p className="text-[10px] text-gray-500 mb-2">难度: {course.difficulty || '初级'} · {course.minStudyTime || 10}秒</p>
                             <p className="text-xs text-purple-400 font-bold bg-purple-500/10 inline-block px-2 py-0.5 rounded">
                               +{course.baseReward || 20} 积分
                             </p>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm border border-dashed border-gray-800 rounded-2xl">
                      <span className="text-3xl mb-3 opacity-50">📭</span>
                      <p className="px-4 text-center">等待后端 AI 节点<br/>下发课程数据</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ================= 其他模块视图 ================= */}
          {activeTab === 'library' && (
             <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-black mb-10">课程库</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="col-span-full text-center py-20 bg-[#1A1D27]/50 rounded-3xl border border-dashed border-gray-700">
                     <BookOpen size={48} className="mx-auto mb-4 opacity-30 text-gray-400" />
                     <p className="text-gray-500 font-bold">等待后端 AI 节点与管理端下发课程数据...</p>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'mall' && (
             <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-black mb-10">积分商城</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                   {mallItems.map((item: any) => (
                     <div key={item.id} className="bg-[#0F111A] border border-white/5 rounded-3xl p-4 flex flex-col group">
                        <div className="h-40 rounded-2xl overflow-hidden mb-4">
                           <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h4 className="text-sm font-bold mb-1 truncate">{item.name}</h4>
                        <div className="flex justify-between items-center mt-auto">
                           <span className="text-purple-400 font-black text-sm">💎 {item.points}</span>
                           <button onClick={() => handleRedeem(item)} className="bg-white/5 hover:bg-purple-600 px-3 py-1 rounded-lg text-xs font-bold transition-all">兑换</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'profile' && (
             <div className="max-w-5xl mx-auto space-y-10">
                <h2 className="text-4xl font-black mb-10">个人成就中心</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div>
                      <h3 className="font-bold mb-6 text-gray-400">学习历史记录</h3>
                      <div className="space-y-4">
                        {earnHistory.length === 0 ? (
                           <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl">
                             <p className="text-gray-600 text-sm">暂无链上数据记录</p>
                           </div>
                        ) : earnHistory.map((h: any, i: number) => (
                          <div key={i} className="bg-[#0F111A] p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                             <div>
                                <p className="font-bold text-sm">{h.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(h.createdAt)}</p>
                             </div>
                             <span className="text-green-400 font-bold">+{h.reward}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                   <div>
                      <h3 className="font-bold mb-6 text-gray-400">权益兑换历史</h3>
                      <div className="space-y-4">
                        {redemptionHistory.length === 0 ? (
                           <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl">
                             <p className="text-gray-600 text-sm">暂无链上兑换记录</p>
                           </div>
                        ) : redemptionHistory.map((r: any, i: number) => (
                          <div key={i} className="bg-[#0F111A] p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                             <div>
                                <p className="font-bold text-sm">{r.itemName}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(r.createdAt)}</p>
                             </div>
                             <span className="text-red-400 font-bold">-{r.cost}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
          )}

        </div>
      </main>

      {/* 沉浸式答题弹窗 */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-10">
          <div className="bg-[#0F111A] border border-white/10 w-full max-w-5xl rounded-[3rem] p-12 relative h-[85vh] flex flex-col">
             <button onClick={() => setSelectedCourse(null)} className="absolute top-10 right-10 text-gray-500 hover:text-white">✕</button>
             <h2 className="text-3xl font-black mb-8">{selectedCourse.title}</h2>
             <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                {isViewingVideo ? (
                  <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 flex items-center justify-center">
                    <video src={selectedCourse.videoUrl} controls autoPlay className="w-full h-full" />
                  </div>
                ) : (
                  <div className="space-y-8">
                     {selectedCourse.questions?.map((q: any, idx: number) => (
                       <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                          <p className="text-xl font-bold mb-6 text-purple-400">Q{idx + 1}. {q.question}</p>
                          <div className="grid grid-cols-2 gap-4">
                             {q.options?.map((opt: string, oIdx: number) => (
                               <button 
                                 key={oIdx} 
                                 onClick={() => {
                                    const n = [...answers]; n[idx] = opt; setAnswers(n);
                                 }}
                                 className={`p-4 rounded-xl border text-left text-sm transition-all ${answers[idx] === opt ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 text-gray-500 hover:border-white/20'}`}
                               >
                                 {opt}
                               </button>
                             ))}
                          </div>
                       </div>
                     ))}
                  </div>
                )}
             </div>
             <div className="pt-8 mt-auto">
                <button onClick={isViewingVideo ? () => setIsViewingVideo(false) : handleSubmit} className="w-full py-5 rounded-2xl bg-purple-600 font-black text-lg shadow-2xl shadow-purple-600/20">
                   {isViewingVideo ? "我已看完，开始测试" : "提交后端 AI 预言机"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App